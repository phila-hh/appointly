/**
 * @file Review Server Actions
 * @description Server-side functions for creating, updating, and deleting reviews.
 *
 * Security measures:
 *   - Only COMPLETED bookings can be reviewed
 *   - User must be the customer who made the booking
 *   - One review per booking (enforced by database constraint)
 *   - Users can update their own reviews
 *   - Users can delete their own reviews
 *
 * AI integration:
 *   - Sentiment analysis runs inline after review creation/update
 *   - If analysis fails, the review is saved without sentiment data
 *   - Sentiment is re-analyzed on review update (comment may have changed)
 */

"use server";

import { revalidatePath } from "next/cache";

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { analyzeSentiment } from "@/lib/ai";
import {
  createReviewSchema,
  reviewSchema,
  type CreateReviewValues,
  type ReviewFormValues,
} from "@/lib/validators/review";

type ActionResult = {
  success?: string;
  error?: string;
};

/**
 * Runs sentiment analysis on a review comment and updates the review record.
 * Non-throwing — on failure the review stays without sentiment data.
 */
async function analyzeAndUpdateSentiment(
  reviewId: string,
  comment: string | null | undefined
): Promise<void> {
  if (!comment || comment.trim().length === 0) {
    await db.review.update({
      where: { id: reviewId },
      data: { sentimentLabel: null, sentimentScore: null },
    });
    return;
  }

  const sentiment = await analyzeSentiment(comment);

  if (sentiment) {
    await db.review.update({
      where: { id: reviewId },
      data: {
        sentimentLabel: sentiment.label,
        sentimentScore: sentiment.score,
      },
    });
  }
}

/**
 * Creates a new review for a completed booking.
 * Triggers sentiment analysis (Phase 16A).
 *
 * @param values - Review data (bookingId, rating, comment)
 * @returns Object with `success` or `error` message
 */
export async function createReview(
  values: CreateReviewValues
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { error: "Please sign in to leave a review." };
    }

    if (user.role !== "CUSTOMER") {
      return { error: "Only customers can leave reviews." };
    }

    const validatedFields = createReviewSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid review data. Please check your input." };
    }

    const { bookingId, rating, comment } = validatedFields.data;

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: { review: { select: { id: true } } },
    });

    if (!booking) {
      return { error: "Booking not found." };
    }

    if (booking.customerId !== user.id) {
      return { error: "You can only review your own bookings." };
    }

    if (booking.status !== "COMPLETED") {
      return { error: "You can only review completed appointments." };
    }

    if (booking.review) {
      return {
        error:
          "You have already reviewed this booking. You can edit your existing review instead.",
      };
    }

    const review = await db.review.create({
      data: {
        customerId: user.id,
        businessId: booking.businessId,
        bookingId,
        rating,
        comment: comment || null,
      },
    });

    // Sentiment analysis (Phase 16A — fire-and-forget)
    analyzeAndUpdateSentiment(review.id, comment).catch((err) => {
      console.error("Sentiment analysis error:", err);
    });

    revalidatePath("/bookings");
    revalidatePath(`/bookings/${bookingId}`);
    revalidatePath("/dashboard/reviews");

    return {
      success: "Review submitted successfully! Thank you for your feedback.",
    };
  } catch (error) {
    console.error("Create review error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

/**
 * Updates an existing review.
 * Re-runs sentiment analysis on the updated comment.
 *
 * @param reviewId - The ID of the review to update
 * @param values - Updated review data
 * @returns Object with `success` or `error` message
 */
export async function updateReview(
  reviewId: string,
  values: ReviewFormValues
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { error: "Please sign in." };
    }

    const review = await db.review.findUnique({
      where: { id: reviewId },
      select: { customerId: true, bookingId: true },
    });

    if (!review) {
      return { error: "Review not found." };
    }

    if (review.customerId !== user.id) {
      return { error: "You can only edit your own reviews." };
    }

    const validatedFields = reviewSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid review data. Please check your input." };
    }

    const { rating, comment } = validatedFields.data;

    await db.review.update({
      where: { id: reviewId },
      data: { rating, comment: comment || null },
    });

    // Re-analyze sentiment (fire-and-forget)
    analyzeAndUpdateSentiment(reviewId, comment).catch((err) => {
      console.error("Sentiment re-analysis error:", err);
    });

    revalidatePath("/bookings");
    revalidatePath(`/bookings/${review.bookingId}`);
    revalidatePath("/dashboard/reviews");

    return { success: "Review updated successfully!" };
  } catch (error) {
    console.error("Update review error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

/**
 * Deletes a review.
 *
 * @param reviewId - The ID of the review to delete
 * @returns Object with `success` or `error` message
 */
export async function deleteReview(reviewId: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { error: "Please sign in." };
    }

    const review = await db.review.findUnique({
      where: { id: reviewId },
      select: { customerId: true, bookingId: true },
    });

    if (!review) {
      return { error: "Review not found." };
    }

    if (review.customerId !== user.id) {
      return { error: "You can only delete your own reviews." };
    }

    await db.review.delete({ where: { id: reviewId } });

    revalidatePath("/bookings");
    revalidatePath(`/bookings/${review.bookingId}`);
    revalidatePath("/dashboard/reviews");

    return { success: "Review deleted successfully." };
  } catch (error) {
    console.error("Delete review error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}
