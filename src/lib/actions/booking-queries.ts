/**
 * @file Booking Query Functions
 * @description Server-side data fetching for booking-related pages.
 *
 * Provides functions for:
 *   - Fetching available time slots (single-provider and staff-aware)
 *   - Fetching a customer's booking history
 *   - Fetching business owner incoming bookings with returning customer flag
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
 * @param serviceId  - The service being booked (determines duration + staff)
 * @param dateStr    - The date in ISO string format (e.g., "2025-06-15")
 * @param staffId    - Optional: specific staff member ID, or null for "any"
 * @returns Array of available TimeSlot objects
 */
export async function getAvailableSlots(
  businessId: string,
  serviceId: string,
  dateStr: string,
  staffId?: string | null
): Promise<TimeSlot[]> {
  const date = new Date(dateStr);
  const dayOfWeek = getDayOfWeek(date);

  const businessHours = await db.businessHours.findUnique({
    where: {
      businessId_dayOfWeek: { businessId, dayOfWeek },
    },
  });

  if (!businessHours || businessHours.isClosed) {
    return [];
  }

  const service = await db.service.findUnique({
    where: { id: serviceId },
    select: { duration: true },
  });

  if (!service) return [];

  const staffForService = await db.staff.findMany({
    where: {
      businessId,
      isActive: true,
      services: { some: { serviceId } },
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
  const relevantStaffIds = staffId
    ? [staffId]
    : staffForService.map((s) => s.id);

  const staffAvailability = await Promise.all(
    relevantStaffIds.map(async (sid) => {
      const hours = await db.staffHours.findUnique({
        where: { staffId_dayOfWeek: { staffId: sid, dayOfWeek } },
        select: { openTime: true, closeTime: true, isClosed: true },
      });

      const existingBookings = await db.booking.findMany({
        where: {
          staffId: sid,
          date,
          status: { in: ["PENDING", "CONFIRMED"] },
        },
        select: { startTime: true, endTime: true },
      });

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

  const staffAwareSlots = generateStaffAwareSlots({
    businessOpenTime: businessHours.openTime,
    businessCloseTime: businessHours.closeTime,
    serviceDuration: service.duration,
    staffMembers: staffAvailability,
    isToday,
    selectedStaffId: staffId,
  });

  return staffAwareSlots;
}

/**
 * Fetches all bookings for the current customer.
 *
 * Includes businessId and serviceId explicitly so they can be passed to
 * the RescheduleDialog for slot fetching. Also includes rescheduleCount
 * and cancellationDeadline for action button logic.
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
          id: true, // ← needed for RescheduleDialog slot fetching
          name: true,
          slug: true,
          image: true,
        },
      },
      service: {
        select: {
          id: true, // ← needed for RescheduleDialog slot fetching
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
 *
 * Includes a returning customer flag: isReturningCustomer is true when
 * the customer has 3 or more completed/confirmed bookings at this business.
 * This is computed in application code to avoid a complex subquery.
 *
 * @param status  - Optional status filter
 * @param staffId - Optional staff member filter
 * @returns Array of booking records with related data and returning flag
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

  if (staffId && staffId !== "ALL") {
    where.staffId = staffId;
  }

  const bookings = await db.booking.findMany({
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

  if (bookings.length === 0)
    return bookings.map((b) => ({ ...b, isReturningCustomer: false }));

  // -------------------------------------------------------------------------
  // Returning customer detection
  // Count completed/confirmed bookings per unique customer at this business.
  // A customer with 3+ bookings is flagged as a returning customer.
  // We do one aggregate query per unique customer ID to avoid N+1.
  // -------------------------------------------------------------------------
  const uniqueCustomerIds = [...new Set(bookings.map((b) => b.customerId))];

  const bookingCounts = await db.booking.groupBy({
    by: ["customerId"],
    where: {
      businessId: business.id,
      customerId: { in: uniqueCustomerIds },
      status: { in: ["CONFIRMED", "COMPLETED"] },
    },
    _count: { id: true },
  });

  const countMap = new Map(
    bookingCounts.map((bc) => [bc.customerId, bc._count.id])
  );

  return bookings.map((booking) => ({
    ...booking,
    /** True when the customer has 3+ confirmed/completed bookings here. */
    isReturningCustomer: (countMap.get(booking.customerId) ?? 0) >= 3,
  }));
}
