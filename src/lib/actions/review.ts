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
 */

"use server";

import { revalidatePath } from "next/cache";

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import {
  createReviewSchema,
  reviewSchema,
  type CreateReviewValues,
  type ReviewFormValues,
} from "@/lib/validators/review";

/** Standard result type for review actions. */
type ActionResult = {
  success?: string;
  error?: string;
};

/**
 * Creates a new review for a completed booking.
 *
 * Pre-conditions:
 *   - User is authenticated as CUSTOMER
 *   - Booking exists and belongs to the user
 *   - Booking status is COMPLETED
 *   - No review exists for this booking yet
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

    // Validate input
    const validatedFields = createReviewSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid review data. Please check your input." };
    }

    const { bookingId, rating, comment } = validatedFields.data;

    // Fetch the booking with business info
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        review: {
          select: { id: true },
        },
      },
    });

    if (!booking) {
      return { error: "Booking not found." };
    }

    // Verify ownership
    if (booking.customerId !== user.id) {
      return { error: "You can only review your own bookings." };
    }

    // Check booking is completed
    if (booking.status !== "COMPLETED") {
      return {
        error: "You can only review completed appointments.",
      };
    }

    // Check if review already exists
    if (booking.review) {
      return {
        error:
          "You have already reviewed this booking. You can edit your existing review instead.",
      };
    }

    // Create the review
    await db.review.create({
      data: {
        customerId: user.id,
        businessId: booking.businessId,
        bookingId,
        rating,
        comment: comment || null,
      },
    });

    // Revalidate relevant pages
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
 *
 * Pre-conditions:
 *   - User is authenticated
 *   - Review exists and belongs to the user
 *
 * @param reviewId - The ID of the review to update
 * @param values - Updated review data (rating, comment)
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

    // Fetch the review
    const review = await db.review.findUnique({
      where: { id: reviewId },
      select: { customerId: true, bookingId: true },
    });

    if (!review) {
      return { error: "Review not found." };
    }

    // Verify ownership
    if (review.customerId !== user.id) {
      return { error: "You can only edit your own reviews." };
    }

    // Validate input
    const validatedFields = reviewSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid review data. Please check your input." };
    }

    const { rating, comment } = validatedFields.data;

    // Update the review
    await db.review.update({
      where: { id: reviewId },
      data: {
        rating,
        comment: comment || null,
      },
    });

    // Revalidate relevant pages
    revalidatePath("/bookings");
    revalidatePath(`/bookings/${review.bookingId}`);

    return { success: "Review updated successfully!" };
  } catch (error) {
    console.error("Update review error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

/**
 * Deletes a review.
 *
 * Pre-conditions:
 *   - User is authenticated
 *   - Review exists and belongs to the user
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

    // Fetch the review
    const review = await db.review.findUnique({
      where: { id: reviewId },
      select: { customerId: true, bookingId: true },
    });

    if (!review) {
      return { error: "Review not found." };
    }

    // Verify ownership
    if (review.customerId !== user.id) {
      return { error: "You can only delete your own reviews." };
    }

    // Delete the review
    await db.review.delete({
      where: { id: reviewId },
    });

    // Revalidate relevant pages
    revalidatePath("/bookings");
    revalidatePath(`/bookings/${review.bookingId}`);
    revalidatePath("/dashboard/reviews");

    return { success: "Review deleted successfully." };
  } catch (error) {
    console.error("Delete review error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}
