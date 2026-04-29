/**
 * @file Review Validation Schemas
 * @description Zod schemas for review submission, management, and business replies.
 *
 * Used by:
 *   - Review form (client-side validation)
 *   - createReview server action (server-side validation)
 *   - updateReview server action (server-side validation)
 *   - updateReviewReply server action (server-side validation)
 */

import { z } from "zod";

/**
 * Schema for creating or updating a review.
 *
 * Rules:
 *   - rating: required, integer between 1 and 5 (inclusive)
 *   - comment: optional, max 1000 characters
 */
export const reviewSchema = z.object({
  rating: z
    .number({ error: "Please select a rating." })
    .int({ error: "Rating must be a whole number." })
    .min(1, { error: "Rating must be at least 1 star." })
    .max(5, { error: "Rating cannot exceed 5 stars." }),
  comment: z
    .string()
    .max(1000, { error: "Review must be less than 1000 characters." })
    .optional()
    .or(z.literal("")),
});

/** TypeScript type inferred from the review schema. */
export type ReviewFormValues = z.infer<typeof reviewSchema>;

/**
 * Schema for review submission (includes bookingId).
 * Used by the review submission server action.
 */
export const createReviewSchema = reviewSchema.extend({
  bookingId: z.string().min(1, { error: "Booking ID is required." }),
});

/** TypeScript type for review creation. */
export type CreateReviewValues = z.infer<typeof createReviewSchema>;

/**
 * Schema for a business owner's reply to a customer review.
 *
 * Rules:
 *   - reply: required when posting, max 1000 characters
 *
 * Business rules enforced in the server action (not here):
 *   - Only the business owner whose business received the review may reply
 *   - One reply per review — subsequent calls overwrite the existing reply
 *   - Passing null or empty string clears the reply entirely
 *
 * Note: reply is optional here (z.string().optional()) to support
 * the clear-reply case where the owner deletes their response.
 * The server action validates the intent separately.
 */
export const reviewReplySchema = z.object({
  reply: z
    .string()
    .max(1000, { error: "Reply must be less than 1000 characters." })
    .optional()
    .or(z.literal("")),
});

/** TypeScript type for review reply. */
export type ReviewReplyValues = z.infer<typeof reviewReplySchema>;
