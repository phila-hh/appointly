/**
 * @file Dashboard Reviews Page
 * @description Business owner view of all reviews received.
 *
 * Features:
 *   - Review statistics (average rating, distribution)
 *   - AI sentiment analysis summary (Phase 16A)
 *   - List of all reviews with filtering by rating and sentiment
 *   - Sort by date or rating
 *   - Shows which service was reviewed
 *   - Sentiment badges on each review card
 *
 * URL: /dashboard/reviews
 */

import { requireBusiness } from "@/lib/actions/business-queries";
import {
  getBusinessReviews,
  getReviewStats,
} from "@/lib/actions/review-queries";
import { ReviewList } from "@/components/shared/review-list";
import { ReviewStatistics } from "@/components/shared/review-statistics";

export const metadata = {
  title: "Reviews",
};

export default async function DashboardReviewsPage() {
  const business = await requireBusiness();

  // Fetch reviews and stats (including sentiment distribution)
  const [reviewsData, stats] = await Promise.all([
    getBusinessReviews(business.id, { page: 1, limit: 50, sortBy: "newest" }),
    getReviewStats(business.id),
  ]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Customer Reviews</h2>
        <p className="text-muted-foreground">
          See what your customers are saying about your services. AI sentiment
          analysis runs automatically on new reviews.
        </p>
      </div>

      {/* Review statistics with sentiment summary */}
      <ReviewStatistics stats={stats} />

      {/* Reviews list with sentiment badges and filters */}
      <ReviewList
        reviews={reviewsData.reviews.map((review) => ({
          ...review,
          createdAt: review.createdAt,
        }))}
        showService
      />
    </div>
  );
}
