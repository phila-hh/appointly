/**
 * @file AI Search Server Action
 * @description Server action for natural language business search.
 *
 * Flow:
 *   1. Validate user is authenticated
 *   2. Check rate limit (10 searches/hour per user)
 *   3. Send query to OpenRouter LLM for intent extraction
 *   4. Build structured database query from extracted intent
 *   5. Post-fetch scoring and sorting
 *   6. Return results with AI explanation
 *
 * Post-fetch scoring (when sortBy = "relevance" or unspecified):
 *   score = (avgRating / 5 × 0.4) + (normalizedBookings × 0.3) + (normalizedServices × 0.3)
 *   All components normalized to [0, 1] range before combining.
 *
 * Fallback behavior:
 *   - LLM fails → basic text search
 *   - No results → friendly empty state message
 *   - Rate limited → retry time shown
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
  /** Computed average rating (null if no reviews). */
  averageRating: number | null;
  /** Computed relevance score for client display (optional). */
  relevanceScore?: number;
  matchingServices?: {
    name: string;
    price: number;
    duration: number;
  }[];
}

export interface AISearchResult {
  success: boolean;
  error?: string;
  intent?: SearchIntent | null;
  businesses: AISearchBusinessResult[];
  totalCount: number;
  usedAI: boolean;
  remaining?: number;
}

const MAX_AI_RESULTS = 12;

// =============================================================================
// AI Search Action
// =============================================================================

