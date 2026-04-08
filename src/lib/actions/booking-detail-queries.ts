/**
 * @file Booking Detail Query Helpers
 * @description Server-side data fetching for individual booking detail pages.
 *
 * Provides comprehensive booking data including:
 *   - Full booking information
 *   - Business details with contact info
 *   - Service details
 *   - Payment information
 *   - Customer information (for business owners)
 *   - Review status
 */

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

interface BookingTimelineData {
  createdAt: Date;
  updatedAt: Date;
  status: string;
  payment?: {
    status: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  review?: {
    createdAt: Date;
  } | null;
}

/**
 * Fetches complete booking details for display in the booking detail page.
 *
 * Authorization:
 *   - Customer can view their own bookings
 *   - Business owners can view bookings for their business
 *
 * @param bookingId - The ID of the booking to fetch
 * @returns The full booking record with all related data, or null if not found/unauthorized
 */
export async function getBookingDetail(bookingId: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  // Fetch the booking with all related data
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
          createdAt: true,
          updatedAt: true,
        },
      },
      review: {
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
        },
      },
    },
  });

  if (!booking) return null;

  // Authorization check: must be the customer or business owner
  const isCustomer = booking.customerId === user.id;
  const isOwner = booking.business.ownerId === user.id;

  if (!isCustomer && !isOwner) {
    return null;
  }

  return booking;
}

/**
 * Generate a timeline of event for booking.
 *
 * Shows the progression: Created → Paid → Confirmed → Completed
 * or any variation (Cancelled, Failed payment, etc.)
 *
 * @param booking - The booking record with payment data
 * @returns Array of timeline events with timestamp and descriptions
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

  // Payment status
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

  // Booking confirmed
  if (booking.status === "CONFIRMED" || booking.status === "COMPLETED") {
    timeline.push({
      label: "Booking Confirmed",
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

    // Review left
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

  return timeline;
}
