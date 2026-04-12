/**
 * @file Review Card Component
 * @description Displays a single review with customer info, rating, and comment.
 *
 * Features:
 *   - Customer name and avatar
 *   - Star rating display
 *   - Review date
 *   - Review comment
 *   - Service name (which service was reviewed)
 *   - Verified booking badge
 *   - Edit/delete buttons for own reviews
 */

import { format } from "date-fns";
import { CheckCircle2, MoreVertical, Pencil, Trash2 } from "lucide-react";

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

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    comment: string | null;
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

export function ReviewCard({
  review,
  showActions = false,
  onEdit,
  onDelete,
  showService = false,
}: ReviewCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header: Avatar, name, rating, date */}
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
