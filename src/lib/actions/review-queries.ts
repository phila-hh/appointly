/**
 * @file Review Query Helpers
 * @description Server-side data fetching for reviews.
 *
 * Provides:
 *   - Business reviews with pagination and sorting
 *   - Average rating calculation
 *   - Rating distribution (count of 1-star, 2-star, etc.)
 *   - Sentiment distribution (count of positive, neutral, negative)
 *   - Customer's own reviews
 */

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { Prisma } from "@/generated/prisma/client";

/**
 * Fetches reviews for a specific business with pagination and sorting.
 *
 * Includes sentiment data (label and score) for each review.
 *
 * @param businessId - The business to fetch reviews for
 * @param options - Pagination and sorting options
 * @returns Object with reviews array and pagination info
 */
export async function getBusinessReviews(
  businessId: string,
  options: {
    page?: number;
    limit?: number;
    sortBy?: "newest" | "oldest" | "highest" | "lowest";
  } = {}
) {
  const { page = 1, limit = 10, sortBy = "newest" } = options;

  const skip = (page - 1) * limit;

  // Determine sort order
  let orderBy: Prisma.ReviewOrderByWithRelationInput = { createdAt: "desc" };
  if (sortBy === "oldest") orderBy = { createdAt: "asc" };
  if (sortBy === "highest") orderBy = { rating: "desc" };
  if (sortBy === "lowest") orderBy = { rating: "asc" };

  const [reviews, totalCount] = await Promise.all([
    db.review.findMany({
      where: { businessId },
      include: {
        customer: {
          select: {
            name: true,
            image: true,
          },
        },
        booking: {
          select: {
            service: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    db.review.count({
      where: { businessId },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    reviews,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      hasMore: page < totalPages,
    },
  };
}

/**
 * Calculates the average rating for a business.
 *
 * @param businessId - The business to calculate average for
 * @returns Average rating (1 decimal place) or null if no reviews
 */
export async function getAverageRating(
  businessId: string
): Promise<number | null> {
  const result = await db.review.aggregate({
    where: { businessId },
    _avg: {
      rating: true,
    },
  });

  return result._avg.rating ? parseFloat(result._avg.rating.toFixed(1)) : null;
}

/**
 * Gets the rating distribution for a business.
 * Returns count of reviews for each star level (1-5).
 *
 * @param businessId - The business to get distribution for
 * @returns Object with counts for each rating level
 */
export async function getRatingDistribution(businessId: string) {
  const reviews = await db.review.groupBy({
    by: ["rating"],
    where: { businessId },
    _count: {
      rating: true,
    },
  });

  // Initialize all ratings to 0
  const distribution = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  // Fill in actual counts
  reviews.forEach((review) => {
    if (review.rating >= 1 && review.rating <= 5) {
      distribution[review.rating as 1 | 2 | 3 | 4 | 5] = review._count.rating;
    }
  });

  return distribution;
}

/**
 * Gets the sentiment distribution for a business.
 * Returns count of reviews for each sentiment label.
 *
 * Only counts reviews that have been analyzed (sentimentLabel is not null).
 *
 * @param businessId - The business to get sentiment distribution for
 * @returns Object with counts for each sentiment and total analyzed
 */
export async function getSentimentDistribution(businessId: string) {
  const sentiments = await db.review.groupBy({
    by: ["sentimentLabel"],
    where: {
      businessId,
      sentimentLabel: { not: null },
    },
    _count: {
      sentimentLabel: true,
    },
  });

  // Initialize all sentiments to 0
  const distribution = {
    positive: 0,
    neutral: 0,
    negative: 0,
  };

  // Fill in actual counts
  sentiments.forEach((item) => {
    const label = item.sentimentLabel as string;
    if (label in distribution) {
      distribution[label as keyof typeof distribution] =
        item._count.sentimentLabel;
    }
  });

  // Total number of reviews with sentiment data
  const totalAnalyzed =
    distribution.positive + distribution.neutral + distribution.negative;

  return {
    ...distribution,
    totalAnalyzed,
  };
}

/**
 * Fetches all reviews written by the current customer.
 *
 * @returns Array of reviews with related business and booking info
 */
export async function getCustomerReviews() {
  const user = await getCurrentUser();
  if (!user || user.role !== "CUSTOMER") return [];

  return db.review.findMany({
    where: { customerId: user.id },
    include: {
      business: {
        select: {
          name: true,
          slug: true,
          image: true,
        },
      },
      booking: {
        select: {
          service: {
            select: {
              name: true,
            },
          },
          date: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Gets review statistics for a business.
 * Includes rating distribution and sentiment distribution.
 *
 * @param businessId - The business to get stats for
 * @returns Object with total count, average rating, distribution, and sentiment
 */
export async function getReviewStats(businessId: string) {
  const [totalCount, averageRating, distribution, sentimentDistribution] =
    await Promise.all([
      db.review.count({ where: { businessId } }),
      getAverageRating(businessId),
      getRatingDistribution(businessId),
      getSentimentDistribution(businessId),
    ]);

  return {
    totalCount,
    averageRating,
    distribution,
    sentimentDistribution,
  };
}
