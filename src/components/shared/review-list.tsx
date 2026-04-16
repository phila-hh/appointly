/**
 * @file Review List Component
 * @description Displays a list of reviews with filtering and sorting.
 *
 * Features:
 *   - Sort by newest, oldest, highest, lowest rating
 *   - Filter by star rating (show only 5-star, 4-star, etc.)
 *   - Filter by sentiment (positive, neutral, negative)
 *   - Pagination
 *   - Empty state
 */

"use client";

import { useState } from "react";
import { Star, ThumbsUp, Minus, ThumbsDown } from "lucide-react";

import { ReviewCard } from "@/components/shared/review-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  sentimentLabel?: string | null;
  sentimentScore?: number | null;
  createdAt: Date;
  customer: {
    name: string | null;
    image: string | null;
  };
  booking?: {
    service: {
      name: string;
    };
  };
}

interface ReviewListProps {
  reviews: Review[];
  /** Whether to show action buttons on reviews */
  showActions?: boolean;
  /** Action callbacks */
  onEdit?: (reviewId: string) => void;
  onDelete?: (reviewId: string) => void;
  /** Whether to show service names */
  showService?: boolean;
}

const RATING_FILTERS = [
  { value: "all", label: "All Ratings" },
  { value: "5", label: "5 Stars" },
  { value: "4", label: "4 Stars" },
  { value: "3", label: "3 Stars" },
  { value: "2", label: "2 Stars" },
  { value: "1", label: "1 Star" },
];

const SENTIMENT_FILTERS = [
  { value: "all", label: "All Sentiments" },
  { value: "positive", label: "Positive", icon: ThumbsUp },
  { value: "neutral", label: "Neutral", icon: Minus },
  { value: "negative", label: "Negative", icon: ThumbsDown },
];

export function ReviewList({
  reviews,
  showActions = false,
  onEdit,
  onDelete,
  showService = false,
}: ReviewListProps) {
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "highest" | "lowest"
  >("newest");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [sentimentFilter, setSentimentFilter] = useState("all");

  /** Whether any reviews have sentiment data (controls filter visibility). */
  const hasSentimentData = reviews.some((r) => r.sentimentLabel);

  // Filter by rating
  let filteredReviews = reviews.filter((review) => {
    if (ratingFilter === "all") return true;
    return review.rating === parseInt(ratingFilter);
  });

  // Filter by sentiment
  filteredReviews = filteredReviews.filter((review) => {
    if (sentimentFilter === "all") return true;
    return review.sentimentLabel === sentimentFilter;
  });

  // Sort reviews
  const sortedReviews = [...filteredReviews].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return b.createdAt.getTime() - a.createdAt.getTime();
      case "oldest":
        return a.createdAt.getTime() - b.createdAt.getTime();
      case "highest":
        return b.rating - a.rating;
      case "lowest":
        return a.rating - b.rating;
      default:
        return 0;
    }
  });

  /** Whether any filter is active. */
  const hasActiveFilter = ratingFilter !== "all" || sentimentFilter !== "all";

  /** Clear all filters. */
  function clearFilters() {
    setRatingFilter("all");
    setSentimentFilter("all");
  }

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <Star className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">No reviews yet</h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          Be the first to share your experience!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and sorting */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Rating filter */}
          <Tabs
            value={ratingFilter}
            onValueChange={setRatingFilter}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid w-full grid-cols-6">
              {RATING_FILTERS.map((filter) => (
                <TabsTrigger
                  key={filter.value}
                  value={filter.value}
                  className="text-xs"
                >
                  {filter.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Sort selector */}
          <Select
            value={sortBy}
            onValueChange={(
              value: "newest" | "oldest" | "highest" | "lowest"
            ) => setSortBy(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="highest">Highest Rated</SelectItem>
              <SelectItem value="lowest">Lowest Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sentiment filter — only shown if reviews have sentiment data */}
        {hasSentimentData && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sentiment:</span>
            <div className="flex gap-1.5">
              {SENTIMENT_FILTERS.map((filter) => {
                const Icon = filter.icon;
                const isActive = sentimentFilter === filter.value;

                return (
                  <Button
                    key={filter.value}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    onClick={() => setSentimentFilter(filter.value)}
                  >
                    {Icon && <Icon className="mr-1 h-3 w-3" />}
                    {filter.label}
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Review count */}
      <p className="text-sm text-muted-foreground">
        Showing {sortedReviews.length} of {reviews.length} review
        {reviews.length !== 1 ? "s" : ""}
      </p>

      {/* Reviews list */}
      {sortedReviews.length > 0 ? (
        <div className="space-y-4">
          {sortedReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              showActions={showActions}
              onEdit={onEdit}
              onDelete={onDelete}
              showService={showService}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No reviews match the selected filters.
          </p>
          {hasActiveFilter && (
            <Button
              variant="link"
              size="sm"
              onClick={clearFilters}
              className="mt-2"
            >
              Clear all filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
