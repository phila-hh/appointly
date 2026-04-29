/**
 * @file Review Server Actions
 * @description Server-side functions for creating, updating, deleting reviews,
 * and posting business owner replies.
 *
 * Security measures:
 *   - Only COMPLETED bookings can be reviewed
 *   - User must be the customer who made the booking
 *   - One review per booking (enforced by database constraint)
 *   - Users can update their own reviews
 *   - Users can delete their own reviews
 *   - Only the business owner whose business received the review may reply
 *   - One reply per review — subsequent calls overwrite the existing reply
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
  reviewReplySchema,
  type CreateReviewValues,
  type ReviewFormValues,
  type ReviewReplyValues,
} from "@/lib/validators/review";
import { createNotification } from "@/lib/actions/notification";

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
 * Triggers sentiment analysis (fire-and-forget).
 * Sends REVIEW_RECEIVED in-app notification to the business owner.
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
      include: {
        review: { select: { id: true } },
        business: { select: { ownerId: true, name: true, slug: true } },
      },
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

    // Sentiment analysis — fire-and-forget
    analyzeAndUpdateSentiment(review.id, comment).catch((err) => {
      console.error("Sentiment analysis error:", err);
    });

    // In-app notification for business owner
    createNotification({
      userId: booking.business.ownerId,
      type: "REVIEW_RECEIVED",
      title: "New Review Received",
      message: `A customer left a ${rating}-star review for your business.`,
      link: `/dashboard/reviews`,
    }).catch((err) => console.error("Review notification error:", err));

    revalidatePath("/bookings");
    revalidatePath(`/bookings/${bookingId}`);
    revalidatePath(`/business/${booking.business.slug}`);
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
      select: {
        customerId: true,
        bookingId: true,
        business: { select: { slug: true } },
      },
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

    // Re-analyze sentiment — fire-and-forget
    analyzeAndUpdateSentiment(reviewId, comment).catch((err) => {
      console.error("Sentiment re-analysis error:", err);
    });

    revalidatePath("/bookings");
    revalidatePath(`/bookings/${review.bookingId}`);
    revalidatePath(`/business/${review.business.slug}`);
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
      select: {
        customerId: true,
        bookingId: true,
        business: { select: { slug: true } },
      },
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
    revalidatePath(`/business/${review.business.slug}`);
    revalidatePath("/dashboard/reviews");

    return { success: "Review deleted successfully." };
  } catch (error) {
    console.error("Delete review error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

/**
 * Posts or updates a business owner's reply to a customer review.
 *
 * Rules:
 *   - Only the business owner whose business received the review may reply
 *   - One reply per review — calling again overwrites the existing reply
 *   - Passing an empty string clears the reply entirely
 *   - The customer receives a REVIEW_REPLY in-app notification when a
 *     reply is posted (not when it is edited or cleared)
 *
 * @param reviewId - The ID of the review to reply to
 * @param values   - The reply text (empty string to clear)
 * @returns Object with `success` or `error` message
 */
export async function updateReviewReply(
  reviewId: string,
  values: ReviewReplyValues
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "BUSINESS_OWNER") {
      return { error: "Only business owners can reply to reviews." };
    }

    const validatedFields = reviewReplySchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid reply. Please check your input." };
    }

    const { reply } = validatedFields.data;

    // Fetch the review and verify it belongs to this owner's business
    const review = await db.review.findUnique({
      where: { id: reviewId },
      select: {
        id: true,
        customerId: true,
        bookingId: true,
        businessReply: true,
        business: {
          select: {
            ownerId: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!review) {
      return { error: "Review not found." };
    }

    if (review.business.ownerId !== user.id) {
      return { error: "You can only reply to reviews for your own business." };
    }

    const isNewReply = !review.businessReply && !!reply;
    const replyText = reply || null;

    await db.review.update({
      where: { id: reviewId },
      data: {
        businessReply: replyText,
        // Only update the timestamp when setting or changing a reply —
        // clearing it resets both fields to null
        businessReplyAt: replyText ? new Date() : null,
      },
    });

    revalidatePath(`/business/${review.business.slug}`);
    revalidatePath("/dashboard/reviews");
    revalidatePath(`/bookings/${review.bookingId}`);

    // Notify the customer only when a new reply is posted (not on edits or clears)
    if (isNewReply) {
      createNotification({
        userId: review.customerId,
        type: "REVIEW_REPLY",
        title: "Business Replied to Your Review",
        message: `${review.business.name} responded to your review.`,
        link: `/business/${review.business.slug}`,
      }).catch((err) => console.error("Review reply notification error:", err));
    }

    const successMessage = replyText
      ? "Reply posted successfully."
      : "Reply removed successfully.";

    return { success: successMessage };
  } catch (error) {
    console.error("updateReviewReply error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}
