/**
 * @file Booking Query Functions
 * @description Server-side data fetching for booking-related pages
 *
 * Provides functions for:
 *   - Fetching available time slots for a date/service combination
 *   - Fetching a customer booking history
 *   - Fetching business owner incoming bookings'
 */

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import {
  generateAvailableSlots,
  getDayOfWeek,
  type TimeSlot,
} from "@/lib/booking-utils";

/**
 * Generates available time slots for a specific business, service, date.
 *
 * This function:
 *   1. Look up business hours for the day of the week
 *   2. Fetches all existing bookings for that date
 *   3. Runs the slot generation algorithm
 *   4. Returns available time slots
 *
 * @param businessId - The business to check availability for
 * @param serviceId - The service being booked (for duration)
 * @param dateStr - The date in ISO string format
 * @returns Array of available time slots, or empty array if closed
 */
export async function getAvailableSlots(
  businessId: string,
  serviceId: string,
  dateStr: string
): Promise<TimeSlot[]> {
  // Parse the date
  const date = new Date(dateStr);
  const dayOfWeek = getDayOfWeek(date);

  // Fetch business hours for this day of the week
  const hours = await db.businessHours.findUnique({
    where: {
      businessId_dayOfWeek: {
        businessId,
        dayOfWeek,
      },
    },
  });

  // If no hours set or business is closed, no slots available
  if (!hours || hours.isClosed) {
    return [];
  }

  // Fetch the service duration
  const service = await db.service.findUnique({
    where: { id: serviceId },
    select: { duration: true },
  });

  if (!service) return [];

  // Fetch existing bookings for this date (only active ones)
  const existingBookings = await db.booking.findMany({
    where: {
      businessId,
      date,
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    select: {
      startTime: true,
      endTime: true,
    },
  });

  // Check if the selected date is today
  const today = new Date();
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  // Generate available slots
  return generateAvailableSlots({
    openTime: hours.openTime,
    closeTime: hours.closeTime,
    serviceDuration: service.duration,
    existingBookings,
    isToday,
  });
}

/**
 * Fetches all the bookings for the current customer.
 * Includes related business and service information.
 *
 * @param status - Optional status filter
 * @returns Array of booking records with related data
 */
export async function getCustomerBookings(status?: string) {
  const user = await getCurrentUser();
  if (!user) return [];

  const where: Record<string, unknown> = {
    customerId: user.id,
  };

  if (status && status !== "ALL") {
    where.status = status;
  }

  return db.booking.findMany({
    where,
    include: {
      business: {
        select: {
          name: true,
          slug: true,
          image: true,
        },
      },
      service: {
        select: {
          name: true,
          duration: true,
        },
      },
      review: {
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Fetches all bookings for the current business owner's business.
 * Includes customer and service information.
 *
 * @param status - Optional status filter
 * @returns Array of booking records with related data
 */
export async function getBusinessBookings(status?: string) {
  const user = await getCurrentUser();
  if (!user) return [];

  const business = await db.business.findUnique({
    where: { ownerId: user.id },
    select: { id: true },
  });

  if (!business) return [];

  const where: Record<string, unknown> = {
    businessId: business.id,
  };

  if (status && status !== "ALL") {
    where.status = status;
  }

  return db.booking.findMany({
    where,
    include: {
      customer: {
        select: {
          name: true,
          email: true,
          phone: true,
          image: true,
        },
      },
      service: {
        select: {
          name: true,
          duration: true,
          price: true,
        },
      },
    },
    orderBy: { date: "desc" },
  });
}
