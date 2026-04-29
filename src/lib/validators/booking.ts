/**
 * @file Booking Validation Schemas
 * @description Zod schemas for appointment booking creation and management.
 *
 * Used by:
 *   - Booking form (client-side validation)
 *   - createBooking server action (server-side validation)
 *   - updateBookingStatus server action (status transition validation)
 *   - rescheduleBooking server action (server-side validation)
 *
 * staffId field on createBookingSchema:
 *   - Empty string or undefined = "Any Available" (system assigns round-robin)
 *   - A valid staff ID = book with that specific staff member
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
  staffId: z.string().optional().or(z.literal("")),
});

/** TypeScript type inferred from the create booking schema. */
export type CreateBookingValues = z.infer<typeof createBookingSchema>;

/**
 * Schema for rescheduling an existing confirmed booking.
 *
 * Rules:
 *   - bookingId: required, identifies the booking to reschedule
 *   - date: required, the new appointment date (ISO string)
 *   - startTime: required, new start time in HH:mm format
 *   - endTime: required, new end time in HH:mm format
 *
 * Business rules enforced in the server action (not here):
 *   - Booking must be CONFIRMED (paid) — PENDING bookings cannot be rescheduled
 *   - Must be more than 24 hours before the current appointment
 *   - rescheduleCount must be less than 2 (maximum 2 reschedules allowed)
 *   - New slot must not conflict with existing bookings
 */
export const rescheduleBookingSchema = z.object({
  bookingId: z.string().min(1, { error: "Booking ID is required." }),
  date: z.string().min(1, { error: "Please select a date." }),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: "Invalid start time." }),
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: "Invalid end time." }),
});

/** TypeScript type inferred from the reschedule booking schema. */
export type RescheduleBookingValues = z.infer<typeof rescheduleBookingSchema>;

/**
 * Valid booking status transitions.
 * Defines which status changes are allowed from each current status.
 *
 * PENDING   → CONFIRMED (payment webhook), CANCELLED
 * CONFIRMED → COMPLETED, CANCELLED, NO_SHOW
 * COMPLETED → (terminal — no further transitions)
 * CANCELLED → (terminal — no further transitions)
 * NO_SHOW   → (terminal — no further transitions)
 *
 * Note: The "Confirm" button has been removed from the business owner UI.
 * PENDING → CONFIRMED only happens automatically via the payment webhook.
 * The transition remains here to support that automated flow.
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
 * The cancellationReason field is required when a business owner cancels
 * a CONFIRMED booking. It is sent to the customer via email so they
 * understand why their paid appointment was cancelled.
 *
 * Enforcement of when cancellationReason is required is handled in the
 * server action — Zod makes it optional here because the field is not
 * needed for customer cancellations or other status transitions.
 */
export const updateBookingStatusSchema = z.object({
  bookingId: z.string().min(1),
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]),
  cancellationReason: z
    .string()
    .max(500, { error: "Reason must be less than 500 characters." })
    .optional()
    .or(z.literal("")),
});

/** TypeScript type for the status update schema. */
export type UpdateBookingStatusValues = z.infer<
  typeof updateBookingStatusSchema
>;
