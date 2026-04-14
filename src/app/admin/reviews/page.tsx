import Link from "next/link";
import { format } from "date-fns";

import { getAdminReviews } from "@/lib/actions/admin-queries";
import { flagReview, removeReview } from "@/lib/actions/admin";
import { ConfirmActionForm } from "@/components/shared/confirm-action-form";
import { Input } from "@/components/ui/input";

interface AdminReviewsPageProps {
  searchParams: Promise<{ search?: string; minRating?: string }>;
}

export const metadata = { title: "Review Moderation" };

export default async function AdminReviewsPage({
  searchParams,
}: AdminReviewsPageProps) {
  const params = await searchParams;
  const minRating = params.minRating ? Number(params.minRating) : undefined;
  const reviews = await getAdminReviews({
    search: params.search,
    minRating: Number.isNaN(minRating) ? undefined : minRating,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Review Moderation</h2>
        <p className="text-muted-foreground">
          Flag suspicious reviews and remove policy-violating content.
        </p>
      </div>

      <form className="grid gap-3 rounded-lg border p-4 md:grid-cols-3">
        <Input
          name="search"
          placeholder="Search review content, business, customer email"
          defaultValue={params.search}
        />
        <select
          name="minRating"
          defaultValue={params.minRating ?? ""}
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">All ratings</option>
          <option value="5">5 stars only</option>
          <option value="4">4 stars and up</option>
          <option value="3">3 stars and up</option>
          <option value="2">2 stars and up</option>
          <option value="1">1 star and up</option>
        </select>
        <button
          type="submit"
          className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Apply filters
        </button>
      </form>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">
                  {review.business.name} • {review.rating}/5
                </p>
                <p className="text-xs text-muted-foreground">
                  By {review.customer.name ?? "Anonymous"} (
                  {review.customer.email}) on {format(review.createdAt, "PPP")}
                </p>
              </div>
              <div className="flex gap-2">
                <ConfirmActionForm
                  action={flagReview.bind(null, review.id)}
                  confirmMessage="Flag this review for follow-up?"
                  label="Flag"
                  variant="outline"
                />
                <ConfirmActionForm
                  action={removeReview.bind(null, review.id)}
                  confirmMessage="Remove this review permanently?"
                  label="Remove"
                  variant="destructive"
                />
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {review.comment ?? "No review comment provided."}
            </p>
            <div className="mt-3 text-xs text-muted-foreground">
              Booking: {review.booking.id} ({review.booking.status}) •{" "}
              <Link
                href={`/business/${review.business.slug}`}
                className="text-primary hover:underline"
              >
                View public business page
              </Link>
            </div>
          </div>
        ))}

        {reviews.length === 0 && (
          <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
            No reviews found for the current filters.
          </div>
        )}
      </div>
    </div>
  );
}
