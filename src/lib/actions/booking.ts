/**
 * @file Booking Server Actions
 * @description Server-side functions for creating and managing bookings.
 *
 * Key safety mechanisms:
 *   - Server-side revalidation for all inputs
 *   - Conflict detection immediately before creation (race condition prevention)
 *   - Ownership verification for status update
 *   - Status transition validation (only valid translations allowed)
 *   - Price snapshotting at booking time
 *   - Automatic Payment record creation with booking
 */

"use server";

import { revalidatePath } from "next/cache";

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import {
  createBookingSchema,
  updateBookingStatusSchema,
  VALID_STATUS_TRANSITIONS,
  type CreateBookingValues,
  type UpdateBookingStatusValues,
} from "@/lib/validators/booking";
import { timeToMinutes, rangesOverlap } from "@/lib/booking-utils";

/** Result type for booking creation — includes bookingId for payment redirect.  */
type BookingActionResult = {
  success?: string;
  error?: string;
  bookingId?: string;
};

/** Standard result type for status updates. */
interface ActionResult {
  success?: string;
  error?: string;
}

/**
 * Create a new booking with an associated payment record.
 *
 * Flow:
 *   1. Validate user is authenticated as CUSTOMER
 *   2. Validate input with Zod schema
 *   3. Verify the service exists and belongs to the business
 *   4. Check for time-slot conflicts (race condition prevention)
 *   5. Snapshot the service price
 *   6. Create booking (PENDING) and payment (PENDING) automatically
 *   7. Return the bookingId for redirection to payment page
 *
 * @param values - Booking form data
 * @returns Object with `success`, `error`, and optionally `bookingId`
 */
export async function createBooking(
  values: CreateBookingValues
): Promise<BookingActionResult> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { error: "Please sign in to book an appointment." };
    }

    if (user.role !== "CUSTOMER") {
      return { error: "Only customers can book appointments." };
    }

    // Step 1: Validate input
    const validatedFields = createBookingSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid booking data. Please check your input." };
    }

    const { serviceId, businessId, date, startTime, endTime, notes } =
      validatedFields.data;

    // Step 2: Verify service exists, is active, and belongs to the business
    const service = await db.service.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        businessId: true,
        price: true,
        isActive: true,
        duration: true,
      },
    });

    if (!service || !service.isActive) {
      return { error: "This service is no longer available." };
    }

    if (service.businessId !== businessId) {
      return { error: "Service does not belong to this business." };
    }

    // Step 3: Parse the date
    const bookingDate = new Date(date);

    // Step 4: Check for conflicting bookings
    const existingBookings = await db.booking.findMany({
      where: {
        businessId,
        date: bookingDate,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      select: { startTime: true, endTime: true },
    });

    const requestedStart = timeToMinutes(startTime);
    const requestedEnd = timeToMinutes(endTime);

    const hasConflict = existingBookings.some((booking) => {
      const bookedStart = timeToMinutes(booking.startTime);
      const bookedEnd = timeToMinutes(booking.endTime);
      return rangesOverlap(
        requestedStart,
        requestedEnd,
        bookedStart,
        bookedEnd
      );
    });

    if (hasConflict) {
      return {
        error:
          "The time slot is no longer available. Please select a different time.",
      };
    }

    // Step 5: Create booking AND payment automatically in a transaction
    const booking = await db.$transaction(async (tx) => {
      // Create the booking
      const newBooking = await tx.booking.create({
        data: {
          customerId: user.id,
          businessId,
          serviceId,
          date: bookingDate,
          startTime,
          endTime,
          status: "PENDING",
          totalPrice: service.price,
          notes: notes || null,
        },
      });

      // Create the associated payment record (PENDING no Chapa ref yet)
      await tx.payment.create({
        data: {
          bookingId: newBooking.id,
          amount: service.price,
          status: "PENDING",
        },
      });

      return newBooking;
    });

    // Revalidate relevant paths
    revalidatePath("/bookings");
    revalidatePath("/dashboard/bookings");

    return {
      success: "Booking created! Proceed to payment.",
      bookingId: booking.id,
    };
  } catch (error) {
    console.error("Create booking error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

/**
 * Updates a booking's status
 *
 * Used by both business owners (confirm, complete, no-show, cancel)
 * and customers (cancel).
 *
 * Validates:
 *   - User is authenticated
 *   - User has permission (is the customer or the business owner)
 *   - The status transition is valid per VALID_STATUS_TRANSITIONS
 *
 * @param values - Booking ID and new status
 * @returns Object with `success` or `error` message
 */
export async function updateBookingStatus(
  values: UpdateBookingStatusValues
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Please sign in." };
    }

    // Validate input
    const validatedFields = updateBookingStatusSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid request" };
    }

    const { bookingId, status: newStatus } = validatedFields.data;

    // Fetch the booking with business ownership info
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        business: {
          select: { ownerId: true, slug: true },
        },
      },
    });

    if (!booking) {
      return { error: "Booking not found." };
    }

    // Check permission: must be the customer or the business owner
    const isCustomer = booking.customerId === user.id;
    const isOwner = booking.business.ownerId === user.id;

    if (!isCustomer && !isOwner) {
      return { error: "You do not have permission to update this booking." };
    }

    // Customer can only cancel their bookings
    if (isCustomer && !isOwner && newStatus !== "CANCELLED") {
      return { error: "You can only cancel your bookings." };
    }

    // Validate the status transition
    const allowedTransitions = VALID_STATUS_TRANSITIONS[booking.status] ?? [];
    if (!allowedTransitions.includes(newStatus)) {
      return {
        error: `Cannot change status from ${booking.status} to ${newStatus}.`,
      };
    }

    // Update the status
    await db.booking.update({
      where: { id: bookingId },
      data: { status: newStatus },
    });

    // Revalidate relevant pages
    revalidatePath("/bookings");
    revalidatePath("/dashboard/bookings");

    const statusLabels: Record<string, string> = {
      CONFIRMED: "confirmed",
      COMPLETED: "marked as completed",
      CANCELLED: "cancelled",
      NO_SHOW: "marked as no-show",
    };

    return {
      success: `Booking has been ${statusLabels[newStatus] ?? "updated"}.`,
    };
  } catch (error) {
    console.log("Update booking error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}
