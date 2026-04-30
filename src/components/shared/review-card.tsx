/**
 * @file Review Card Component
 * @description Displays a single review with customer info, rating, comment,
 * AI-generated sentiment badge, and business reply.
 *
 * Features:
 *   - Customer name and avatar
 *   - Star rating display
 *   - Review date
 *   - Review comment
 *   - AI sentiment badge (positive/neutral/negative) with confidence tooltip
 *   - Service name (which service was reviewed)
 *   - Verified booking badge
 *   - Edit/delete buttons for customer's own reviews (via dropdown)
 *   - Business reply display — shown publicly when businessReply is set
 *   - ReviewReplyForm — shown to business owners in dashboard view
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
  MessageSquare,
} from "lucide-react";

import { StarRating } from "@/components/shared/star-rating";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ReviewReplyForm } from "@/components/shared/review-reply-form";
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

// =============================================================================
// Types
// =============================================================================

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    comment: string | null;
    sentimentLabel?: string | null;
    sentimentScore?: number | null;
    createdAt: Date;
    /** Business owner's public response to this review. */
    businessReply?: string | null;
    /** When the reply was posted or last edited. */
    businessReplyAt?: Date | null;
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
  /** Whether to show customer edit/delete action buttons. */
  showActions?: boolean;
  onEdit?: (reviewId: string) => void;
  onDelete?: (reviewId: string) => void;
  /** Whether to show the service name above the comment. */
  showService?: boolean;
  /**
   * When provided, renders the ReviewReplyForm below the review comment.
   * Only pass this on the dashboard reviews page (business owner view).
   * Do NOT pass it on the public business page.
   */
  businessName?: string;
}

// =============================================================================
// Sentiment badge config
// =============================================================================

const SENTIMENT_CONFIG: Record<
  string,
  { label: string; className: string; icon: typeof ThumbsUp }
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

// =============================================================================
// Component
// =============================================================================

export function ReviewCard({
  review,
  showActions = false,
  onEdit,
  onDelete,
  showService = false,
  businessName,
}: ReviewCardProps) {
  const sentimentConfig = review.sentimentLabel
    ? SENTIMENT_CONFIG[review.sentimentLabel]
    : null;

  const SentimentIcon = sentimentConfig?.icon;

  /**
   * The reply form is shown when businessName is passed (dashboard view).
   * The reply display is shown on both views when businessReply is set.
   */
  const showReplyForm = !!businessName;
  const showPublicReply = !showReplyForm && !!review.businessReply;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header: avatar, name, rating, date, sentiment, actions */}
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

              {/* Customer action menu (edit/delete own review) */}
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

          {/* ---------------------------------------------------------------- */}
          {/* Public reply display — shown on business page when reply exists  */}
          {/* Not shown in dashboard view (ReplyForm handles that display)     */}
          {/* ---------------------------------------------------------------- */}
          {showPublicReply && (
            <div className="rounded-lg border bg-muted/40 p-3">
              <div className="mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground">
                  Response from the business
                  {review.businessReplyAt && (
                    <span className="ml-1 font-normal">
                      · {format(review.businessReplyAt, "MMM d, yyyy")}
                    </span>
                  )}
                </p>
              </div>
              <p className="text-sm">{review.businessReply}</p>
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* Dashboard reply form — shown only in business owner view         */}
          {/* Handles both compose (no reply) and edit (reply exists) modes    */}
          {/* ---------------------------------------------------------------- */}
          {showReplyForm && (
            <ReviewReplyForm
              reviewId={review.id}
              existingReply={review.businessReply ?? null}
              existingReplyAt={review.businessReplyAt ?? null}
              businessName={businessName}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
