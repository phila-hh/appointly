/**
 * @file Dashboard Reviews Page
 * @description Business owner view of all reviews received.
 *
 * Features:
 *   - Review statistics (average rating, distribution)
 *   - AI sentiment analysis summary
 *   - List of all reviews with sentiment badges
 *   - Inline reply form on each review card (post / edit / remove)
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

  const [reviewsData, stats] = await Promise.all([
    getBusinessReviews(business.id, { page: 1, limit: 50, sortBy: "newest" }),
    getReviewStats(business.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Customer Reviews</h2>
        <p className="text-muted-foreground">
          See what your customers are saying about your services. Reply to
          reviews to show you value their feedback. AI sentiment analysis runs
          automatically on new reviews.
        </p>
      </div>

      <ReviewStatistics stats={stats} />

      {/*
        Pass businessName so ReviewCard renders the inline reply form.
        This prop is intentionally NOT passed on the public business page —
        customers should see replies but not the edit form.
      */}
      <ReviewList
        reviews={reviewsData.reviews.map((review) => ({
          ...review,
          createdAt: review.createdAt,
        }))}
        showService
        businessName={business.name}
      />
    </div>
  );
}
