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
 * Booking lifecycle guards:
 *   - COMPLETED / NO_SHOW: appointment end time must have passed
 *   - CANCELLED by business owner: cancellationReason is required;
 *     if booking was paid, a full refund is automatically triggered
 *   - CANCELLED by customer: refund eligibility depends on whether the
 *     cancellation is within the free window (>24h before appointment)
 *
 * Reschedule rules:
 *   - Only CONFIRMED (paid) bookings may be rescheduled
 *   - Must be more than 24 hours before the current appointment start
 *   - Maximum 2 reschedules per booking (rescheduleCount tracks this)
 *   - New slot must not conflict with existing bookings
 *   - cancellationDeadline is recalculated for the new appointment date/time
 *
 * Email triggers (fire-and-forget):
 *   - createBooking           → confirmation to customer + notification to business
 *   - updateBookingStatus     → cancellation emails when CANCELLED
 *                             → review request when COMPLETED
 *                             → refund email when CANCELLED + was paid
 *   - rescheduleBooking       → rescheduled email to both parties
 *
 * In-app notification triggers:
 *   - createBooking           → NEW_BOOKING for business owner
 *   - updateBookingStatus     → BOOKING_CANCELLED for both parties (if paid)
 *                             → REVIEW_REQUEST for customer on COMPLETED
 *   - rescheduleBooking       → BOOKING_RESCHEDULED for both parties
 */

"use server";

import { revalidatePath } from "next/cache";

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import {
  createBookingSchema,
  rescheduleBookingSchema,
  updateBookingStatusSchema,
  VALID_STATUS_TRANSITIONS,
  type CreateBookingValues,
  type UpdateBookingStatusValues,
  type RescheduleBookingValues,
} from "@/lib/validators/booking";
import {
  timeToMinutes,
  rangesOverlap,
  getCancellationDeadline,
  canCancelForFree,
  selectStaffRoundRobin,
} from "@/lib/booking-utils";
import {
  sendBookingConfirmationEmail,
  sendNewBookingNotificationEmail,
  sendBookingCancelledEmails,
  sendReviewRequestEmail,
  sendBookingRescheduledEmail,
} from "@/lib/email-service";
import { createNotification } from "@/lib/actions/notification";
import { processRefund } from "@/lib/actions/payment";

// =============================================================================
// Types
// =============================================================================

/** Result type for booking creation. */
type BookingActionResult = {
  success?: string;
  error?: string;
  bookingId?: string;
};

/** Standard result type for status updates and reschedules. */
type ActionResult = {
  success?: string;
  error?: string;
};

// =============================================================================
// Create Booking
// =============================================================================

