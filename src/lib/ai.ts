/**
 * @file AI Utility Functions
 * @description integration with external AI services for intelligent
 * platform features.
 *
 * Capabilities:
 *   - Review sentiment analysis (Hugging Face)
 *   - Natural language search intent extraction (OpenRouter)
 *   - Business Chatbot (OpenRouter)
 *
 * Providers:
 *   - Hugging Face inference API — sentiment analysis
 *   - OpenRouter API — LLM-powered search intent extraction and chat
 *
 * Error handling philosophy:
 *   - All functions are designed to fail gracefully
 *   - All failures never block core platform functionality
 *   - Network errors, rate limits, invalid responses → return null
 *   - The caller decides what to do with null
 *
 * @see https://huggingface.co/docs/api-inference/index
 * @see https://openrouter.ai/docs
 */

import { DayOfWeek } from "@/generated/prisma/client";

// =============================================================================
// Types — Sentiment Analysis
// =============================================================================

/**
 * Result of a sentiment analysis request.
 * Null is returned when analysis fails or is unavailable.
 */
export interface SentimentResult {
  /** The dominant sentiment: "positive", "neutral", or "negative" */
  label: string;
  /** Confidence score for the dominant sentiment (0.0 to 1.0) */
  score: number;
}

/**
 * Raw response shape from the Hugging Face inference API.
 * The API returns an array of arrays — each inner array contains
 * all sentiment labels with their scores, sorted by confidence.
 */
interface HuggingFaceClassification {
  label: string;
  score: number;
}

// =============================================================================
// Types — Search Intent Extraction
// =============================================================================

/**
 * Structured search intent extracted from a natural language query.
 *
 * Each field is optional — the LLM only populates fields it can
 * confidently extract from the user's query. Null fields are ignored
 * when building the database query.
 */
export interface SearchIntent {
  /** Business category enum value (e.g., "BARBERSHOP", "SPA") */
  category?: string | null;
  /** Maximum price the customer is willing to pay (in ETB) */
  maxPrice?: number | null;
  /** Minimum acceptable average rating (1.0 – 5.0) */
  minRating?: number | null;
  /** City name to filter by */
  city?: string | null;
  /** Days of the week the customer wants availability */
  dayOfWeek?: DayOfWeek[] | null;
  /** Keywords related to specific services */
  serviceKeywords?: string[] | null;
  /** General search terms to match against business names/description */
  searchTerms?: string | null;
  /**
   * How results should be sorted.
   * "relevance" — composite score (rating × 0.4 + bookings × 0.3 + services × 0.3)
   * "rating"    — highest average rating first
   * "price"     — lowest service price first
   */
  sortBy?: "relevance" | "rating" | "price" | null;
  /** Human-readable explanation of what the AI understood */
  explanation?: string | null;
}

// =============================================================================
// Types — Chat Completion
// =============================================================================

/**
 * A single message in a chat conversation.
 * Uses the standard OpenAI-compatible role format.
 */
export interface ChatMessage {
  /** The role of the message sender. */
  role: "system" | "user" | "assistant";
  /** The message content */
  content: string;
}

/**
 * Result of a chat completion request.
 * Null is returned when the request fails.
 */
export interface ChatCompletionResult {
  /** The assistant's response message */
  content: string;
}

// =============================================================================
// Constants — Hugging Face
// =============================================================================

/** The Hugging Face model used for sentiment analysis. */
const SENTIMENT_MODEL = "cardiffnlp/twitter-roberta-base-sentiment-latest";

/** Hugging Face inference API base URL */
const HF_API_BASE = "https://router.huggingface.co/hf-inference/models";

/** Request timeout in milliseconds (5 seconds) */
const HF_REQUEST_TIMEOUT_MS = 5000;

/**
 * Minimum text length required for meaningful sentiment analysis.
 */
const MIN_TEXT_LENGTH = 3;

/**
 * Maximum text length sent to the model.
 */
const MAX_TEXT_LENGTH = 1000;

// =============================================================================
// Constants — OpenRouter
// =============================================================================

/** OpenRouter API base URL */
const OPENROUTER_API_BASE = "https://openrouter.ai/api/v1/chat/completions";

/** The LLM model used for search intent extraction..*/
const SEARCH_INTENT_MODEL = "deepseek/deepseek-chat";

/** The LLM model for business chatbot */
const CHAT_MODEL = "deepseek/deepseek-chat";

/** Request timeout for LLM calls (10 seconds) */
const LLM_REQUEST_TIMEOUT_MS = 10000;

