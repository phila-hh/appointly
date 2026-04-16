/**
 * @file Chat Server Action
 * @description Server action for the business chatbot feature.
 *
 * Handles:
 *   1. Building business context from database (services, hours, reviews)
 *   2. Constructing the system prompt with real data
 *   3. Managing conversation history from the client
 *   4. Calling the LLM for a response
 *   5. Rate limiting to prevent abuse
 *
 * The chatbot is context-aware — it has access to the specific business's
 * real data (services, prices, hours, location, reviews) and can answer
 * questions accurately based on this data.
 *
 * Security:
 *   - Requires authentication
 *   - Rate limited (20 messages per hour per user)
 *   - Business data is fetched server-side (no client manipulation)
 *   - Conversation history is validated and truncated
 */

"use server";

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { chatCompletion, type ChatMessage } from "@/lib/ai";
import { createRateLimiter } from "@/lib/rate-limit";
import { formatTime24to12 } from "@/constants/time";

// =============================================================================
// Types
// =============================================================================

/** A message in the client-side conversation history. */
export interface ClientChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** Result of a chat action call. */
export interface ChatActionResult {
  success: boolean;
  error?: string;
  message?: string;
  remaining?: number;
}

/** Serialized business context passed from the page to the chat widget. */
export interface BusinessChatContext {
  businessId: string;
  slug: string;
  name: string;
}

// =============================================================================
// Rate Limiter
// =============================================================================

/**
 * Rate limiter for chatbot messages.
 * 20 messages per hour per user — more generous than AI search since
 * chat messages are shorter and cheaper.
 *
 * Future: Check user subscription tier for higher limits.
 */
const chatLimiter = createRateLimiter({
  maxRequests: 20,
  windowMs: 60 * 60 * 1000, // 1 hour
});

// =============================================================================
// Context Builder
// =============================================================================

/** Maximum number of messages in conversation history sent to the LLM. */
const MAX_HISTORY_MESSAGES = 10;

/**
 * Fetches business data from the database and builds a comprehensive
 * context string for the LLM system prompt.
 *
 * Includes:
 *   - Business name, category, description
 *   - Location and contact info
 *   - All active services with prices and durations
 *   - Weekly operating hours
 *   - Average rating and review count
 *   - Staff members (if any)
 *
 * The context is designed to be concise but complete — giving the LLM
 * everything it needs to answer customer questions accurately.
 *
 * @param businessId - The business ID to build context for
 * @returns Formatted context string, or null if business not found
 */
async function buildBusinessContext(
  businessId: string
): Promise<string | null> {
  const business = await db.business.findUnique({
    where: { id: businessId, isActive: true },
    include: {
      services: {
        where: { isActive: true },
        orderBy: { price: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          duration: true,
        },
      },
      BusinessHours: {
        orderBy: { dayOfWeek: "asc" },
      },
      staff: {
        where: { isActive: true },
        select: {
          name: true,
          title: true,
          services: {
            include: {
              service: { select: { name: true } },
            },
          },
        },
      },
      _count: {
        select: { reviews: true },
      },
    },
  });

  if (!business) return null;

  // Calculate average rating
  const ratingResult = await db.review.aggregate({
    where: { businessId },
    _avg: { rating: true },
  });

  const avgRating = ratingResult._avg.rating
    ? ratingResult._avg.rating.toFixed(1)
    : "No ratings yet";

  // Build the context string
  const parts: string[] = [];

  // Business info
  parts.push(`BUSINESS: ${business.name}`);
  parts.push(`Category: ${business.category}`);
  if (business.description) parts.push(`About: ${business.description}`);

  // Location
  const location = [business.address, business.city, business.state]
    .filter(Boolean)
    .join(", ");
  if (location) parts.push(`Location: ${location}`);

  // Contact
  if (business.phone) parts.push(`Phone: ${business.phone}`);
  if (business.email) parts.push(`Email: ${business.email}`);
  if (business.website) parts.push(`Website: ${business.website}`);

  // Rating
  parts.push(
    `Rating: ${avgRating} (${business._count.reviews} review${business._count.reviews !== 1 ? "s" : ""})`
  );

  // Services
  if (business.services.length > 0) {
    parts.push("");
    parts.push("SERVICES:");
    business.services.forEach((s) => {
      parts.push(
        `- ${s.name}: ETB ${Number(s.price).toFixed(2)} (${s.duration} min)${s.description ? ` — ${s.description}` : ""}`
      );
    });
  }

  // Business hours
  if (business.BusinessHours.length > 0) {
    parts.push("");
    parts.push("OPERATING HOURS:");
    business.BusinessHours.forEach((h) => {
      const dayLabel =
        h.dayOfWeek.charAt(0) + h.dayOfWeek.slice(1).toLowerCase();
      if (h.isClosed) {
        parts.push(`- ${dayLabel}: Closed`);
      } else {
        parts.push(
          `- ${dayLabel}: ${formatTime24to12(h.openTime)} – ${formatTime24to12(h.closeTime)}`
        );
      }
    });
  }

  // Staff
  if (business.staff.length > 0) {
    parts.push("");
    parts.push("TEAM:");
    business.staff.forEach((s) => {
      const serviceNames = s.services.map((ss) => ss.service.name).join(", ");
      parts.push(
        `- ${s.name}${s.title ? ` (${s.title})` : ""}${serviceNames ? `: specializes in ${serviceNames}` : ""}`
      );
    });
  }

  return parts.join("\n");
}

