/**
 * @file Booking Query Functions
 * @description Server-side data fetching for booking-related pages.
 *
 * Provides functions for:
 *   - Fetching available time slots (single-provider and staff-aware)
 *   - Fetching a customer's booking history
 *   - Fetching business owner incoming bookings
 *
 * Backwards compatibility guarantee:
 *   getAvailableSlots() checks whether the business has active staff.
 *   If not, it falls through to the original single-provider algorithm.
 *   Businesses without staff are completely unaffected by the new updates.
 */

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import {
  generateAvailableSlots,
  generateStaffAwareSlots,
  getDayOfWeek,
  type TimeSlot,
} from "@/lib/booking-utils";

/**
 * Generates available time slots for a specific business, service, and date.
 *
 * Routing logic:
 *   1. Fetch business hours for the day of week
 *   2. Check whether the business has active staff for this service
 *   3a. NO staff → original single-provider algorithm (unchanged)
 *   3b. HAS staff → staff-aware algorithm with per-member availability
 *
 * @param businessId - The business to check availability for
 * @param serviceId - The service being booked (determines duration + staff)
 * @param dateStr - The date in ISO string format (e.g., "2025-06-15")
 * @param staffId - Optional: specific staff member ID, or null for "any"
 * @returns Array of available TimeSlot objects (with availableStaffIds if staff-aware)
 */
export async function getAvailableSlots(
  businessId: string,
  serviceId: string,
  dateStr: string,
  staffId?: string | null
): Promise<TimeSlot[]> {
  // Parse the date
  const date = new Date(dateStr);
  const dayOfWeek = getDayOfWeek(date);

  // Fetch business hours for this day of the week
  const businessHours = await db.businessHours.findUnique({
    where: {
      businessId_dayOfWeek: {
        businessId,
        dayOfWeek,
      },
    },
  });

  // If no hours set or business is closed, no slots available
  if (!businessHours || businessHours.isClosed) {
    return [];
  }

  // Fetch the service duration
  const service = await db.service.findUnique({
    where: { id: serviceId },
    select: { duration: true },
  });

  if (!service) return [];

  // Check whether the business has active staff who can perform this service
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

  const hasStaff = staffForService.length > 0;

  // -------------------------------------------------------------------------
  // Branch A: No staff configured → single-provider algorithm
  // -------------------------------------------------------------------------
  if (!hasStaff) {
    const existingBookings = await db.booking.findMany({
      where: {
        businessId,
        date,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      select: { startTime: true, endTime: true },
    });

    const today = new Date();
    const isToday =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();

    return generateAvailableSlots({
      openTime: businessHours.openTime,
      closeTime: businessHours.closeTime,
      serviceDuration: service.duration,
      existingBookings,
      isToday,
    });
  }

  // -------------------------------------------------------------------------
  // Branch B: Staff configured → staff-aware algorithm
  // -------------------------------------------------------------------------

  // Determine which staff members to fetch data for
  const relevantStaffIds = staffId
    ? [staffId] // Specific staff selected — only fetch their data
    : staffForService.map((s) => s.id); // Any available — fetch all

  // Fetch hours and existing bookings for each relevant staff member
  const staffAvailability = await Promise.all(
    relevantStaffIds.map(async (sid) => {
      // Fetch this staff member's hours for this day
      const hours = await db.staffHours.findUnique({
        where: {
          staffId_dayOfWeek: {
            staffId: sid,
            dayOfWeek,
          },
        },
        select: { openTime: true, closeTime: true, isClosed: true },
      });

      // Fetch this staff member's existing bookings for this date
      const existingBookings = await db.booking.findMany({
        where: {
          staffId: sid,
          date,
          status: { in: ["PENDING", "CONFIRMED"] },
        },
        select: { startTime: true, endTime: true },
      });

      // Fetch staff name for the input shape
      const staffMember = await db.staff.findUnique({
        where: { id: sid },
        select: { name: true },
      });

      return {
        id: sid,
        name: staffMember?.name ?? "Unknown",
        hours: hours
          ? {
              openTime: hours.openTime,
              closeTime: hours.closeTime,
              isClosed: hours.isClosed,
            }
          : null,
        existingBookings,
      };
    })
  );

  const today = new Date();
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  // Generate staff-aware slots
  const staffAwareSlots = generateStaffAwareSlots({
    businessOpenTime: businessHours.openTime,
    businessCloseTime: businessHours.closeTime,
    serviceDuration: service.duration,
    staffMembers: staffAvailability,
    isToday,
    selectedStaffId: staffId,
  });

  // Return as TimeSlot[] — availableStaffIds is preserved on each slot
  // but typed as TimeSlot for the public API surface (client components
  // only need startTime/endTime/label; booking creation reads availableStaffIds
  // from the slot-actions layer which preserves the full type)
  return staffAwareSlots;
}

/**
 * Fetches all the bookings for the current customer.
 * Includes related business, service, and staff information.
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
      staff: {
        select: {
          id: true,
          name: true,
          title: true,
        },
      },
      review: {
        select: { id: true },
      },
      payment: {
        select: { status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Fetches all bookings for the current business owner's business.
 * Includes customer, service, and assigned staff information.
 *
 * @param status - Optional status filter
 * @param staffId - Optional staff member filter
 * @returns Array of booking records with related data
 */
export async function getBusinessBookings(status?: string, staffId?: string) {
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

  // Filter by specific staff member if provided
  if (staffId && staffId !== "ALL") {
    where.staffId = staffId;
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
      staff: {
        select: {
          id: true,
          name: true,
          title: true,
        },
      },
    },
    orderBy: { date: "desc" },
  });
}
