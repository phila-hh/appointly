/**
 * @file Admin Review Moderation Page
 * @description Platform-wide review moderation for admins.
 *
 * Features:
 *   - Search reviews by content, business name, or customer email
 *   - Filter by star rating (minimum rating threshold)
 *   - Sentiment badge display (from Phase 16A analysis)
 *   - Flag review for moderation follow-up (audit log entry)
 *   - Remove review permanently with confirmation dialog
 *   - Star rating display for quick scanning
 *   - Link to the business public page
 *   - Empty state when no reviews match filters
 *
 * URL: /admin/reviews?search=...&minRating=...
 */

import Link from "next/link";
import { format } from "date-fns";
import {
  Star,
  MessageSquareWarning,
  ThumbsUp,
  ThumbsDown,
  Minus,
  ExternalLink,
} from "lucide-react";

import { getAdminReviews } from "@/lib/actions/admin-queries";
import { flagReview, removeReview } from "@/lib/actions/admin";
import { ConfirmActionForm } from "@/components/shared/confirm-action-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdminReviewsPageProps {
  searchParams: Promise<{
    search?: string;
    minRating?: string;
  }>;
}

export const metadata = { title: "Review Moderation" };

/**
 * Renders star icons for a given numeric rating.
 * Uses filled/empty star pattern for quick visual scanning.
 */
function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
      <span className="ml-1.5 text-xs font-medium text-muted-foreground">
        {rating}/5
      </span>
    </div>
  );
}

/**
 * Renders a sentiment badge based on the AI-analyzed label.
 * Matches the design from the review-card component (Phase 16A).
 */
function SentimentBadge({
  label,
  score,
}: {
  label: string | null;
  score: number | null;
}) {
  if (!label) return null;

  const config: Record<
    string,
    { className: string; icon: typeof ThumbsUp; text: string }
  > = {
    positive: {
      className:
        "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300",
      icon: ThumbsUp,
      text: "Positive",
    },
    neutral: {
      className:
        "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900 dark:text-gray-300",
      icon: Minus,
      text: "Neutral",
    },
    negative: {
      className:
        "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300",
      icon: ThumbsDown,
      text: "Negative",
    },
  };

  const sentiment = config[label];
  if (!sentiment) return null;

  const Icon = sentiment.icon;

  return (
    <Badge
      variant="outline"
      className={`gap-1 text-xs ${sentiment.className}`}
      title={
        score !== null
          ? `AI confidence: ${(score * 100).toFixed(0)}%`
          : undefined
      }
    >
      <Icon className="h-3 w-3" />
      {sentiment.text}
    </Badge>
  );
}

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
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Review Moderation</h2>
        <p className="text-muted-foreground">
          Flag suspicious reviews for follow-up or permanently remove
          policy-violating content.
        </p>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[240px]">
          <Input
            name="search"
            placeholder="Search content, business, or customer email..."
            defaultValue={params.search}
          />
        </div>

        <Select name="minRating" defaultValue={params.minRating ?? "ALL"}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All ratings" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Ratings</SelectItem>
            <SelectItem value="1">1 Star and up</SelectItem>
            <SelectItem value="2">2 Stars and up</SelectItem>
            <SelectItem value="3">3 Stars and up</SelectItem>
            <SelectItem value="4">4 Stars and up</SelectItem>
            <SelectItem value="5">5 Stars only</SelectItem>
          </SelectContent>
        </Select>

        <Button type="submit">Apply Filters</Button>
      </form>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {reviews.length} review{reviews.length !== 1 ? "s" : ""} found
      </p>

      {/* Reviews list */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Review header */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      {/* Business name */}
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{review.business.name}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          asChild
                        >
                          <Link
                            href={`/business/${review.business.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span className="sr-only">View public page</span>
                          </Link>
                        </Button>
                      </div>

                      {/* Customer info */}
                      <p className="text-sm text-muted-foreground">
                        By{" "}
                        <Link
                          href={`/admin/users/${review.customer.id}`}
                          className="hover:underline"
                        >
                          {review.customer.name ?? "Anonymous"}
                        </Link>{" "}
                        ({review.customer.email}) ·{" "}
                        {format(review.createdAt, "MMM d, yyyy")}
                      </p>

                      {/* Rating + sentiment */}
                      <div className="flex items-center gap-2">
                        <StarDisplay rating={review.rating} />
                        <SentimentBadge
                          label={review.sentimentLabel ?? null}
                          score={review.sentimentScore ?? null}
                        />
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 shrink-0">
                      <ConfirmActionForm
                        action={() => flagReview(review.id)}
                        title="Flag Review"
                        description="Flag this review for moderation follow-up? The review will remain visible but an audit log entry will be created."
                        label="Flag"
                        variant="outline"
                      />
                      <ConfirmActionForm
                        action={() => removeReview(review.id)}
                        title="Remove Review"
                        description="Permanently remove this review? This action cannot be undone."
                        label="Remove"
                        variant="destructive"
                      />
                    </div>
                  </div>

                  {/* Review comment */}
                  {review.comment ? (
                    <p className="text-sm leading-relaxed text-foreground">
                      {review.comment}
                    </p>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">
                      No written comment provided.
                    </p>
                  )}

                  <Separator />

                  {/* Booking metadata */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      Booking:{" "}
                      <span className="font-mono">{review.booking.id}</span>
                    </span>
                    <span>
                      Date: {format(review.booking.date, "MMM d, yyyy")} at{" "}
                      {review.booking.startTime}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {review.booking.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <MessageSquareWarning className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No reviews found</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            No reviews match the current filters. Try adjusting the search or
            rating filter.
          </p>
        </div>
      )}
    </div>
  );
}
