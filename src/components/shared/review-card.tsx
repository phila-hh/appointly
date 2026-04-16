/**
 * @file Review Card Component
 * @description Displays a single review with customer info, rating, comment,
 * and AI-generated sentiment badge.
 *
 * Features:
 *   - Customer name and avatar
 *   - Star rating display
 *   - Review date
 *   - Review comment
 *   - AI sentiment badge (positive/neutral/negative) with confidence
 *   - Service name (which service was reviewed)
 *   - Verified booking badge
 *   - Edit/delete buttons for own reviews
 */

import { format } from "date-fns";
import {
  CheckCircle2,
  MoreVertical,
  Pencil,
  Trash2,
  ThumbsUp,
  Minus,
  ThumbsDown,
} from "lucide-react";

import { StarRating } from "@/components/shared/star-rating";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ReviewCardProps {
  review: {
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
  };
  /** Whether to show action buttons (edit/delete) */
  showActions?: boolean;
  /** Callbacks for actions */
  onEdit?: (reviewId: string) => void;
  onDelete?: (reviewId: string) => void;
  /** Whether to show the service name */
  showService?: boolean;
}

/**
 * Configuration for sentiment badge display.
 * Maps sentiment labels to their visual representation.
 */
const SENTIMENT_CONFIG: Record<
  string,
  {
    label: string;
    className: string;
    icon: typeof ThumbsUp;
  }
> = {
  positive: {
    label: "Positive",
    className:
      "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
    icon: ThumbsUp,
  },
  neutral: {
    label: "Neutral",
    className:
      "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700",
    icon: Minus,
  },
  negative: {
    label: "Negative",
    className:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
    icon: ThumbsDown,
  },
};

export function ReviewCard({
  review,
  showActions = false,
  onEdit,
  onDelete,
  showService = false,
}: ReviewCardProps) {
  // Get sentiment config (if sentiment data exists)
  const sentimentConfig = review.sentimentLabel
    ? SENTIMENT_CONFIG[review.sentimentLabel]
    : null;

  const SentimentIcon = sentimentConfig?.icon;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header: Avatar, name, rating, date, sentiment */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <UserAvatar
                name={review.customer.name}
                image={review.customer.image}
                className="h-10 w-10"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">
                    {review.customer.name ?? "Anonymous"}
                  </p>
                  <Badge variant="outline" className="gap-1 text-xs">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <StarRating rating={review.rating} size="sm" />
                  <span className="text-xs text-muted-foreground">
                    {format(review.createdAt, "MMM d, yyyy")}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Sentiment badge */}
              {sentimentConfig && SentimentIcon && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="outline"
                        className={`gap-1 text-xs ${sentimentConfig.className}`}
                      >
                        <SentimentIcon className="h-3 w-3" />
                        {sentimentConfig.label}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        AI Sentiment: {sentimentConfig.label}
                        {review.sentimentScore !== null &&
                          review.sentimentScore !== undefined && (
                            <span className="ml-1 text-muted-foreground">
                              ({(review.sentimentScore * 100).toFixed(0)}%
                              confidence)
                            </span>
                          )}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Action menu */}
              {showActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Review actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEdit && (
                      <DropdownMenuItem
                        onClick={() => onEdit(review.id)}
                        className="cursor-pointer"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Review
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem
                        onClick={() => onDelete(review.id)}
                        className="cursor-pointer text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Review
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Service name */}
          {showService && review.booking?.service && (
            <p className="text-sm text-muted-foreground">
              Service:{" "}
              <span className="font-medium">{review.booking.service.name}</span>
            </p>
          )}

          {/* Review comment */}
          {review.comment && (
            <p className="text-sm leading-relaxed">{review.comment}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
