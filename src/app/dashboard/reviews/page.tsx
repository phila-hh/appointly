/**
 * @file Dashboard Reviews Page
 * @description Customer reviews and ratings for business owners.
 *
 * URL: /dashboard/reviews
 */

import { requireBusiness } from "@/lib/actions/business-queries";

export const metadata = {
  title: "Reviews",
};

export default async function DashboardReviewsPage() {
  await requireBusiness();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Reviews</h2>
        <p className="text-muted-foreground">
          See what your customers are saying about your services.
        </p>
      </div>
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        Reviews display coming soon...
      </div>
    </div>
  );
}
