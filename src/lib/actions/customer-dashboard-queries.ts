/**
 * @file Customer Dashboard Query Helpers
 * @description Server-side data fetching for the customer dashboard.
 *
 * Provides:
 *   - Upcoming appointments (next 3)
 *   - Recent businesses visited
 *   - Booking statistics summary
 *   - Last completed booking (for quick rebook)
 */

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

/**
 * Fetches upcoming appointments for the current customer.
 * Limited to the next 3 confirmed or pending appointments.
 *
 * @returns Array of upcoming bookings with related data
 */
export async function getUpcomingAppointments() {
  const user = await getCurrentUser();
  if (!user || user.role !== "CUSTOMER") return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return db.booking.findMany({
    where: {
      customerId: user.id,
      status: { in: ["PENDING", "CONFIRMED"] },
      date: { gte: today },
    },
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
    },
    orderBy: { date: "asc" },
    take: 3,
  });
}

/**
 * Fetches recently visited businesses (based on completed bookings).
 * Returns unique businesses, limited to the 6 most recent.
 *
 * @returns Array of business records
 */
export async function getRecentBusinesses() {
  const user = await getCurrentUser();
  if (!user || user.role !== "CUSTOMER") return [];

  // Get completed bookings with business info
  const completedBookings = await db.booking.findMany({
    where: {
      customerId: user.id,
      status: "COMPLETED",
    },
    include: {
      business: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          category: true,
          image: true,
          city: true,
          state: true,
        },
      },
    },
    orderBy: { date: "desc" },
    take: 20, // Fetch more than needed to ensure 6 unique
  });

  // Extract unique businesses (most recent visit wins)
  const uniqueBusinesses = new Map();
  for (const booking of completedBookings) {
    if (!uniqueBusinesses.has(booking.business.id)) {
      uniqueBusinesses.set(booking.business.id, booking.business);
    }
  }

  return Array.from(uniqueBusinesses.values()).slice(0, 6);
}

/**
 * Fetches booking statistics for the current customer.
 *
 * @returns Object with total bookings count and status breakdown
 */
export async function getBookingStats() {
  const user = await getCurrentUser();
  if (!user || user.role !== "CUSTOMER") {
    return {
      total: 0,
      completed: 0,
      upcoming: 0,
      cancelled: 0,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [total, completed, upcoming, cancelled] = await Promise.all([
    db.booking.count({
      where: { customerId: user.id },
    }),
    db.booking.count({
      where: { customerId: user.id, status: "COMPLETED" },
    }),
    db.booking.count({
      where: {
        customerId: user.id,
        status: { in: ["PENDING", "CONFIRMED"] },
        date: { gte: today },
      },
    }),
    db.booking.count({
      where: { customerId: user.id, status: "CANCELLED" },
    }),
  ]);

  return { total, completed, upcoming, cancelled };
}

/**
 * Fetches the last completed booking for quick re-booking.
 *
 * @returns The most recent completed booking, or null
 */
export async function getLastCompletedBooking() {
  const user = await getCurrentUser();
  if (!user || user.role !== "CUSTOMER") return null;

  return db.booking.findFirst({
    where: {
      customerId: user.id,
      status: "COMPLETED",
    },
    include: {
      business: {
        select: {
          name: true,
          slug: true,
        },
      },
      service: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { date: "desc" },
  });
}
