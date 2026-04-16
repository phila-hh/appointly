/**
 * @file AI Utility Functions
 * @description integration with Hugging Face's free inference API for
 * AI powered features across the platform.
 *
 * Capabilities:
 *   - Review sentiment analysis (positive / neutral / negative)
 *
 * Architecture:
 *   - Uses Hugging Face's inference API
 *   - Model: cardiffnlp/twitter-roberta-base-sentiment-latest
 *   - All functions are designed to fail gracefully — AI failures
 *   - Should NEVER block core platform functionality
 *   - Results are cached on the database record (no re-analyzed)
 *
 * Error handling philosophy:
 *   - Network errors → return null (skip analysis)
 *   - Rate limiting → return null (skip analysis)
 *   - Invalid response → return null (skip analysis)
 *   - Missing API token → return null (skip analysis)
 *   - The caller decides what to do with null (typically save without sentiment)
 *
 * @see https://huggingface.co/docs/api-inference/index
 * @see https://huggingface.co/cardiffnlp/twitter-roberta-base-sentiment-latest
 */

// =============================================================================
// Types
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
 *
 * @example
 * ```json
 * [[
 *   { "label": "positive", "score": 0.95 },
 *   { "label": "neutral", "score": 0.03 },
 *   { "label": "negative", "score": 0.02 }
 * ]]
 * ```
 */
interface HuggingFaceClassification {
  label: string;
  score: number;
}

// =============================================================================
// Constants
// =============================================================================

/** The Hugging Face model used for sentiment analysis. */
const SENTIMENT_MODEL = "cardiffnlp/twitter-roberta-base-sentiment-latest";

/** Hugging Face inference API base URL */
const HF_API_BASE = "https://router.huggingface.co/hf-inference/models";

/** Request timeout in milliseconds (5 seconds) */
const REQUEST_TIMEOUT_MS = 5000;

/**
 * Minimum text length required for meaningful sentiment analysis.
 * Very short texts (e.g., "ok", "good") produce unreliable results.
 */
const MIN_TEXT_LENGTH = 3;

/**
 * Maximum text length sent to the model.
 * The model has a token limit. We truncate to avoid errors.
 * 512 tokens ≈ ~300-400 words, which is more than enough for reviews.
 */
const MAX_TEXT_LENGTH = 1000;

// =============================================================================
// Sentiment Analysis
// =============================================================================

/**
 * Analyzes the sentiment of a text using Hugging Face's
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
        "HUGGINFACE_API_TOKEN not set — skipping sentiment analysis."
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
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

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
          "Sentiment model is loading (cold start) — skipping analysis."
        );
        return null;
      }

      // 429 = rate limit exceeded
      if (response.status === 429) {
        console.warn(
          "Hugging Face rate limit reached — skipping sentiment analysis."
        );
        return null;
      }

      console.warn(
        `Sentiment API returned ${response.status} — skipping analysis.`
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
      console.warn("Unexpected sentiment API response shape — skipping");
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
      console.warn("Invalid sentiment result format — skipping");
      return null;
    }

    // Normalize the label to lowercase for consistent storage
    const normalizedLabel = topResult.label.toLowerCase();

    // Validate if it is one of the expected values
    const validLabels = ["positive", "neutral", "negative"];
    if (!validLabels.includes(normalizedLabel)) {
      console.warn(
        `Unexpected sentiment label "${normalizedLabel}" — skipping.`
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
      console.warn("Sentiment analysis timed out — skipping");
      return null;
    }

    // Network errors, JSON parse errors, etc.
    console.warn("Sentiment analysis failed — skipping", error);
    return null;
  }
}
