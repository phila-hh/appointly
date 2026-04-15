/**
 * @file Slot Fetching Server Actions
 * @description Server action wrapper for fetching available time slots.
 *
 * Client components cannot call plain async functions from server modules
 * directly — they need either a server action ("use server") or an API route.
 * This file provides a server action wrapper around getAvailableSlots.
 *
 * Supports both single-provider and staff-aware slot generation.
 * The staffId parameter enables staff-specific availability queries.
 */

"use server";

import { getAvailableSlots } from "@/lib/actions/booking-queries";
import type { TimeSlot } from "@/lib/booking-utils";

/**
 * Fetches available time slots for a given business, service, date,
 * and optionally a specific staff member.
 *
 * Callable from client components (React form, etc.).
 *
 * @param businessId - The business ID
 * @param serviceId - The service ID (determines duration and eligible staff)
 * @param dateStr - The date in ISO string format (e.g., "2025-06-15")
 * @param staffId - Optional staff member ID. Null/"" = "Any Available" mode
 * @returns Array of available time slots
 */
export async function fetchAvailableSlots(
  businessId: string,
  serviceId: string,
  dateStr: string,
  staffId?: string | null
): Promise<TimeSlot[]> {
  return getAvailableSlots(businessId, serviceId, dateStr, staffId || null);
}
