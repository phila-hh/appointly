/**
 * @file Review Form Component
 * @description Form for submitting or editing reviews.
 *
 * Features:
 *   - Interactive star rating selector
 *   - Optional comment text area
 *   - Character counter for comment
 *   - Works in both create and edit modes
 *   - Full validation with Zod
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { reviewSchema, type ReviewFormValues } from "@/lib/validators/review";
import { createReview, updateReview } from "@/lib/actions/review";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { StarRatingInput } from "@/components/shared/star-rating-input";

interface ReviewFormProps {
  /** Booking ID (required for creating a review) */
  bookingId: string;
  /** Existing review data for edit mode */
  initialData?: ReviewFormValues & { id: string };
  /** Business name (for context display) */
  businessName: string;
  /** Service name (for context display) */
  serviceName: string;
  /** Callback after successful submission */
  onSuccess?: () => void;
}

const MAX_COMMENT_LENGTH = 1000;

export function ReviewForm({
  bookingId,
  initialData,
  businessName,
  serviceName,
  onSuccess,
}: ReviewFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const isEditMode = !!initialData;

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: initialData ?? {
      rating: 0,
      comment: "",
    },
  });

  const commentValue = form.watch("comment") ?? "";
  const commentLength = commentValue.length;

  async function onSubmit(values: ReviewFormValues) {
    setIsLoading(true);

    try {
      const result = isEditMode
        ? await updateReview(initialData.id, values)
        : await createReview({ ...values, bookingId });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.success) {
        toast.success(result.success);
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/bookings");
          router.refresh();
        }
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Context display */}
      <div className="rounded-lg border bg-muted/50 p-4">
        <p className="text-sm font-medium">
          {isEditMode ? "Editing review for:" : "Reviewing:"}
        </p>
        <p className="mt-1 text-lg font-semibold">{serviceName}</p>
        <p className="text-sm text-muted-foreground">{businessName}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Star rating */}
          <FormField
            control={form.control}
            name="rating"
            render={({}) => (
              <FormItem>
                <FormLabel>Your Rating *</FormLabel>
                <FormControl>
                  <Controller
                    name="rating"
                    control={form.control}
                    render={({ field }) => (
                      <StarRatingInput
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isLoading}
                        size="lg"
                      />
                    )}
                  />
                </FormControl>
                <FormDescription>
                  How would you rate your experience?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Comment */}
          <FormField
            control={form.control}
            name="comment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Review (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Share your experience with others..."
                    className="min-h-[150px] resize-y"
                    disabled={isLoading}
                    maxLength={MAX_COMMENT_LENGTH}
                    {...field}
                  />
                </FormControl>
                <div className="flex items-center justify-between">
                  <FormDescription>
                    Help others by sharing details about your experience.
                  </FormDescription>
                  <span
                    className={`text-xs ${
                      commentLength > MAX_COMMENT_LENGTH * 0.9
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }`}
                  >
                    {commentLength} / {MAX_COMMENT_LENGTH}
                  </span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit button */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? "Updating..." : "Submitting..."}
                </>
              ) : isEditMode ? (
                "Update Review"
              ) : (
                "Submit Review"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
