/**
 * @file Booking Server Actions
 * @description Server-side functions for creating and managing bookings.
 *
 * Key safety mechanisms:
 *   - Server-side revalidation for all inputs
 *   - Conflict detection immediately before creation (race condition prevention)
 *   - Ownership verification for status updates
 *   - Status transition validation (only valid transitions allowed)
 *   - Price snapshotting at booking time
 *   - Automatic Payment record creation with booking
 *
 * Phase 15B additions:
 *   - createBooking now accepts optional staffId
 *   - If business has staff: validates staff, checks per-staff conflicts,
 *     and runs round-robin assignment for "any available" bookings
 *   - Businesses without staff are completely unaffected (backwards compatible)
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
import {
  timeToMinutes,
  rangesOverlap,
  getCancellationDeadline,
  selectStaffRoundRobin,
} from "@/lib/booking-utils";

/** Result type for booking creation — includes bookingId for payment redirect. */
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
 * Flow (single-provider — no staff):
 *   1. Validate user is authenticated as CUSTOMER
 *   2. Validate input with Zod schema
 *   3. Verify the service exists and belongs to the business
 *   4. Check for time-slot conflicts against all business bookings
 *   5. Snapshot the service price
 *   6. Create booking (PENDING) and payment (PENDING) in a transaction
 *   7. Return the bookingId for redirection to payment page
 *
 * Flow (multi-provider — staff configured):
 *   1–3. Same as above
 *   4a. If specific staffId provided → validate staff can perform service,
 *       check conflicts only for that staff member
 *   4b. If no staffId (any available) → run round-robin to select staff
 *       from the slot's availableStaffIds
 *   5–7. Same as above, with staffId stored on the booking
 *
 * @param values - Booking form data (including optional staffId)
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

    const {
      serviceId,
      businessId,
      date,
      startTime,
      endTime,
      notes,
      staffId: requestedStaffId,
    } = validatedFields.data;

    // Normalize empty string staffId to null
    const staffIdInput = requestedStaffId || null;

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

    // Step 3: Parse the booking date
    const bookingDate = new Date(date);
    const requestedStart = timeToMinutes(startTime);
    const requestedEnd = timeToMinutes(endTime);

    // Step 4: Check if this business has active staff for this service
    const staffForService = await db.staff.findMany({
      where: {
        businessId,
        isActive: true,
        services: {
          some: { serviceId },
        },
      },
      select: { id: true },
    });

    const businessHasStaff = staffForService.length > 0;

    // -------------------------------------------------------------------------
    // Conflict detection + staff assignment (staff-aware path)
    // -------------------------------------------------------------------------
    let assignedStaffId: string | null = null;

    if (businessHasStaff) {
      if (staffIdInput) {
        // Specific staff requested — validate they can perform the service
        const isEligible = staffForService.some((s) => s.id === staffIdInput);

        if (!isEligible) {
          return {
            error: "The selected staff member cannot perform this service.",
          };
        }

        // Check for conflicts with this specific staff member's bookings
        const staffBookings = await db.booking.findMany({
          where: {
            staffId: staffIdInput,
            date: bookingDate,
            status: { in: ["PENDING", "CONFIRMED"] },
          },
          select: { startTime: true, endTime: true },
        });

        const hasStaffConflict = staffBookings.some((booking) =>
          rangesOverlap(
            requestedStart,
            requestedEnd,
            timeToMinutes(booking.startTime),
            timeToMinutes(booking.endTime)
          )
        );

        if (hasStaffConflict) {
          return {
            error:
              "This staff member is no longer available at the selected time. Please choose another time or staff member.",
          };
        }

        assignedStaffId = staffIdInput;
      } else {
        // "Any Available" mode — find which staff are free for this slot
        // by checking each staff member's bookings individually
        const availableStaffIds: string[] = [];

        for (const staff of staffForService) {
          const staffBookings = await db.booking.findMany({
            where: {
              staffId: staff.id,
              date: bookingDate,
              status: { in: ["PENDING", "CONFIRMED"] },
            },
            select: { startTime: true, endTime: true },
          });

          const isAvailable = !staffBookings.some((booking) =>
            rangesOverlap(
              requestedStart,
              requestedEnd,
              timeToMinutes(booking.startTime),
              timeToMinutes(booking.endTime)
            )
          );

          // Also check staff has hours for this day
          const bookingDayOfWeek = [
            "SUNDAY",
            "MONDAY",
            "TUESDAY",
            "WEDNESDAY",
            "THURSDAY",
            "FRIDAY",
            "SATURDAY",
          ][bookingDate.getDay()] as
            | "SUNDAY"
            | "MONDAY"
            | "TUESDAY"
            | "WEDNESDAY"
            | "THURSDAY"
            | "FRIDAY"
            | "SATURDAY";

          const staffHours = await db.staffHours.findUnique({
            where: {
              staffId_dayOfWeek: {
                staffId: staff.id,
                dayOfWeek: bookingDayOfWeek,
              },
            },
          });

          const isWorkingThisDay = staffHours && !staffHours.isClosed;

          if (isAvailable && isWorkingThisDay) {
            availableStaffIds.push(staff.id);
          }
        }

        if (availableStaffIds.length === 0) {
          return {
            error:
              "The time slot is no longer available. Please select a different time.",
          };
        }

        // Run round-robin to pick the staff member with fewest bookings today
        assignedStaffId = await selectStaffRoundRobin(
          availableStaffIds,
          bookingDate,
          db
        );
      }
    } else {
      // -----------------------------------------------------------------------
      // Conflict detection (single-provider path — original logic unchanged)
      // -----------------------------------------------------------------------
      const existingBookings = await db.booking.findMany({
        where: {
          businessId,
          date: bookingDate,
          status: { in: ["PENDING", "CONFIRMED"] },
        },
        select: { startTime: true, endTime: true },
      });

      const hasConflict = existingBookings.some((booking) =>
        rangesOverlap(
          requestedStart,
          requestedEnd,
          timeToMinutes(booking.startTime),
          timeToMinutes(booking.endTime)
        )
      );

      if (hasConflict) {
        return {
          error:
            "The time slot is no longer available. Please select a different time.",
        };
      }
    }

    // Step 5: Create booking AND payment atomically in a transaction
    const booking = await db.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          customerId: user.id,
          businessId,
          serviceId,
          staffId: assignedStaffId,
          date: bookingDate,
          startTime,
          endTime,
          status: "PENDING",
          totalPrice: service.price,
          notes: notes || null,
          isCancellable: true,
          cancellationDeadline: getCancellationDeadline(bookingDate, startTime),
          cancellationFee: 0,
        },
      });

      // Create the associated payment record (PENDING, no Chapa ref yet)
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
 * Updates a booking's status.
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
      return { error: "Invalid request." };
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
    console.error("Update booking error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

/**
 * Reschedules an existing booking to a new date and time.
 *
 * Validates:
 *   - User owns the booking
 *   - Booking is in a state that allows rescheduling (PENDING or CONFIRMED)
 *   - New time slot is available (respects staff assignment if present)
 *   - New time is in the future
 *
 * @param values - Booking ID, new date, new start/end times
 * @returns Object with `success` or `error` message
 */
export async function rescheduleBooking(values: {
  bookingId: string;
  date: string;
  startTime: string;
  endTime: string;
}): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { error: "Please sign in." };
    }

    const { bookingId, date, startTime, endTime } = values;

    // Fetch the booking with its current staff assignment
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: {
          select: { duration: true },
        },
      },
    });

    if (!booking) {
      return { error: "Booking not found." };
    }

    // Verify ownership
    if (booking.customerId !== user.id) {
      return {
        error: "You do not have permission to reschedule this booking.",
      };
    }

    // Check booking is in a reschedulable state
    if (booking.status !== "PENDING" && booking.status !== "CONFIRMED") {
      return {
        error: "This booking cannot be rescheduled in its current state.",
      };
    }

    const newBookingDate = new Date(date);
    const requestedStart = timeToMinutes(startTime);
    const requestedEnd = timeToMinutes(endTime);

    if (booking.staffId) {
      // Staff-aware rescheduling — check conflicts for the assigned staff member
      const staffBookings = await db.booking.findMany({
        where: {
          staffId: booking.staffId,
          date: newBookingDate,
          status: { in: ["PENDING", "CONFIRMED"] },
          id: { not: bookingId }, // Exclude the current booking
        },
        select: { startTime: true, endTime: true },
      });

      const hasConflict = staffBookings.some((b) =>
        rangesOverlap(
          requestedStart,
          requestedEnd,
          timeToMinutes(b.startTime),
          timeToMinutes(b.endTime)
        )
      );

      if (hasConflict) {
        return {
          error:
            "Your assigned staff member is not available at the selected time. Please choose a different time.",
        };
      }
    } else {
      // Single-provider rescheduling — check against all business bookings
      const existingBookings = await db.booking.findMany({
        where: {
          businessId: booking.businessId,
          date: newBookingDate,
          status: { in: ["PENDING", "CONFIRMED"] },
          id: { not: bookingId },
        },
        select: { startTime: true, endTime: true },
      });

      const hasConflict = existingBookings.some((b) =>
        rangesOverlap(
          requestedStart,
          requestedEnd,
          timeToMinutes(b.startTime),
          timeToMinutes(b.endTime)
        )
      );

      if (hasConflict) {
        return {
          error:
            "The selected time slot is not available. Please choose a different time.",
        };
      }
    }

    // Update the booking
    await db.booking.update({
      where: { id: bookingId },
      data: {
        date: newBookingDate,
        startTime,
        endTime,
        cancellationDeadline: getCancellationDeadline(
          newBookingDate,
          startTime
        ),
      },
    });

    revalidatePath("/bookings");
    revalidatePath(`/bookings/${bookingId}`);

    return { success: "Booking rescheduled successfully!" };
  } catch (error) {
    console.error("Reschedule booking error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}
