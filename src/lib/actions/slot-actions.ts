/**
 * @file Slot Fetching Server Actions
 * @description Server action wrapper for fetching available time slots.
 *
 * Client components can not call plain async functions from server modules
 * directly — they need either a serer action ("use server") or an API route.
 * This file provides a server action wrapper around getAvailableSlots.
 */

"use server";

import { getAvailableSlots } from "@/lib/actions/booking-queries";
import type { TimeSlot } from "@/lib/booking-utils";

/**
 * Fetches available time slots for a given business, service, and date.
 * Callable from client components.
 *
 * @param businessId - the business ID
 * @param serviceId - The service ID (determines duration)
 * @param dateStr - The date in ISO string format
 * @returns Array of available time slots
 */
export async function fetchAvailableSlots(
  businessId: string,
  serviceId: string,
  dateStr: string
): Promise<TimeSlot[]> {
  return getAvailableSlots(businessId, serviceId, dateStr);
}