export async function aiSearch(query: string): Promise<AISearchResult> {
  try {
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

    const intent = await extractSearchIntent(trimmedQuery);

    let businesses: AISearchBusinessResult[];
    let totalCount: number;

    if (intent) {
      const result = await executeAIQuery(intent);
      businesses = result.businesses;
      totalCount = result.totalCount;
    } else {
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
// Scoring
// =============================================================================

/**
 * Computes a composite relevance score for a business result.
 *
 * Components (all normalized to [0, 1]):
 *   - Average rating  × 0.40  — quality signal
 *   - Booking count   × 0.30  — popularity signal (normalized against max)
 *   - Service count   × 0.30  — breadth signal (normalized against max)
 *
 * @param business   - The business result to score
 * @param maxBookings - Maximum booking count in the result set (for normalization)
 * @param maxServices - Maximum service count in the result set (for normalization)
 * @returns Composite score in [0, 1]
 */
function computeRelevanceScore(
  business: AISearchBusinessResult,
  maxBookings: number,
  maxServices: number
): number {
  const ratingScore =
    business.averageRating !== null ? business.averageRating / 5 : 0;

  const bookingScore =
    maxBookings > 0 ? business._count.reviews / maxBookings : 0;

  const serviceScore =
    maxServices > 0 ? business._count.services / maxServices : 0;

  return ratingScore * 0.4 + bookingScore * 0.3 + serviceScore * 0.3;
}

// =============================================================================
// Query Builders
// =============================================================================

async function executeAIQuery(intent: SearchIntent) {
  // -------------------------------------------------------------------------
  // Build WHERE clause
  //
  // Architecture:
  //   - Top-level AND array collects all mandatory conditions
  //   - City filter is its own AND condition (hard exclusion of other cities)
  //   - Search terms are their own OR condition (soft matching)
  //   - They never share an OR array, preventing city/term cross-contamination
  // -------------------------------------------------------------------------

  const andConditions: Prisma.BusinessWhereInput[] = [{ isActive: true }];

  // -------------------------------------------------------------------------
  // Category filter — hard match on enum
  // -------------------------------------------------------------------------
  if (intent.category) {
    andConditions.push({
      category: intent.category as Prisma.EnumBusinessCategoryFilter,
    });
  }

  // -------------------------------------------------------------------------
  // City filter — HARD FILTER
  // -------------------------------------------------------------------------
  if (intent.city) {
    andConditions.push({
      OR: [
        { city: { contains: intent.city, mode: "insensitive" } },
        { address: { contains: intent.city, mode: "insensitive" } },
      ],
    });
  }

  // -------------------------------------------------------------------------
  // Service keyword + price filter
  // -------------------------------------------------------------------------
  if (intent.serviceKeywords && intent.serviceKeywords.length > 0) {
    andConditions.push({
      services: {
        some: {
          isActive: true,
          AND: [
            {
              OR: intent.serviceKeywords.map((keyword) => ({
                OR: [
                  {
                    name: { contains: keyword, mode: "insensitive" as const },
                  },
                  {
                    description: {
                      contains: keyword,
                      mode: "insensitive" as const,
                    },
                  },
                ],
              })),
            },
            ...(intent.maxPrice ? [{ price: { lte: intent.maxPrice } }] : []),
          ],
        },
      },
    });
  } else if (intent.maxPrice) {
    andConditions.push({
      services: {
        some: {
          isActive: true,
          price: { lte: intent.maxPrice },
        },
      },
    });
  }

  // -------------------------------------------------------------------------
  // Search terms — soft match against business name and description.
  // Kept as a separate AND condition so it never merges with the city OR block.
  // -------------------------------------------------------------------------
  if (intent.searchTerms) {
    andConditions.push({
      OR: [
        { name: { contains: intent.searchTerms, mode: "insensitive" } },
        {
          description: {
            contains: intent.searchTerms,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  // -------------------------------------------------------------------------
  // Day of week filter — business must be open on specified days
  // -------------------------------------------------------------------------
  if (intent.dayOfWeek && intent.dayOfWeek.length > 0) {
    andConditions.push({
      BusinessHours: {
        some: {
          dayOfWeek: { in: intent.dayOfWeek },
          isClosed: false,
        },
      },
    });
  }

  // Combine all conditions into a single AND
  const where: Prisma.BusinessWhereInput = {
    AND: andConditions,
  };

  // -------------------------------------------------------------------------
  // Fetch — oversample for post-fetch scoring, then trim
  // -------------------------------------------------------------------------
  const rawBusinesses = await db.business.findMany({
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
    take: MAX_AI_RESULTS * 3,
  });

  // -------------------------------------------------------------------------
  // Compute averageRating for each business
  // -------------------------------------------------------------------------
  const withRatings: AISearchBusinessResult[] = rawBusinesses.map((b) => {
    const totalRating = b.reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating =
      b.reviews.length > 0
        ? parseFloat((totalRating / b.reviews.length).toFixed(1))
        : null;

    return {
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
      averageRating,
      matchingServices: b.services.map((s) => ({
        name: s.name,
        price: Number(s.price),
        duration: s.duration,
      })),
    };
  });

  // -------------------------------------------------------------------------
  // Apply minRating filter post-fetch
  // -------------------------------------------------------------------------
  const filtered =
    intent.minRating !== null && intent.minRating !== undefined
      ? withRatings.filter(
          (b) =>
            b.averageRating !== null && b.averageRating >= intent.minRating!
        )
      : withRatings;

  // -------------------------------------------------------------------------
  // Sort
  //
  // When city is specified and sortBy is "relevance", we apply a secondary
  // tiebreaker: exact city column match ranks above address-only match.
  // This ensures e.g. businesses where city="Mekelle" appear before those
  // where only address contains "Mekelle".
  //
  // For "rating" and "price" sorts, the city hard filter already guarantees
  // all results are in the correct city — no tiebreaker needed.
  // -------------------------------------------------------------------------
  const sortBy = intent.sortBy ?? "relevance";
  let sorted: AISearchBusinessResult[];

  if (sortBy === "rating") {
    sorted = [...filtered].sort((a, b) => {
      if (a.averageRating === null && b.averageRating === null) return 0;
      if (a.averageRating === null) return 1;
      if (b.averageRating === null) return -1;
      return b.averageRating - a.averageRating;
    });
  } else if (sortBy === "price") {
    sorted = [...filtered].sort((a, b) => {
      const aMin = a.matchingServices?.[0]?.price ?? Infinity;
      const bMin = b.matchingServices?.[0]?.price ?? Infinity;
      return aMin - bMin;
    });
  } else {
    // Relevance — composite score
    const maxBookings = Math.max(...filtered.map((b) => b._count.reviews), 1);
    const maxServices = Math.max(...filtered.map((b) => b._count.services), 1);

    sorted = [...filtered]
      .map((b) => {
        const baseScore = computeRelevanceScore(b, maxBookings, maxServices);

        /**
         * City exactness tiebreaker.
         * When the user specified a city, businesses whose `city` column
         * exactly matches (case-insensitive) get a small bonus over those
         * that only match via their address string.
         *
         * Bonus value (0.05) is intentionally small — it breaks ties without
         * overriding meaningful rating/popularity differences.
         */
        const cityBonus =
          intent.city && b.city?.toLowerCase() === intent.city.toLowerCase()
            ? 0.05
            : 0;

        return {
          ...b,
          relevanceScore: baseScore + cityBonus,
        };
      })
      .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));
  }

  const trimmed = sorted.slice(0, MAX_AI_RESULTS);

  return { businesses: trimmed, totalCount: filtered.length };
}

/**
 * Fallback basic text search when LLM extraction fails.
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

  const [rawBusinesses, totalCount] = await Promise.all([
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

  const businesses: AISearchBusinessResult[] = rawBusinesses.map((b) => {
    const totalRating = b.reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating =
      b.reviews.length > 0
        ? parseFloat((totalRating / b.reviews.length).toFixed(1))
        : null;

    return {
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
      averageRating,
    };
  });

  return { businesses, totalCount };
}
