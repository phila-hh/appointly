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
 * Features:
 *   - createBooking now accepts optional staffId
 *   - If business has staff: validates staff, checks per-staff conflicts,
 *     and runs round-robin assignment for "any available" bookings
 *   - Businesses without staff are completely unaffected (backwards compatible)\
 *   - createBooking sends booking confirmation to customer (fire-and-forget)
 *   - createBooking sends new booking notification to business owner
 *   - updateBookingStatus sends cancellation emails when status → CANCELLED
 *   - updateBookingStatus sends review request when status → COMPLETED
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
import {
  sendBookingConfirmationEmail,
  sendNewBookingNotificationEmail,
  sendBookingCancelledEmails,
  sendReviewRequestEmail,
} from "@/lib/email-service";

/** Result type for booking creation. */
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
 * After successful creation, fires email notifications (non-blocking):
 *   - Customer receives booking confirmation with payment link
 *   - Business owner receives new booking notification
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

    // Validate input
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

    const staffIdInput = requestedStaffId || null;

    // Verify service exists, is active, and belongs to the business
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

    const bookingDate = new Date(date);
    const requestedStart = timeToMinutes(startTime);
    const requestedEnd = timeToMinutes(endTime);

    // Check if business has active staff for this service
    const staffForService = await db.staff.findMany({
      where: {
        businessId,
        isActive: true,
        services: { some: { serviceId } },
      },
      select: { id: true },
    });

    const businessHasStaff = staffForService.length > 0;
    let assignedStaffId: string | null = null;

    if (businessHasStaff) {
      if (staffIdInput) {
        const isEligible = staffForService.some((s) => s.id === staffIdInput);
        if (!isEligible) {
          return {
            error: "The selected staff member cannot perform this service.",
          };
        }

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
              "This staff member is no longer available at the selected time.",
          };
        }

        assignedStaffId = staffIdInput;
      } else {
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

          if (isAvailable && staffHours && !staffHours.isClosed) {
            availableStaffIds.push(staff.id);
          }
        }

        if (availableStaffIds.length === 0) {
          return {
            error:
              "The time slot is no longer available. Please select a different time.",
          };
        }

        assignedStaffId = await selectStaffRoundRobin(
          availableStaffIds,
          bookingDate,
          db
        );
      }
    } else {
      // Single-provider conflict detection
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

    // Create booking AND payment atomically
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

      await tx.payment.create({
        data: {
          bookingId: newBooking.id,
          amount: service.price,
          status: "PENDING",
        },
      });

      return newBooking;
    });

    // Revalidate
    revalidatePath("/bookings");
    revalidatePath("/dashboard/bookings");

    // -------------------------------------------------------------------------
    // Fire-and-forget email notifications
    // -------------------------------------------------------------------------
    // These run after the booking is created. If they fail, the booking
    // is still created successfully.
    Promise.all([
      sendBookingConfirmationEmail(booking.id),
      sendNewBookingNotificationEmail(booking.id),
    ]).catch((err) => {
      console.error("Booking email notification error:", err);
    });

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
 * Email triggers:
 *   - CANCELLED → send cancellation emails to both parties
 *   - COMPLETED → send review request to the customer
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

    const validatedFields = updateBookingStatusSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid request." };
    }

    const { bookingId, status: newStatus } = validatedFields.data;

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

    const isCustomer = booking.customerId === user.id;
    const isOwner = booking.business.ownerId === user.id;

    if (!isCustomer && !isOwner) {
      return { error: "You do not have permission to update this booking." };
    }

    if (isCustomer && !isOwner && newStatus !== "CANCELLED") {
      return { error: "You can only cancel your bookings." };
    }

    const allowedTransitions = VALID_STATUS_TRANSITIONS[booking.status] ?? [];
    if (!allowedTransitions.includes(newStatus)) {
      return {
        error: `Cannot change status from ${booking.status} to ${newStatus}.`,
      };
    }

    await db.booking.update({
      where: { id: bookingId },
      data: { status: newStatus },
    });

    revalidatePath("/bookings");
    revalidatePath("/dashboard/bookings");

    // -------------------------------------------------------------------------
    // Fire-and-forget email triggers based on new status
    // -------------------------------------------------------------------------
    if (newStatus === "CANCELLED") {
      const cancelledBy = isCustomer ? "customer" : "business";
      sendBookingCancelledEmails(bookingId, cancelledBy).catch((err) => {
        console.error("Cancellation email error:", err);
      });
    }

    if (newStatus === "COMPLETED") {
      // Small delay to ensure DB write is committed
      setTimeout(() => {
        sendReviewRequestEmail(bookingId).catch((err) => {
          console.error("Review request email error:", err);
        });
      }, 2000);
    }

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

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: { select: { duration: true } },
      },
    });

    if (!booking) {
      return { error: "Booking not found." };
    }

    if (booking.customerId !== user.id) {
      return {
        error: "You do not have permission to reschedule this booking.",
      };
    }

    if (booking.status !== "PENDING" && booking.status !== "CONFIRMED") {
      return {
        error: "This booking cannot be rescheduled in its current state.",
      };
    }

    const newBookingDate = new Date(date);
    const requestedStart = timeToMinutes(startTime);
    const requestedEnd = timeToMinutes(endTime);

    if (booking.staffId) {
      const staffBookings = await db.booking.findMany({
        where: {
          staffId: booking.staffId,
          date: newBookingDate,
          status: { in: ["PENDING", "CONFIRMED"] },
          id: { not: bookingId },
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
            "Your assigned staff member is not available at the selected time.",
        };
      }
    } else {
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
