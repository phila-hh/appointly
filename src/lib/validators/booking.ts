/**
 * @file Booking Validation Schemas
 * @description Zod schemas for appointment booking creation and management.
 *
 * Used by:
 *   - Booking form (client-side validation)
 *   - createBooking server action (server-side validation)
 *   - updateBookingStatus server action (status transition validation)
 *   - Optional staffId field on createBookingSchema
 *   - Empty string or undefined = "Any Available" (system assigns round-robin)
 *    - A valid staff ID = book with that specific staff member
 */

import { z } from "zod";

/**
 * Schema for creating a new booking.
 *
 * Rules:
 *   - serviceId: required, must be a non-empty string
 *   - businessId: required, must be a non-empty string
 *   - date: required, must be a valid date string (ISO format)
 *   - startTime: required, HH:mm format
 *   - endTime: required, HH:mm format
 *   - notes: optional, free-text customer message
 *   - staffId: optional, specific staff member ID or empty for "any available"
 */
export const createBookingSchema = z.object({
  serviceId: z.string().min(1, { error: "Please select a service." }),
  businessId: z.string().min(1, { error: "Business is required." }),
  date: z.string().min(1, { error: "Please select a date." }),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: "Invalid start time." }),
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: "Invalid end time." }),
  notes: z
    .string()
    .max(500, { error: "Notes must be less than 500 characters." })
    .optional()
    .or(z.literal("")),
  /**
   * Optional staff member preference.
   * Empty string is normalized to null in the server action.
   * Null means "assign any available staff using round-robin."
   */
  staffId: z.string().optional().or(z.literal("")),
});

/** TypeScript type inferred from the create booking schema. */
export type CreateBookingValues = z.infer<typeof createBookingSchema>;

/**
 * Valid booking status transitions.
 * Define which status changes are allowed from each current status.
 *
 * PENDING → CONFIRMED, CANCELLED
 * CONFIRMED → COMPLETED, CANCELLED, NO_SHOW
 * COMPLETED → (no further transitions)
 * CANCELLED → (no further transitions)
 * NO_SHOW → (no further transitions)
 */
export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED", "NO_SHOW"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
} as const;

/**
 * Schema for updating a booking's status.
 *
 * The server action additionally validates that the transition
 * is allowed using VALID_STATUS_TRANSITIONS.
 */
export const updateBookingStatusSchema = z.object({
  bookingId: z.string().min(1),
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]),
});

/** TypeScript type for the status update schema. */
export type UpdateBookingStatusValues = z.infer<
  typeof updateBookingStatusSchema
>;
