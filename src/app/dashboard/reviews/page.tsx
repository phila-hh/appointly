/**
 * @file Dashboard Reviews Page
 * @description Business owner view of all reviews received.
 *
 * Features:
 *   - List of all reviews with filtering
 *   - Review statistics (average rating, distribution)
 *   - Sort by date or rating
 *   - Shows which service was reviewed
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

  // Fetch reviews and stats
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
          See what your customers are saying about your services.
        </p>
      </div>

      {/* Review statistics */}
      <ReviewStatistics stats={stats} />

      {/* Reviews list */}
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