/**
 * Create a new booking with an associated payment record.
 *
 * After successful creation, fires email notifications (non-blocking):
 *   - Customer receives booking confirmation with payment link
 *   - Business owner receives new booking notification
 *   - Business owner receives NEW_BOOKING in-app notification
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

    // Fetch business owner ID for the in-app notification
    const business = await db.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true, name: true },
    });

    if (!business) {
      return { error: "Business not found." };
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
          rescheduleCount: 0,
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
    // Fire-and-forget: emails + in-app notification for business owner
    // -------------------------------------------------------------------------
    Promise.all([
      sendBookingConfirmationEmail(booking.id),
      sendNewBookingNotificationEmail(booking.id),
      createNotification({
        userId: business.ownerId,
        type: "NEW_BOOKING",
        title: "New Booking Received",
        message: `${user.name ?? "A customer"} booked an appointment.`,
        link: `/dashboard/bookings`,
      }),
    ]).catch((err) => {
      console.error("Booking creation notification error:", err);
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

// =============================================================================
// Update Booking Status
// =============================================================================

/**
 * Updates a booking's status with lifecycle guards and side effects.
 *
 * Guards enforced:
 *   - COMPLETED / NO_SHOW: appointment end time must have passed
 *   - CANCELLED by business: cancellationReason required; full refund if paid
 *   - CANCELLED by customer within 24h: no refund (within cancellation window)
 *   - CANCELLED by customer outside 24h: full refund if paid
 *
 * Email triggers:
 *   - CANCELLED → cancellation emails to both parties
 *   - COMPLETED → review request to customer (2s delay for DB commit)
 *   - CANCELLED + paid → refund confirmation email (via processRefund)
 *
 * In-app notification triggers:
 *   - CANCELLED → BOOKING_CANCELLED for both parties (if paid, business gets
 *                 REFUND_ISSUED; customer gets BOOKING_CANCELLED)
 *   - COMPLETED → REVIEW_REQUEST for customer
 *
 * @param values - Booking ID, new status, and optional cancellation reason
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

    const {
      bookingId,
      status: newStatus,
      cancellationReason,
    } = validatedFields.data;

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        business: {
          select: { ownerId: true, slug: true, name: true },
        },
        service: {
          select: { name: true },
        },
        payment: {
          select: { id: true, status: true, chapaTransactionRef: true },
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

    // Customers may only cancel their own bookings
    if (isCustomer && !isOwner && newStatus !== "CANCELLED") {
      return { error: "You can only cancel your bookings." };
    }

    // Business owners cancelling a confirmed booking must provide a reason
    if (
      isOwner &&
      !isCustomer &&
      newStatus === "CANCELLED" &&
      booking.status === "CONFIRMED" &&
      (!cancellationReason || cancellationReason.trim().length < 5)
    ) {
      return {
        error:
          "Please provide a reason for cancelling a confirmed booking. The customer will be notified.",
      };
    }

    // Validate the status transition
    const allowedTransitions = VALID_STATUS_TRANSITIONS[booking.status] ?? [];
    if (!allowedTransitions.includes(newStatus)) {
      return {
        error: `Cannot change status from ${booking.status} to ${newStatus}.`,
      };
    }

    // -------------------------------------------------------------------------
    // Guard: COMPLETED and NO_SHOW require the appointment to have ended
    // -------------------------------------------------------------------------
    if (newStatus === "COMPLETED" || newStatus === "NO_SHOW") {
      const [endHour, endMinute] = booking.endTime.split(":").map(Number);
      const appointmentEnd = new Date(booking.date);
      appointmentEnd.setHours(endHour, endMinute, 0, 0);

      if (new Date() < appointmentEnd) {
        const label = newStatus === "COMPLETED" ? "complete" : "no-show";
        return {
          error: `Cannot mark as ${label} before the appointment has ended.`,
        };
      }
    }

    // Update the booking status
    await db.booking.update({
      where: { id: bookingId },
      data: { status: newStatus },
    });

    revalidatePath("/bookings");
    revalidatePath(`/bookings/${bookingId}`);
    revalidatePath("/dashboard/bookings");

    // -------------------------------------------------------------------------
    // Side effects — fire-and-forget
    // -------------------------------------------------------------------------
    const isPaid = booking.payment?.status === "SUCCEEDED";
    const cancelledBy = isCustomer && !isOwner ? "customer" : "business";
    const isFreeWindow = canCancelForFree(
      new Date(booking.date),
      booking.startTime
    );

    if (newStatus === "CANCELLED") {
      // Determine refund eligibility
      const isEligibleForRefund =
        isPaid &&
        (cancelledBy === "business" || // Business always refunds
          (cancelledBy === "customer" && isFreeWindow)); // Customer refunds only if >24h

      // Fire cancellation emails to both parties
      sendBookingCancelledEmails(
        bookingId,
        cancelledBy,
        cancellationReason || undefined
      ).catch((err) => {
        console.error("Cancellation email error:", err);
      });

      // In-app notification for the other party
      if (cancelledBy === "customer") {
        // Notify business owner
        createNotification({
          userId: booking.business.ownerId,
          type: "BOOKING_CANCELLED",
          title: "Booking Cancelled",
          message: `A customer cancelled their ${booking.service.name} appointment.`,
          link: `/dashboard/bookings`,
        }).catch((err) => console.error("Notification error:", err));
      } else {
        // Business cancelled — notify customer
        createNotification({
          userId: booking.customerId,
          type: "BOOKING_CANCELLED",
          title: "Your Booking Was Cancelled",
          message: `${booking.business.name} cancelled your ${booking.service.name} appointment.${cancellationReason ? ` Reason: ${cancellationReason}` : ""}`,
          link: `/bookings/${bookingId}`,
        }).catch((err) => console.error("Notification error:", err));
      }

      // Trigger refund if eligible
      if (isEligibleForRefund) {
        processRefund(bookingId).catch((err) => {
          console.error("Refund processing error:", err);
        });
      } else if (isPaid && cancelledBy === "customer" && !isFreeWindow) {
        // Within 24h cancellation — notify customer that no refund applies
        createNotification({
          userId: booking.customerId,
          type: "BOOKING_CANCELLED",
          title: "Booking Cancelled — No Refund",
          message: `Your ${booking.service.name} was cancelled within the 24-hour window. No refund will be issued.`,
          link: `/bookings/${bookingId}`,
        }).catch((err) => console.error("Notification error:", err));
      }
    }

    if (newStatus === "COMPLETED") {
      // Small delay to ensure DB write is committed before the review page loads
      setTimeout(() => {
        sendReviewRequestEmail(bookingId).catch((err) => {
          console.error("Review request email error:", err);
        });

        createNotification({
          userId: booking.customerId,
          type: "REVIEW_REQUEST",
          title: "How was your appointment?",
          message: `Share your experience at ${booking.business.name}. Your feedback helps others.`,
          link: `/bookings/${bookingId}/review`,
        }).catch((err) => console.error("Notification error:", err));
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
    console.error("Update booking status error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

// =============================================================================
// Reschedule Booking
// =============================================================================

/**
 * Reschedules a confirmed booking to a new date and time.
 *
 * Rules enforced:
 *   - Booking must be CONFIRMED (paid). PENDING bookings should be
 *     cancelled and rebooked — rescheduling an unpaid booking makes no sense.
 *   - Must be more than 24 hours before the current appointment start time.
 *   - Maximum 2 reschedules per booking (rescheduleCount tracks this).
 *   - New slot must not conflict with existing bookings for the same
 *     staff member (or business, for single-provider businesses).
 *   - cancellationDeadline is recalculated for the new appointment.
 *
 * Side effects:
 *   - In-app notifications sent to both customer and business owner
 *   - Rescheduled email sent to both parties (fire-and-forget)
 *
 * @param values - bookingId, new date, new startTime, new endTime
 * @returns Object with `success` or `error` message
 */
