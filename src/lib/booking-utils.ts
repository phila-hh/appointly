/**
 * @file Booking Utility Functions
 * @description Core scheduling logic for time slot generation.
 *
 * The time-slot generation algorithm:
 *   1. Determine day of week for the selected date
 *   2. Look up the business hours for that day
 *   3. Generate all possible slots based on service duration
 *   4. Remove slots that overlap with existing confirmed/pending bookings
 *   5. Remove slots in the past (if booking for today)
 *   6. Return the remaining available slots
 *
 * All times are strings in "HH:mm" format, interpreted in the
 * business's local. No timezone conversion is performed.
 *
 * @example
 * ```ts
 * const slots = generateAvailableSlots({
 * openTime: "09:00",
 * closeTime: "17:00",
 * serviceDuration: 30,
 * existingBookings: [{ startTime: "10:00", endTime: "10:30" }],
 * isToday: false
 * });
 * // → [{ startTime: "09:00", endTime: "09:30" },
 * //    { startTime: "09:30", endTime: "10:00" },
 * //    { startTime: "10:30", endTime: "11:00" }, ...]
 * //    (10:00-10:30 is excluded because it's already booked)
 * ```
 */

import { DayOfWeek } from "@/generated/prisma/client";

/** Represents a single bookable time slot. */
export interface TimeSlot {
  /** Start time in "HH:mm" format */
  startTime: string;
  /** End time in "HH:mm" format */
  endTime: string;
  /** Display label for the start time (e.g., "9:00 AM") */
  label: string;
}

/** An existing booking that occupies a time range. */
export interface ExistingBooking {
  startTime: string;
  endTime: string;
}

/** Parameters for the slot generation function. */
export interface slotGenerationParams {
  /** Business opening time in "HH:mm" format */
  openTime: string;
  /** Business closing time in "HH:mm" format */
  closeTime: string;
  /** Duration of the service in minutes */
  serviceDuration: number;
  /** Existing bookings that block time ranges */
  existingBookings: ExistingBooking[];
  /** Whether the selected date is today (filters out past slots) */
  isToday: boolean;
}

/**
 * Converts "HH:mm" time string to total minutes since midnight.
 * Used for arithmetic comparisons between time values.
 *
 * @param time - Time in "HH:mm" format
 * @returns Total minutes since midnight (0 -1439)
 *
 * @example
 * ```ts
 * timeToMinutes("09:00") // → 540
 * timeToMinutes("14:30") // → 870
 * timeToMinutes("00:00") // → 0
 * ```
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert total minutes from midnight back to "HH:mm" format.
 *
 * @params totalMinutes - Minutes since midnight (0-1439)
 * @returns Time in "HH:mm" format
 *
 * @example
 * ```ts
 * minutesToTime(540) // → "09:00"
 * minutesToTime(870) // → "14:30"
 * minutesToTime(0) // → "00:00"
 * ```
 */
export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

/**
 * Converts a 24-hour time string to 12-hour display format.
 *
 * @param time24 - Time in "HH:mm" format
 * @returns Time in "h:mm AM/PM" format
 */
function formatTo12Hour(time24: string): string {
  const [hoursStr, minutes] = time24.split(":");
  const hours = parseInt(hoursStr, 10);

  if (hours === 0) return `12:${minutes} AM`;
  if (hours === 12) return `12:${minutes} PM`;
  if (hours < 12) return `${hours}:${minutes} AM`;
  return `${hours - 12}:${minutes} PM`;
}

/**
 * Checks whether two time ranges overlap.
 *
 * Two ranges [A_start, A_end) and [B_start, b_end) overlap if and only if
 * A_start < B_end and B_start < A_end.
 *
 * Uses half-open intervals: the end time is exclusive. A booking from
 * 10:00-10:30 does NOT conflict with a slot starting at 10:30.
 *
 * @param startA - Start of range A in minutes
 * @param endA - End of range A in minutes
 * @param startB - Start of range B in minutes
 * @param endB - End of range B in minutes
 * @returns true if the ranges overlap
 */
export function rangesOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return startA < endB && startB < endA;
}