/**
 * Builds the system prompt for the business chatbot.
 *
 * The prompt instructs the LLM to:
 *   - Answer questions using ONLY the provided business data
 *   - Be helpful, friendly, and concise
 *   - Suggest booking when appropriate using [BOOK:slug] markers
 *   - Suggest viewing services using [SERVICES:slug] markers
 *   - Never invent information not in the context
 *   - Respond in the same language the user uses
 */
function buildSystemPrompt(context: string, slug: string): string {
  return `You are a helpful assistant for a business on Appointly, an appointment booking platform in Ethiopia. Answer customer questions using ONLY the business data provided below. Be friendly, concise, and accurate.

RULES:
1. Only answer based on the data below. If you don't know something, say "I don't have that information, but you can contact the business directly."
2. When suggesting to book an appointment, include the marker [BOOK:${slug}] at the end of your message. This will be converted into a clickable button.
3. When suggesting to view services, include the marker [SERVICES:${slug}] at the end of your message.
4. Keep responses brief (2-4 sentences max). Customers want quick answers.
5. Format prices in ETB (Ethiopian Birr).
6. Use 12-hour time format (e.g., "9:00 AM" not "09:00").
7. Be warm and professional. Use the business name naturally.
8. If the user asks about something not related to this business, politely redirect to business-related topics.
9. Respond in the same language the user writes in (English or Amharic).

BUSINESS DATA:
${context}`;
}

// =============================================================================
// Chat Action
// =============================================================================

/**
 * Processes a chat message and returns the assistant's response.
 *
 * Flow:
 *   1. Validate user is authenticated
 *   2. Check rate limit
 *   3. Build business context from database (on first message)
 *   4. Construct message array with system prompt + conversation history
 *   5. Call LLM for response
 *   6. Return the assistant's message
 *
 * @param businessContext - Serialized business context (id, slug, name)
 * @param userMessage - The user's current message
 * @param history - Previous conversation messages (client-managed)
 * @returns ChatActionResult with the assistant's response
 */
export async function sendChatMessage(
  businessContext: BusinessChatContext,
  userMessage: string,
  history: ClientChatMessage[]
): Promise<ChatActionResult> {
  try {
    // -------------------------------------------------------------------------
    // Step 1: Authentication check
    // -------------------------------------------------------------------------

    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false,
        error: "Please sign in to chat with this business's AI assistant.",
      };
    }

    // -------------------------------------------------------------------------
    // Step 2: Input validation
    // -------------------------------------------------------------------------

    const trimmedMessage = userMessage.trim();

    if (!trimmedMessage) {
      return {
        success: false,
        error: "Please enter a message.",
      };
    }

    if (trimmedMessage.length > 500) {
      return {
        success: false,
        error: "Message is too long. Please keep it under 500 characters.",
      };
    }

    // -------------------------------------------------------------------------
    // Step 3: Rate limit check
    // -------------------------------------------------------------------------

    const rateLimitKey = `${user.id}:${businessContext.businessId}`;
    const rateLimitResult = chatLimiter.check(rateLimitKey);

    if (!rateLimitResult.allowed) {
      const retryMinutes = Math.ceil(rateLimitResult.retryAfterMs / 60000);

      return {
        success: false,
        error: `You've reached the chat limit (20 messages per hour). Try again in ${retryMinutes} minute${retryMinutes === 1 ? "" : "s"}.`,
        remaining: 0,
      };
    }

    // -------------------------------------------------------------------------
    // Step 4: Build business context from database
    // -------------------------------------------------------------------------

    const context = await buildBusinessContext(businessContext.businessId);

    if (!context) {
      return {
        success: false,
        error: "Business not found or is no longer active.",
      };
    }

    // -------------------------------------------------------------------------
    // Step 5: Construct conversation for the LLM
    // -------------------------------------------------------------------------

    const systemPrompt = buildSystemPrompt(context, businessContext.slug);

    // Truncate history to prevent token overflow
    const truncatedHistory = history.slice(-MAX_HISTORY_MESSAGES);

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...truncatedHistory.map(
        (msg): ChatMessage => ({
          role: msg.role,
          content: msg.content,
        })
      ),
      { role: "user", content: trimmedMessage },
    ];

    // -------------------------------------------------------------------------
    // Step 6: Call LLM
    // -------------------------------------------------------------------------

    const result = await chatCompletion(messages);

    if (!result) {
      return {
        success: false,
        error:
          "I'm having trouble connecting right now. Please try again in a moment.",
      };
    }

    return {
      success: true,
      message: result.content,
      remaining: rateLimitResult.remaining,
    };
  } catch (error) {
    console.error("Chat action error:", error);
    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }
}
