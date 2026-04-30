/**
 * @file Review Reply Form Component
 * @description Inline form for business owners to post or edit their reply
 * to a customer review. Shown on the dashboard reviews page.
 *
 * UX pattern (mirrors Google Maps / Booking.com business responses):
 *   - No reply yet:    "Reply to this review" textarea + Save button
 *   - Reply exists:    Reply text displayed + "Edit Reply" button toggle
 *   - Editing:         Textarea pre-filled + Save / Cancel buttons
 *   - Clearing:        Saving with empty text removes the reply entirely
 *
 * This is a Client Component because it manages form state and calls
 * the updateReviewReply server action.
 */

"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { MessageSquare, Pencil, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { updateReviewReply } from "@/lib/actions/review";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// =============================================================================
// Types
// =============================================================================

interface ReviewReplyFormProps {
  reviewId: string;
  /** Current reply text — null means no reply has been posted yet. */
  existingReply: string | null;
  /** When the reply was last posted or edited — shown below the reply text. */
  existingReplyAt: Date | null;
  /** Business name — shown in the reply attribution line. */
  businessName: string;
}

// =============================================================================
// Component
// =============================================================================

export function ReviewReplyForm({
  reviewId,
  existingReply,
  existingReplyAt,
  businessName,
}: ReviewReplyFormProps) {
  const [isPending, startTransition] = useTransition();

  // Whether the reply textarea is currently open for editing
  const [isEditing, setIsEditing] = useState(false);
  // Current text in the textarea (pre-filled with existing reply when editing)
  const [replyText, setReplyText] = useState(existingReply ?? "");

  const hasReply = !!existingReply;
  const charCount = replyText.length;
  const isOverLimit = charCount > 1000;

  // ==========================================================================
  // Handlers
  // ==========================================================================

  function handleEditClick() {
    setReplyText(existingReply ?? "");
    setIsEditing(true);
  }

  function handleCancel() {
    setReplyText(existingReply ?? "");
    setIsEditing(false);
  }

  function handleSave() {
    if (isOverLimit) return;

    startTransition(async () => {
      const result = await updateReviewReply(reviewId, {
        reply: replyText.trim(),
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(result.success ?? "Reply saved.");
      setIsEditing(false);
    });
  }

  function handleRemove() {
    startTransition(async () => {
      const result = await updateReviewReply(reviewId, { reply: "" });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Reply removed.");
      setReplyText("");
      setIsEditing(false);
    });
  }

  // ==========================================================================
  // Render: existing reply (view mode)
  // ==========================================================================

  if (hasReply && !isEditing) {
    return (
      <div className="mt-3 space-y-2">
        {/* Reply display — matches the public-facing card style */}
        <div className="rounded-lg border bg-muted/40 p-3">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">
                Your response
                {existingReplyAt && (
                  <span className="ml-1 font-normal">
                    · {format(existingReplyAt, "MMM d, yyyy")}
                  </span>
                )}
              </p>
            </div>

            {/* Edit + Remove controls */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleEditClick}
                disabled={isPending}
              >
                <Pencil className="mr-1 h-3 w-3" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                onClick={handleRemove}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <X className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
          <p className="text-sm">{existingReply}</p>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // Render: reply form (compose / edit mode)
  // ==========================================================================

  return (
    <div className="mt-3 space-y-2">
      <Label
        htmlFor={`reply-${reviewId}`}
        className="text-xs font-medium text-muted-foreground"
      >
        {hasReply ? "Edit your response" : "Reply to this review"}
      </Label>

      <Textarea
        id={`reply-${reviewId}`}
        value={replyText}
        onChange={(e) => setReplyText(e.target.value)}
        placeholder={`Write a response as ${businessName}...`}
        className="min-h-[80px] resize-none text-sm"
        disabled={isPending}
        maxLength={1100} // Slightly above schema limit — error shown via isOverLimit
      />

      {/* Character count */}
      <p
        className={
          isOverLimit
            ? "text-xs text-destructive"
            : "text-xs text-muted-foreground"
        }
      >
        {charCount}/1000 characters
        {isOverLimit && " — reply is too long"}
      </p>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={
            isPending || isOverLimit || replyText.trim() === existingReply
          }
        >
          {isPending ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Response"
          )}
        </Button>

        {/* Cancel — only shown when editing an existing reply */}
        {hasReply && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
