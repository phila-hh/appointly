/**
 * @file Review Statistics Component
 * @description Displays overall review metrics and rating distribution.
 *
 * Features:
 *   - Average rating (large display)
 *   - Total review count
 *   - Rating distribution bar chart (5-star to 1-star)
 *   - Percentage breakdown
 */

import { Star } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StarRating } from "@/components/shared/star-rating";

interface ReviewStatisticsProps {
  stats: {
    totalCount: number;
    averageRating: number | null;
    distribution: {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    };
  };
}

export function ReviewStatistics({ stats }: ReviewStatisticsProps) {
  const { totalCount, averageRating, distribution } = stats;

  // Calculate percentages for distribution
  const distributionWithPercentages = [5, 4, 3, 2, 1].map((rating) => {
    const count = distribution[rating as 1 | 2 | 3 | 4 | 5];
    const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;
    return { rating, count, percentage };
  });

  if (totalCount === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Star className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No reviews yet</h3>
          <p className="text-sm text-muted-foreground">
            Reviews will appear here once customers share their feedback.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Average rating card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Average Rating</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="text-5xl font-bold">
            {averageRating?.toFixed(1) ?? "N/A"}
          </div>
          <div>
            <StarRating rating={averageRating ?? 0} size="md" />
            <p className="mt-1 text-sm text-muted-foreground">
              {totalCount.toLocaleString()} review{totalCount !== 1 ? "s" : ""}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Rating distribution */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Rating Distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {distributionWithPercentages.map(({ rating, count, percentage }) => (
            <div key={rating} className="flex items-center gap-3">
              <span className="w-8 text-sm font-medium">{rating} ★</span>
              <div className="relative h-6 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-yellow-400 transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-12 text-right text-sm text-muted-foreground">
                {count}
              </span>
              <span className="w-12 text-right text-xs text-muted-foreground">
                ({percentage.toFixed(0)}%)
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
