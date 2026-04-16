/**
 * @file AI Search Server Action
 * @description Server action for natural language business search.
 *
 * Flow:
 *   1. Validate user is authenticated
 *   2. Check rate limit (10 searches/hour per user)
 *   3. Send query to OpenRouter LLM for intent extraction
 *   4. Build structured database query from extracted intent
 *   5. Execute query and return results with AI explanation
 *
 * Fallback behavior:
 *   - If LLM extraction fails → falls back to basic text search
 *   - If no results from AI query → suggests clearing filters
 *   - Rate limit exceeded → returns friendly error with retry time
 *
 * Security:
 *   - Requires authentication (signed-in users only)
 *   - Rate limited to prevent API abuse
 *   - Input sanitized before sending to LLM
 */

"use server";

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { extractSearchIntent, type SearchIntent } from "@/lib/ai";
import { aiSearchLimiter } from "@/lib/rate-limit";
import type { Prisma } from "@/generated/prisma/client";

// =============================================================================
// Types
// =============================================================================

/** A single business result from AI search. */
export interface AISearchBusinessResult {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  city: string | null;
  state: string | null;
  image: string | null;
  _count: {
    services: number;
    reviews: number;
  };
  reviews: { rating: number }[];
  /** Matching services (when filtered by service keywords). */
  matchingServices?: {
    name: string;
    price: number;
    duration: number;
  }[];
}

/** Complete result from the AI search action. */
export interface AISearchResult {
  /** Whether the search succeeded. */
  success: boolean;
  /** Error message (if success is false). */
  error?: string;
  /** The extracted search intent (for display purposes). */
  intent?: SearchIntent | null;
  /** Matching businesses. */
  businesses: AISearchBusinessResult[];
  /** Total number of matches. */
  totalCount: number;
  /** Whether the LLM was used (false = fell back to basic search). */
  usedAI: boolean;
  /** Rate limit info. */
  remaining?: number;
}

/** Maximum number of AI search results to return. */
const MAX_AI_RESULTS = 12;

// =============================================================================
// AI Search Action
// =============================================================================

/**
 * Performs a natural language search for businesses.
 *
 * Takes a free-text query like "cheap haircut near Bole open Saturday"
 * and returns matching businesses with an AI-generated explanation
 * of what was understood.
 *
 * @param query - The user's natural language search query
 * @returns AISearchResult with businesses and metadata
 */
export async function aiSearch(query: string): Promise<AISearchResult> {
  try {
    // -------------------------------------------------------------------------
    // Step 1: Authentication check
    // -------------------------------------------------------------------------

    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false,
        error: "Please sign in to use AI-powered search.",
        businesses: [],
        totalCount: 0,
        usedAI: false,
      };
    }

    // -------------------------------------------------------------------------
    // Step 2: Input validation
    // -------------------------------------------------------------------------

    const trimmedQuery = query.trim();

    if (!trimmedQuery || trimmedQuery.length < 3) {
      return {
        success: false,
        error:
          "Please enter a more specific search query (at least 3 characters).",
        businesses: [],
        totalCount: 0,
        usedAI: false,
      };
    }

    if (trimmedQuery.length > 200) {
      return {
        success: false,
        error: "Search query is too long. Please keep it under 200 characters.",
        businesses: [],
        totalCount: 0,
        usedAI: false,
      };
    }

    // -------------------------------------------------------------------------
    // Step 3: Rate limit check
    // -------------------------------------------------------------------------

    const rateLimitResult = aiSearchLimiter.check(user.id);

    if (!rateLimitResult.allowed) {
      const retryMinutes = Math.ceil(rateLimitResult.retryAfterMs / 60000);

      return {
        success: false,
        error: `You've reached the AI search limit (10 per hour). Try again in ${retryMinutes} minute${retryMinutes === 1 ? "" : "s"}, or use the standard filters below.`,
        businesses: [],
        totalCount: 0,
        usedAI: false,
        remaining: 0,
      };
    }

    // -------------------------------------------------------------------------
    // Step 4: Extract search intent via LLM
    // -------------------------------------------------------------------------

    const intent = await extractSearchIntent(trimmedQuery);

    // -------------------------------------------------------------------------
    // Step 5: Build and execute database query
    // -------------------------------------------------------------------------

    let businesses: AISearchBusinessResult[];
    let totalCount: number;

    if (intent) {
      // AI-powered structured search
      const result = await executeAIQuery(intent);
      businesses = result.businesses;
      totalCount = result.totalCount;
    } else {
      // Fallback to basic text search if LLM fails
      const result = await executeBasicSearch(trimmedQuery);
      businesses = result.businesses;
      totalCount = result.totalCount;
    }

    return {
      success: true,
      intent,
      businesses,
      totalCount,
      usedAI: !!intent,
      remaining: rateLimitResult.remaining,
    };
  } catch (error) {
    console.error("AI search error:", error);
    return {
      success: false,
      error:
        "Something went wrong with AI search. Please try the standard filters.",
      businesses: [],
      totalCount: 0,
      usedAI: false,
    };
  }
}