export async function rescheduleBooking(
  values: RescheduleBookingValues
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Please sign in." };
    }

    // Validate input shape
    const validatedFields = rescheduleBookingSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid reschedule data. Please check your input." };
    }

    const { bookingId, date, startTime, endTime } = validatedFields.data;

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        business: {
          select: { ownerId: true, name: true, slug: true },
        },
        service: {
          select: { name: true, duration: true },
        },
      },
    });

    if (!booking) {
      return { error: "Booking not found." };
    }

    // Only the customer who made the booking may reschedule
    if (booking.customerId !== user.id) {
      return {
        error: "You do not have permission to reschedule this booking.",
      };
    }

    // Only CONFIRMED (paid) bookings can be rescheduled
    if (booking.status !== "CONFIRMED") {
      return {
        error:
          "Only confirmed (paid) bookings can be rescheduled. To change an unpaid booking, please cancel it and create a new one.",
      };
    }

    // Must be more than 24 hours before the current appointment
    const isOutsideWindow = canCancelForFree(
      new Date(booking.date),
      booking.startTime
    );
    if (!isOutsideWindow) {
      return {
        error:
          "Bookings cannot be rescheduled within 24 hours of the appointment. Please contact the business directly.",
      };
    }

    // Maximum 2 reschedules per booking
    if (booking.rescheduleCount >= 2) {
      return {
        error:
          "This booking has already been rescheduled the maximum number of times (2). Please contact the business to make further changes.",
      };
    }

    const newBookingDate = new Date(date);
    const requestedStart = timeToMinutes(startTime);
    const requestedEnd = timeToMinutes(endTime);

    // -------------------------------------------------------------------------
    // Slot conflict detection
    // -------------------------------------------------------------------------
    if (booking.staffId) {
      // Staff-assigned booking: check only that staff member's schedule
      const staffBookings = await db.booking.findMany({
        where: {
          staffId: booking.staffId,
          date: newBookingDate,
          status: { in: ["PENDING", "CONFIRMED"] },
          id: { not: bookingId }, // Exclude the booking being rescheduled
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
            "Your assigned staff member is not available at the selected time. Please choose a different slot.",
        };
      }
    } else {
      // Single-provider business: check all business bookings
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

    // Capture old date/time for the notification and email
    const oldDate = new Date(booking.date);
    const oldStartTime = booking.startTime;

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
        rescheduleCount: { increment: 1 },
      },
    });

    revalidatePath("/bookings");
    revalidatePath(`/bookings/${bookingId}`);
    revalidatePath("/dashboard/bookings");

    // -------------------------------------------------------------------------
    // Fire-and-forget: notifications + emails for both parties
    // -------------------------------------------------------------------------
    const newRescheduleCount = booking.rescheduleCount + 1;

    Promise.all([
      // In-app: customer confirmation
      createNotification({
        userId: booking.customerId,
        type: "BOOKING_RESCHEDULED",
        title: "Booking Rescheduled",
        message: `Your ${booking.service.name} appointment has been moved to ${date}.`,
        link: `/bookings/${bookingId}`,
      }),
      // In-app: business owner alert
      createNotification({
        userId: booking.business.ownerId,
        type: "BOOKING_RESCHEDULED",
        title: "Booking Rescheduled by Customer",
        message: `A customer rescheduled their ${booking.service.name} appointment to ${date}.`,
        link: `/dashboard/bookings`,
      }),
      // Email: both parties
      sendBookingRescheduledEmail(
        bookingId,
        oldDate,
        oldStartTime,
        newRescheduleCount
      ),
    ]).catch((err) => {
      console.error("Reschedule notification error:", err);
    });

    return { success: "Booking rescheduled successfully!" };
  } catch (error) {
    console.error("Reschedule booking error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}