/** Valid business categories for the LLM prompt. */
const VALID_CATEGORIES = [
  "BARBERSHOP",
  "SALON",
  "SPA",
  "FITNESS",
  "DENTAL",
  "MEDICAL",
  "TUTORING",
  "CONSULTING",
  "PHOTOGRAPHY",
  "AUTOMOTIVE",
  "HOME_SERVICES",
  "PET_SERVICES",
  "OTHER",
];

/** Valid days of the week for the LLM prompt. */
const VALID_DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

// =============================================================================
// Sentiment Analysis
// =============================================================================

/**
 * Analyzes the sentiment of a text string using Hugging Face's
 * inference API.
 *
 * @param text - The text to analyze (e.g., a review comment)
 * @returns SentimentResult with label and score, or null on failure
 */
export async function analyzeSentiment(
  text: string
): Promise<SentimentResult | null> {
  try {
    // -------------------------------------------------------------------------
    // Guard: Check prerequisites
    // -------------------------------------------------------------------------

    const apiToken = process.env.HUGGINGFACE_API_TOKEN;

    if (!apiToken) {
      console.warn(
        "⚠️ HUGGINFACE_API_TOKEN not set — skipping sentiment analysis."
      );
      return null;
    }

    // Guard: text too short for meaningful analysis
    if (!text || text.trim().length < MIN_TEXT_LENGTH) {
      return null;
    }

    // Truncate text if too long
    const truncatedText = text.slice(0, MAX_TEXT_LENGTH);

    // -------------------------------------------------------------------------
    // API request with timeout
    // -------------------------------------------------------------------------

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      HF_REQUEST_TIMEOUT_MS
    );

    const response = await fetch(`${HF_API_BASE}/${SENTIMENT_MODEL}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: truncatedText,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // -------------------------------------------------------------------------
    // Handle non-success responses
    // -------------------------------------------------------------------------

    if (!response.ok) {
      // 503 = model is loading (cold start). Hugging Face free tier
      // may take 20 to 30 seconds to load a model on first request.
      if (response.status === 503) {
        console.warn(
          "⚠️ Sentiment model is loading (cold start) — skipping analysis."
        );
        return null;
      }

      // 429 = rate limit exceeded
      if (response.status === 429) {
        console.warn(
          "⚠️ Hugging Face rate limit reached — skipping sentiment analysis."
        );
        return null;
      }

      console.warn(
        `⚠️ Sentiment API returned ${response.status} — skipping analysis.`
      );
      return null;
    }

    // -------------------------------------------------------------------------
    // Parse and validate the response
    // -------------------------------------------------------------------------

    const data = await response.json();

    // The API returns [[{label, score}, ...]] — array of arrays
    if (
      !Array.isArray(data) ||
      !Array.isArray(data[0]) ||
      data[0].length === 0
    ) {
      console.warn("⚠️ Unexpected sentiment API response shape — skipping");
      return null;
    }

    const classifications: HuggingFaceClassification[] = data[0];

    // The first element is the highest-scoring label
    const topResult = classifications[0];

    if (
      !topResult ||
      typeof topResult.label !== "string" ||
      typeof topResult.score !== "number"
    ) {
      console.warn("⚠️ Invalid sentiment result format — skipping");
      return null;
    }

    // Normalize the label to lowercase for consistent storage
    const normalizedLabel = topResult.label.toLowerCase();

    // Validate if it is one of the expected values
    const validLabels = ["positive", "neutral", "negative"];
    if (!validLabels.includes(normalizedLabel)) {
      console.warn(
        `⚠️ Unexpected sentiment label "${normalizedLabel}" — skipping.`
      );
      return null;
    }

    return {
      label: normalizedLabel,
      score: parseFloat(topResult.score.toFixed(4)),
    };
  } catch (error) {
    // Abort error = request timed out
    if (error instanceof DOMException && error.name === "AbortError") {
      console.warn("⚠️ Sentiment analysis timed out — skipping");
      return null;
    }

    // Network errors, JSON parse errors, etc.
    console.warn("⚠️ Sentiment analysis failed — skipping", error);
    return null;
  }
}

// =============================================================================
// Search Intent Extraction
// =============================================================================

/**
 * The system prompt that instructs the LLM how to extract search intent.
 *
 * Key design choices:
 *   - Returns ONLY valid JSON (no markdown, no explanation outside JSON)
 *   - Uses the exact enum values from our Prisma schema
 *   - Includes price context with calibrated ranges
 *   - Handles temporal references ("This weekend", "tomorrow", "Saturday")
 *   - The explanation field provides a human readable summary
 */
function buildSearchIntentPrompt(): string {
  return `You are a search intent extractor for Appointly, an appointment booking platform in Ethiopia.
Extract structured search parameters from the user's natural language query.

IMPORTANT: Respond with ONLY valid JSON. No markdown, no code blocks, no explanation outside the JSON.

Extract these fields (use null for anything you can't determine):

{
  "category": one of [${VALID_CATEGORIES.map((c) => `"${c}"`).join(", ")}] or null,
  "maxPrice": number in ETB (Ethiopian Birr) or null. "cheap"/"affordable" = 200, "moderate" = 500, "expensive"/"premium" = 1000+,
  "minRating": number from 1.0 to 5.0 or null. "top rated"/"best" = 4.5, "good" = 4.0, "highly rated" = 4.5,
  "city": city name string or null,
  "dayOfWeek": array of [${VALID_DAYS.map((d) => `"${d}"`).join(", ")}] or null. "weekend" = ["SATURDAY", "SUNDAY"], "weekday" = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY"],
  "serviceKeywords": array of service-related keywords or null,
  "searchTerms": general search text to match business names/descriptions or null,
  "sortBy": one of ["relevance", "rating", "price"] or null. "cheapest"/"lowest price" = "price", "best rated"/"top" = "rating", default = "relevance",
  "explanation": brief human-readable summary of what you understood (always include this)
}

Examples:
- "cheap haircut near Bole" → {"category":"BARBERSHOP","maxPrice":200,"minRating":null,"city":"Addis Ababa","dayOfWeek":null,"serviceKeywords":["haircut"],"searchTerms":"haircut","sortBy":"price","explanation":"Looking for affordable barbershops near Bole, Addis Ababa, sorted by price"}
- "best rated massage this weekend" → {"category":"SPA","maxPrice":null,"minRating":4.5,"city":null,"dayOfWeek":["SATURDAY","SUNDAY"],"serviceKeywords":["massage"],"searchTerms":"massage","sortBy":"rating","explanation":"Looking for top-rated spa massage services available on weekends"}
- "dentist in Mekelle" → {"category":"DENTAL","maxPrice":null,"minRating":null,"city":"Mekelle","dayOfWeek":null,"serviceKeywords":null,"searchTerms":"dentist","sortBy":"relevance","explanation":"Looking for dental clinics in Mekelle"}
- "top yoga classes under 500 birr" → {"category":"FITNESS","maxPrice":500,"minRating":4.0,"city":null,"dayOfWeek":null,"serviceKeywords":["yoga"],"searchTerms":"yoga","sortBy":"rating","explanation":"Looking for well-rated fitness studios offering affordable yoga classes"}`;
}

/**
 * Extracts structured search intent from a natural language query
 * using an LLM via OpenRouter.
 *
 * @param query - The user's natural language search query
 * @returns Structured SearchIntent or null on failure
 */
export async function extractSearchIntent(
  query: string
): Promise<SearchIntent | null> {
  try {
    // -------------------------------------------------------------------------
    // Guard: Check prerequisites
    // -------------------------------------------------------------------------

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.warn(
        "⚠️ OPENROUTER_API_KEY not set — skipping AI search intent extraction."
      );
      return null;
    }

    if (!query || query.trim().length < 3) {
      return null;
    }

    // -------------------------------------------------------------------------
    // LLM API request with timeout
    // -------------------------------------------------------------------------

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      LLM_REQUEST_TIMEOUT_MS
    );

    const response = await fetch(OPENROUTER_API_BASE, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.AUTH_URL || "http://localhost:3000",
        "x-Title": "Appointly",
      },
      body: JSON.stringify({
        model: SEARCH_INTENT_MODEL,
        messages: [
          { role: "system", content: buildSearchIntentPrompt() },
          { role: "user", content: query },
        ],
        temperature: 0.1, // Low temperature for consistent, deterministic extraction
        max_tokens: 300, // Intent JSON should be well under 300 tokens
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // -------------------------------------------------------------------------
    // Handle non-success responses
    // -------------------------------------------------------------------------

    if (!response.ok) {
      if (response.status === 429) {
        console.warn("⚠️ OpenRouter rate limit reached — skipping AI search.");
      } else {
        console.warn(
          `⚠️ OpenRouter API returned ${response.status} — skipping AI search.`
        );
      }
      return null;
    }

    // -------------------------------------------------------------------------
    // Parse the LLM response
    // -------------------------------------------------------------------------

    const data = await response.json();

    const content = data?.choices?.[0]?.message?.content;

    if (!content || typeof content !== "string") {
      console.warn("⚠️ Empty or invalid LLM response — skipping.");
      return null;
    }

    // Extract JSON from the response (handle potential markdown wrapping)
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.warn("⚠️ No JSON found in LLM response — skipping.");
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // -------------------------------------------------------------------------
    // Validate and sanitize the extracted intent
    // -------------------------------------------------------------------------

    const intent: SearchIntent = {
      category: null,
      maxPrice: null,
      city: null,
      dayOfWeek: null,
      serviceKeywords: null,
      searchTerms: null,
      explanation: null,
    };

    // Validate category against our own
    if (
      parsed.category &&
      typeof parsed.category === "string" &&
      VALID_CATEGORIES.includes(parsed.category.toUpperCase())
    ) {
      intent.category = parsed.category.toUpperCase();
    }

    // Validate max price
    if (
      parsed.maxPrice &&
      typeof parsed.maxPrice === "number" &&
      parsed.maxPrice > 0
    ) {
      intent.maxPrice = parsed.maxPrice;
    }

    // Validate city
    if (parsed.city && typeof parsed.city === "string" && parsed.city.trim()) {
      intent.city = parsed.city;
    }

    // Validate dayOfWeek
    if (Array.isArray(parsed.dayOfWeek) && parsed.dayOfWeek.length > 0) {
      const validDays = parsed.dayOfWeek
        .map((d: unknown) => (typeof d === "string" ? d.toUpperCase() : null))
        .filter(
          (d: string | null): d is string =>
            d !== null && VALID_DAYS.includes(d)
        );
      if (validDays.length > 0) {
        intent.dayOfWeek = validDays;
      }
    }

    // Validate serviceKeywords
    if (
      Array.isArray(parsed.serviceKeywords) &&
      parsed.serviceKeywords.length > 0
    ) {
      intent.serviceKeywords = parsed.serviceKeywords
        .filter((k: unknown) => typeof k === "string" && k.trim())
        .map((k: string) => k.trim().toLowerCase())
        .slice(0, 5); // Limit to 5 keywords
    }

    // Validate searchTerms
    if (
      parsed.searchTerms &&
      typeof parsed.searchTerms === "string" &&
      parsed.searchTerms.trim()
    ) {
      intent.searchTerms = parsed.searchTerms;
    }

    // Validate minRating
    if (
      parsed.minRating &&
      typeof parsed.minRating === "number" &&
      parsed.minRating >= 1.0 &&
      parsed.minRating <= 5.0
    ) {
      intent.minRating = parseFloat(parsed.minRating.toFixed(1));
    }

    // Validate sortBy
    if (
      parsed.sortBy &&
      typeof parsed.sortBy === "string" &&
      ["relevance", "rating", "price"].includes(parsed.sortBy)
    ) {
      intent.sortBy = parsed.sortBy as "relevance" | "rating" | "price";
    }

    // Validate explanation
    if (
      parsed.explanation &&
      typeof parsed.explanation === "string" &&
      parsed.explanation.trim()
    ) {
      intent.explanation = parsed.explanation;
    }

    return intent;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.warn("⚠️ AI search intent extraction timed out — skipping.");
      return null;
    }

    console.warn("⚠️ AI search intent extraction failed — skipping:", error);
    return null;
  }
}

// =============================================================================
// Chat Completion
// =============================================================================

/**
 * Sends a chat completion request to OpenRouter.
 *
 * Takes a conversation history (array of messages with roles) and
 * returns the assistant's response. The systems message should contain
 * the business context built by the chat server action.
 *
 * @param messages - Full conversation history including system prompt
 * @returns ChatCompletionResult with the assistant's response or null
 */
export async function chatCompletion(
  messages: ChatMessage[]
): Promise<ChatCompletionResult | null> {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.warn("⚠️ OPENROUTER_API_KEY not set — skipping chat completion.");
      return null;
    }

    if (!messages || messages.length === 0) return null;

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      LLM_REQUEST_TIMEOUT_MS
    );

    const response = await fetch(OPENROUTER_API_BASE, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Request": process.env.AUTH_URL || "http://localhost:3000",
        "X-Title": "Appointly",
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages,
        temperature: 0.5, // Balanced: helpful yet consistent
        max_tokens: 400,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429) {
        console.warn("⚠️ OpenRouter rate limit — chat unavailable.");
      } else {
        console.warn(`⚠️ OpenRouter returned ${response.status} for`);
      }
      return null;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content || typeof content !== "string") {
      console.warn("⚠️ Empty chat response — skipping.");
      return null;
    }

    return { content: content.trim() };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.warn("⚠️ Chat completion timed out.");
      return null;
    }

    console.warn("⚠️ Chat completion failed:", error);
    return null;
  }
}
