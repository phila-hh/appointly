/**
 * @file Booking Detail Query Helpers
 * @description Server-side data fetching for individual booking detail pages.
 *
 * Provides comprehensive booking data including:
 *   - Full booking information with reschedule count and cancellation deadline
 *   - Business details with contact info
 *   - Service details
 *   - Assigned staff member (if applicable)
 *   - Payment information including refund status
 *   - Customer information (for business owners)
 *   - Review status with business reply
 */

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// =============================================================================
// Types
// =============================================================================

interface BookingTimelineData {
  createdAt: Date;
  updatedAt: Date;
  status: string;
  rescheduleCount: number;
  payment?: {
    status: string;
    createdAt: Date;
    updatedAt: Date;
    refundStatus: string | null;
    refundedAt: Date | null;
  } | null;
  review?: {
    createdAt: Date;
  } | null;
}

// =============================================================================
// Queries
// =============================================================================

/**
 * Fetches complete booking details for display on the booking detail page.
 *
 * Authorization:
 *   - Customer can view their own bookings
 *   - Business owners can view bookings for their business
 *
 * Includes all fields needed by the detail page:
 *   - rescheduleCount and cancellationDeadline for action button logic
 *   - staff for appointment info display
 *   - payment.refundStatus for refund status display
 *   - review.businessReply for displaying owner reply below review
 *
 * @param bookingId - The ID of the booking to fetch
 * @returns The full booking record with all related data, or null if not
 *          found or the current user is not authorized to view it
 */
export async function getBookingDetail(bookingId: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      business: {
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
          phone: true,
          email: true,
          address: true,
          city: true,
          state: true,
          zipCode: true,
          ownerId: true,
        },
      },
      service: {
        select: {
          name: true,
          description: true,
          duration: true,
          price: true,
        },
      },
      // Staff member assigned to this booking (may be null for
      // single-provider businesses or older bookings)
      staff: {
        select: {
          name: true,
          title: true,
        },
      },
      customer: {
        select: {
          name: true,
          email: true,
          phone: true,
          image: true,
        },
      },
      payment: {
        select: {
          id: true,
          amount: true,
          status: true,
          chapaTransactionRef: true,
          refundStatus: true,
          refundedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      review: {
        select: {
          id: true,
          rating: true,
          comment: true,
          businessReply: true,
          businessReplyAt: true,
          createdAt: true,
        },
      },
    },
  });

  if (!booking) return null;

  // Authorization: must be the customer or the business owner
  const isCustomer = booking.customerId === user.id;
  const isOwner = booking.business.ownerId === user.id;

  if (!isCustomer && !isOwner) return null;

  return booking;
}

// =============================================================================
// Timeline
// =============================================================================

/**
 * Generates a chronological timeline of events for a booking.
 *
 * Shows the progression of the booking lifecycle:
 *   Created → Paid → Confirmed → [Rescheduled] → Completed / Cancelled / No-Show
 *   → [Review Submitted] → [Refunded]
 *
 * All events are marked "complete" because this is a historical log —
 * we show what happened, not what is pending.
 *
 * @param booking - The booking record with payment and review data
 * @returns Array of timeline events ordered chronologically
 */
export function generateBookingTimeline(booking: BookingTimelineData) {
  const timeline: Array<{
    label: string;
    timestamp: Date;
    status: "complete" | "current" | "upcoming";
  }> = [];

  // Booking created
  timeline.push({
    label: "Booking Created",
    timestamp: booking.createdAt,
    status: "complete",
  });

  // Payment events
  if (booking.payment) {
    if (booking.payment.status === "SUCCEEDED") {
      timeline.push({
        label: "Payment Completed",
        timestamp: booking.payment.updatedAt,
        status: "complete",
      });
    } else if (booking.payment.status === "FAILED") {
      timeline.push({
        label: "Payment Failed",
        timestamp: booking.payment.updatedAt,
        status: "complete",
      });
    }
  }

  // Booking confirmed (follows successful payment)
  if (booking.status === "CONFIRMED" || booking.status === "COMPLETED") {
    timeline.push({
      label: "Booking Confirmed",
      timestamp: booking.payment?.updatedAt ?? booking.updatedAt,
      status: "complete",
    });
  }

  // Rescheduled — show if the booking was moved at least once
  if (booking.rescheduleCount > 0) {
    timeline.push({
      label: `Rescheduled (${booking.rescheduleCount} of 2 times)`,
      timestamp: booking.updatedAt,
      status: "complete",
    });
  }

  // Booking completed
  if (booking.status === "COMPLETED") {
    timeline.push({
      label: "Service Completed",
      timestamp: booking.updatedAt,
      status: "complete",
    });

    if (booking.review) {
      timeline.push({
        label: "Review Submitted",
        timestamp: booking.review.createdAt,
        status: "complete",
      });
    }
  }

  // Cancelled
  if (booking.status === "CANCELLED") {
    timeline.push({
      label: "Booking Cancelled",
      timestamp: booking.updatedAt,
      status: "complete",
    });
  }

  // No-show
  if (booking.status === "NO_SHOW") {
    timeline.push({
      label: "Marked as No-Show",
      timestamp: booking.updatedAt,
      status: "complete",
    });
  }

  // Refund events — shown after cancellation
  if (
    booking.payment?.refundStatus === "REFUNDED" &&
    booking.payment.refundedAt
  ) {
    timeline.push({
      label: "Refund Processed",
      timestamp: booking.payment.refundedAt,
      status: "complete",
    });
  } else if (booking.payment?.refundStatus === "PENDING_REFUND") {
    timeline.push({
      label: "Refund Pending",
      timestamp: booking.payment.updatedAt,
      status: "current",
    });
  }

  return timeline;
}
