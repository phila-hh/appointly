/**
 * @file Review Validation Schemas
 * @description Zod schemas for review submission and management.
 *
 * Used by:
 *   - Review form (client-side validation)
 *   - createReview server action (server-side validation)
 *   - updateReview server action (server-side validation)
 */

import { z } from "zod";

/**
 * Schema for creating or updating a review.
 *
 * Rules:
 *   - Rating: required, integer between 1 and 5 (inclusive)
 *   - Comment: optional, max 1000 characters
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

/** TypeScript type inferred from the review schema */
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
