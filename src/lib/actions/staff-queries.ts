/**
 * @file Staff Query Functions
 * @description Server-side data fetching for staff-related pages and components.
 *
 * These are NOT server actions (they don't mutate data).
 * They are plain async functions used by Server Components to fetch data.
 *
 * Provides functions for:
 *   - Fetching all staff for a business (dashboard management)
 *   - Fetching a single staff member with full details
 *   - Fetching staff who can perform a specific service (booking flow)
 *   - Fetching public-facing staff data (business detail page)
 */

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

/**
 * Retrieves all staff members for the current user's business.
 *
 * Includes service assignments and hours for the management dashboard.
 * Returns both active and inactive staff, ordered by creation date (newest first).
 *
 * @returns Array of staff records with services and hours, or empty array
 */
export async function getBusinessStaff() {
  const user = await getCurrentUser();
  if (!user) return [];

  const business = await db.business.findUnique({
    where: { ownerId: user.id },
    select: { id: true },
  });

  if (!business) return [];

  return db.staff.findMany({
    where: { businessId: business.id },
    include: {
      services: {
        include: {
          service: {
            select: {
              id: true,
              name: true,
              isActive: true,
            },
          },
        },
      },
      hours: {
        orderBy: { dayOfWeek: "asc" },
      },
      _count: {
        select: {
          bookings: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Retrieves a single staff member by ID with full details.
 *
 * Verifies that the staff member belongs to the current user's business.
 * Includes services, hours, and booking count.
 *
 * @param staffId - The staff member's ID
 * @returns The staff record with related data, or null if not found/unauthorized
 */
export async function getStaffById(staffId: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  const business = await db.business.findUnique({
    where: { ownerId: user.id },
    select: { id: true },
  });

  if (!business) return null;

  const staff = await db.staff.findUnique({
    where: { id: staffId },
    include: {
      services: {
        include: {
          service: {
            select: {
              id: true,
              name: true,
              isActive: true,
            },
          },
        },
      },
      hours: {
        orderBy: { dayOfWeek: "asc" },
      },
      _count: {
        select: {
          bookings: true,
        },
      },
    },
  });

  // Verify the staff member belongs to the user's business
  if (!staff || staff.businessId !== business.id) return null;

  return staff;
}

/**
 * Retrieves active staff members who can perform a specific service.
 *
 * Used by the booking flow to show the staff selector. Only returns
 * active staff with active service assignments.
 *
 * @param businessId - The business ID
 * @param serviceId - The service ID to filter by
 * @returns Array of staff who can perform the service
 */
export async function getStaffForService(
  businessId: string,
  serviceId: string
) {
  return db.staff.findMany({
    where: {
      businessId,
      isActive: true,
      services: {
        some: {
          serviceId,
          service: {
            isActive: true,
          },
        },
      },
    },
    select: {
      id: true,
      name: true,
      title: true,
      image: true,
    },
    orderBy: { name: "asc" },
  });
}

/**
 * Retrieves public-facing staff data for a business.
 *
 * Used on the business detail page to display the team section.
 * Only returns active staff with their service names and titles.
 * Hours are NOT exposed publicly (privacy).
 *
 * @param businessId - The business ID
 * @returns Array of active staff with their services
 */
export async function getBusinessStaffPublic(businessId: string) {
  return db.staff.findMany({
    where: {
      businessId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      title: true,
      image: true,
      services: {
        include: {
          service: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });
}