/**
 * Generates all available time slots for a given date and service.
 *
 * Algorithm:
 *   1. Convert open/close time to minutes for arithmetic
 *   2. Generate candidate slots at 30-minutes interval from open to close
 *      (each slot spans the service's duration)
 *   3. Filter out slots that overlap with any existing booking
 *   4. If the date is today, filter out slots that have already passed
 *   5. Return the remaining slots with display labels
 *
 * @param params - Slot generation parameters
 * @return Array of available TimeSlot objects
 */
export function generateAvailableSlots(
  params: slotGenerationParams
): TimeSlot[] {
  const { openTime, closeTime, serviceDuration, existingBookings, isToday } =
    params;

  const openMinutes = timeToMinutes(openTime);
  const closeMinutes = timeToMinutes(closeTime);

  // Convert existing bookings to minutes for comparison
  const bookedRanges = existingBookings.map((booking) => ({
    start: timeToMinutes(booking.startTime),
    end: timeToMinutes(booking.endTime),
  }));

  // Calculate current time in minutes (for filtering past slots on today)
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Step 1: Generate all candidate slots at 30-minute intervals
  const slots: TimeSlot[] = [];
  const slotInterval = 30; // Slots start every 30 minutes

  for (
    let slotStart = openMinutes;
    slotStart + serviceDuration <= closeMinutes;
    slotStart += slotInterval
  ) {
    const slotEnd = slotStart + serviceDuration;

    // Step 2: Check if this slot overlaps with any existing booking
    const hasConflict = bookedRanges.some((booked) =>
      rangesOverlap(slotStart, slotEnd, booked.start, booked.end)
    );

    if (hasConflict) continue;

    // Step 3: if booking for today, skip slots that have already passed
    // And a 30-minute buffer — don't allow booking less than 30 min from now
    if (isToday && slotStart <= currentMinutes + 30) continue;

    // Step 4: Add to available slots
    const startTimeStr = minutesToTime(slotStart);
    const endTimeStr = minutesToTime(slotEnd);

    slots.push({
      startTime: startTimeStr,
      endTime: endTimeStr,
      label: formatTo12Hour(startTimeStr),
    });
  }

  return slots;
}

/**
 * Gets the DayOfWeek enum value for a given date.
 *
 * JavaScript's getDay() returns 0=Sunday through 6=Saturday
 * Our Prisma DayOfWeek enum uses MONDAY through SUNDAY
 *
 * @param date - The date to check
 * @returns The DayOfWeek enum string
 */
export function getDayOfWeek(date: Date): DayOfWeek {
  const dayMap: Record<number, DayOfWeek> = {
    0: "SUNDAY",
    1: "MONDAY",
    2: "TUESDAY",
    3: "WEDNESDAY",
    4: "THURSDAY",
    5: "FRIDAY",
    6: "SATURDAY",
  };

  return dayMap[date.getDay()];
}

/**
 * Checks if a booking can be cancelled for free based on the cancellation deadline.
 *
 * @param bookingDate - The date of the booking
 * @param bookingStartTime - The start time in "HH:mm" format
 * @returns true if cancellation is free (>24h before appointment)
 */
export function canCancelForFree(
  bookingDate: Date,
  bookingStartTime: string
): boolean {
  const [hours, minutes] = bookingStartTime.split(":").map(Number);
  const appointmentDateTime = new Date(bookingDate);
  appointmentDateTime.setHours(hours, minutes, 0, 0);

  const now = new Date();
  const hoursUntilAppointment =
    (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  return hoursUntilAppointment > 24;
}

/**
 * Calculates the cancellation deadline for a booking.
 * Deadline is 24 hours before the appointment time.
 *
 * @param bookingDate - The date of the booking
 * @param bookingStartTime - The start time in "HH:mm" format
 * @returns The cancellation deadline as a Date
 */
export function getCancellationDeadline(
  bookingDate: Date,
  bookingStartTime: string
): Date {
  const [hours, minutes] = bookingStartTime.split(":").map(Number);
  const appointmentDateTime = new Date(bookingDate);
  appointmentDateTime.setHours(hours, minutes, 0, 0);

  // Subtract 24 hours
  const deadline = new Date(
    appointmentDateTime.getTime() - 24 * 60 * 60 * 1000
  );
  return deadline;
}