// =============================================================================
// Query Builders
// =============================================================================

/**
 * Executes a structured database query from AI-extracted intent.
 *
 * Builds a Prisma WHERE clause from the SearchIntent fields,
 * combining category, city, price, service keywords, and search terms.
 */
async function executeAIQuery(intent: SearchIntent) {
  const where: Prisma.BusinessWhereInput = {
    isActive: true,
  };

  // Category filter
  if (intent.category) {
    where.category = intent.category as Prisma.EnumBusinessCategoryFilter;
  }

  // City filter (case-insensitive partial match)
  if (intent.city) {
    where.OR = [
      { city: { contains: intent.city, mode: "insensitive" } },
      { address: { contains: intent.city, mode: "insensitive" } },
    ];
  }

  // Service keyword filter — business must have a service matching keywords
  if (intent.serviceKeywords && intent.serviceKeywords.length > 0) {
    where.services = {
      some: {
        isActive: true,
        AND: [
          // Match at least one keyword in service name or description
          {
            OR: intent.serviceKeywords.map((keyword) => ({
              OR: [
                { name: { contains: keyword, mode: "insensitive" as const } },
                {
                  description: {
                    contains: keyword,
                    mode: "insensitive" as const,
                  },
                },
              ],
            })),
          },
          // Price filter — service must be under maxPrice
          ...(intent.maxPrice ? [{ price: { lte: intent.maxPrice } }] : []),
        ],
      },
    };
  } else if (intent.maxPrice) {
    // Price filter without service keywords
    where.services = {
      some: {
        isActive: true,
        price: { lte: intent.maxPrice },
      },
    };
  }

  // Search terms — match against business name and description
  if (intent.searchTerms && !intent.city) {
    // Only add text search if city search isn't already using OR
    if (!where.OR) {
      where.OR = [
        { name: { contains: intent.searchTerms, mode: "insensitive" } },
        {
          description: {
            contains: intent.searchTerms,
            mode: "insensitive",
          },
        },
      ];
    }
  } else if (intent.searchTerms && where.OR) {
    // City is already using OR, add text search conditions to it
    where.OR.push(
      { name: { contains: intent.searchTerms, mode: "insensitive" } },
      {
        description: {
          contains: intent.searchTerms,
          mode: "insensitive",
        },
      }
    );
  }

  // Day of week filter — business must be open on specified days
  if (intent.dayOfWeek && intent.dayOfWeek.length > 0) {
    where.BusinessHours = {
      some: {
        dayOfWeek: { in: intent.dayOfWeek },
        isClosed: false,
      },
    };
  }

  // Execute the query
  const [businesses, totalCount] = await Promise.all([
    db.business.findMany({
      where,
      include: {
        _count: {
          select: {
            services: { where: { isActive: true } },
            reviews: true,
          },
        },
        reviews: {
          select: { rating: true },
        },
        services: {
          where: { isActive: true },
          select: {
            name: true,
            price: true,
            duration: true,
          },
          take: 5,
          orderBy: { price: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: MAX_AI_RESULTS,
    }),
    db.business.count({ where }),
  ]);

  // Transform results
  const serialized: AISearchBusinessResult[] = businesses.map((b) => ({
    id: b.id,
    slug: b.slug,
    name: b.name,
    description: b.description,
    category: b.category,
    city: b.city,
    state: b.state,
    image: b.image,
    _count: b._count,
    reviews: b.reviews,
    matchingServices: b.services.map((s) => ({
      name: s.name,
      price: Number(s.price),
      duration: s.duration,
    })),
  }));

  return { businesses: serialized, totalCount };
}

/**
 * Fallback basic text search when LLM extraction fails.
 * Matches query against business name, description, and service names.
 */
async function executeBasicSearch(query: string) {
  const where: Prisma.BusinessWhereInput = {
    isActive: true,
    OR: [
      { name: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      {
        services: {
          some: {
            name: { contains: query, mode: "insensitive" },
            isActive: true,
          },
        },
      },
    ],
  };

  const [businesses, totalCount] = await Promise.all([
    db.business.findMany({
      where,
      include: {
        _count: {
          select: {
            services: { where: { isActive: true } },
            reviews: true,
          },
        },
        reviews: {
          select: { rating: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: MAX_AI_RESULTS,
    }),
    db.business.count({ where }),
  ]);

  const serialized: AISearchBusinessResult[] = businesses.map((b) => ({
    id: b.id,
    slug: b.slug,
    name: b.name,
    description: b.description,
    category: b.category,
    city: b.city,
    state: b.state,
    image: b.image,
    _count: b._count,
    reviews: b.reviews,
  }));

  return { businesses: serialized, totalCount };
}
