/**
 * @file Review Statistics Component
 * @description Displays overall review metrics, rating distribution,
 * and AI sentiment analysis summary.
 *
 * Features:
 *   - Average rating (large display)
 *   - Total review count
 *   - Rating distribution bar chart (5-star to 1-star)
 *   - Percentage breakdown
 *   - AI Sentiment summary card (positive/neutral/negative distribution)
 */

import { Star, ThumbsUp, Minus, ThumbsDown, BrainCircuit } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StarRating } from "@/components/shared/star-rating";

/** Sentiment distribution data shape. */
interface SentimentDistribution {
  positive: number;
  neutral: number;
  negative: number;
  totalAnalyzed: number;
}

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
    sentimentDistribution?: SentimentDistribution;
  };
}

/**
 * Sentiment bar configuration for display.
 */
const SENTIMENT_BARS = [
  {
    key: "positive" as const,
    label: "Positive",
    icon: ThumbsUp,
    colorClass: "bg-green-500",
    textClass: "text-green-700 dark:text-green-400",
  },
  {
    key: "neutral" as const,
    label: "Neutral",
    icon: Minus,
    colorClass: "bg-gray-400",
    textClass: "text-gray-700 dark:text-gray-400",
  },
  {
    key: "negative" as const,
    label: "Negative",
    icon: ThumbsDown,
    colorClass: "bg-red-500",
    textClass: "text-red-700 dark:text-red-400",
  },
];

export function ReviewStatistics({ stats }: ReviewStatisticsProps) {
  const { totalCount, averageRating, distribution, sentimentDistribution } =
    stats;

  // Calculate percentages for rating distribution
  const distributionWithPercentages = [5, 4, 3, 2, 1].map((rating) => {
    const count = distribution[rating as 1 | 2 | 3 | 4 | 5];
    const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;
    return { rating, count, percentage };
  });

  /** Whether sentiment data is available and worth showing. */
  const hasSentiment =
    sentimentDistribution && sentimentDistribution.totalAnalyzed > 0;

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
    <div className="space-y-6">
      {/* Top row: Average rating + Rating distribution */}
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
                {totalCount.toLocaleString()} review
                {totalCount !== 1 ? "s" : ""}
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
            {distributionWithPercentages.map(
              ({ rating, count, percentage }) => (
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
              )
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sentiment analysis summary — only shown if data exists */}
      {hasSentiment && sentimentDistribution && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BrainCircuit className="h-4 w-4" />
              AI Sentiment Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Sentiment summary text */}
              <p className="text-sm text-muted-foreground">
                Based on analysis of{" "}
                {sentimentDistribution.totalAnalyzed.toLocaleString()} review
                {sentimentDistribution.totalAnalyzed !== 1 ? "s" : ""} with
                comments.
              </p>

              {/* Sentiment bars */}
              <div className="space-y-3">
                {SENTIMENT_BARS.map(
                  ({ key, label, icon: Icon, colorClass, textClass }) => {
                    const count = sentimentDistribution[key];
                    const percentage =
                      sentimentDistribution.totalAnalyzed > 0
                        ? (count / sentimentDistribution.totalAnalyzed) * 100
                        : 0;

                    return (
                      <div key={key} className="flex items-center gap-3">
                        <div
                          className={`flex w-24 items-center gap-1.5 text-sm font-medium ${textClass}`}
                        >
                          <Icon className="h-4 w-4" />
                          {label}
                        </div>
                        <div className="relative h-6 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full ${colorClass} transition-all`}
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
                    );
                  }
                )}
              </div>

              {/* Overall sentiment indicator */}
              {sentimentDistribution.totalAnalyzed > 0 && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-sm">
                    <span className="font-medium">Overall Sentiment: </span>
                    {(() => {
                      const { positive, neutral, negative } =
                        sentimentDistribution;
                      if (positive >= neutral && positive >= negative) {
                        return (
                          <span className="text-green-700 dark:text-green-400">
                            Mostly Positive 😊
                          </span>
                        );
                      }
                      if (negative >= positive && negative >= neutral) {
                        return (
                          <span className="text-red-700 dark:text-red-400">
                            Mostly Negative 😔
                          </span>
                        );
                      }
                      return (
                        <span className="text-gray-700 dark:text-gray-400">
                          Mixed / Neutral 😐
                        </span>
                      );
                    })()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
