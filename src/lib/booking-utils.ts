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
 * Multi-staff scheduling:
 *   - IF business has NO staff → original single-provider algorithm (unchanged)
 *   - IF business HAS staff:
 *       - "Any Available" → slot is open if AT LEAST ONE staff member is free
 *       - Specific staff → generate slots for that staff member only
 *   - Round-robin assignment selects the staff with fewest bookings today
 *
 * All times are strings in "HH:mm" format, interpreted in the
 * business's local timezone. No timezone conversion is performed.
 *
 * @example
 * ```ts
 * const slots = generateAvailableSlots({
 *   openTime: "09:00",
 *   closeTime: "17:00",
 *   serviceDuration: 30,
 *   existingBookings: [{ startTime: "10:00", endTime: "10:30" }],
 *   isToday: false
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

/**
 * Extends TimeSlot with staff availability data for multi-provider scheduling.
 * Used internally by the staff-aware slot generation algorithm.
 */
export interface StaffAwareTimeSlot extends TimeSlot {
  /**
   * IDs of staff members who are free during this slot.
   * Empty array means no staff available (slot is unavailable).
   * Used for round-robin assignment at booking creation time.
   */
  availableStaffIds: string[];
}

/** An existing booking that occupies a time range. */
export interface ExistingBooking {
  startTime: string;
  endTime: string;
}

/** Parameters for the single-provider slot generation function. */
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
 * A single staff member's availability data for slot generation.
 * Used as input to the staff-aware algorithm.
 */
export interface StaffAvailabilityInput {
  /** Staff member's database ID */
  id: string;
  /** Staff member's display name */
  name: string;
  /** Staff member's hours for this specific day of the week */
  hours: {
    /** Opening time in "HH:mm" format */
    openTime: string;
    /** Closing time in "HH:mm" format */
    closeTime: string;
    /** Whether the staff member is off this day */
    isClosed: boolean;
  } | null; // null = no hours configured for this day
  /** Existing bookings assigned to this staff member for the date */
  existingBookings: ExistingBooking[];
}

/** Parameters for the staff-aware slot generation function. */
export interface StaffAwareSlotParams {
  /** Business opening time in "HH:mm" format (outer boundary) */
  businessOpenTime: string;
  /** Business closing time in "HH:mm" format (outer boundary) */
  businessCloseTime: string;
  /** Duration of the service in minutes */
  serviceDuration: number;
  /**
   * All active staff members who can perform this service,
   * with their hours and existing bookings for this date.
   */
  staffMembers: StaffAvailabilityInput[];
  /** Whether the selected date is today (filters out past slots) */
  isToday: boolean;
  /**
   * If set, generate slots only for this specific staff member.
   * If null/undefined, use "any available" mode (union of all staff).
   */
  selectedStaffId?: string | null;
}

// =============================================================================
// Core Time Utilities
// =============================================================================

/**
 * Converts "HH:mm" time string to total minutes since midnight.
 * Used for arithmetic comparisons between time values.
 *
 * @param time - Time in "HH:mm" format
 * @returns Total minutes since midnight (0-1439)
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
 * @param totalMinutes - Minutes since midnight (0-1439)
 * @returns Time in "HH:mm" format
 *
 * @example
 * ```ts
 * minutesToTime(540) // → "09:00"
 * minutesToTime(870) // → "14:30"
 * minutesToTime(0)   // → "00:00"
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
 * Two ranges [A_start, A_end) and [B_start, B_end) overlap if and only if
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

// =============================================================================
// Single-Provider Slot Generation (Original — Unchanged)
// =============================================================================

/**
 * Generates all available time slots for a given date and service.
 * This is the original single-provider algorithm. Unchanged for full
 * backwards compatibility with businesses that have no staff configured.
 *
 * Algorithm:
 *   1. Convert open/close time to minutes for arithmetic
 *   2. Generate candidate slots at 30-minute intervals from open to close
 *      (each slot spans the service's duration)
 *   3. Filter out slots that overlap with any existing booking
 *   4. If the date is today, filter out slots that have already passed
 *   5. Return the remaining slots with display labels
 *
 * @param params - Slot generation parameters
 * @returns Array of available TimeSlot objects
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

    // Step 3: If booking for today, skip slots that have already passed.
    // A 30-minute buffer — don't allow booking less than 30 min from now.
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

// =============================================================================
// Multi-Provider Slot Generation
// =============================================================================

/**
 * Checks whether a specific staff member is free during a candidate slot.
 *
 * A staff member is free if:
 *   1. They have hours configured for this day
 *   2. They are not marked as closed/off for this day
 *   3. The slot falls within their working hours
 *   4. The slot does not overlap with any of their existing bookings
 *
 * @param staff - Staff member's availability data
 * @param slotStart - Slot start in minutes since midnight
 * @param slotEnd - Slot end in minutes since midnight
 * @returns true if the staff member is available for this slot
 */
function isStaffFreeForSlot(
  staff: StaffAvailabilityInput,
  slotStart: number,
  slotEnd: number
): boolean {
  // No hours configured — treat as unavailable
  if (!staff.hours) return false;

  // Staff is off this day
  if (staff.hours.isClosed) return false;

  const staffOpen = timeToMinutes(staff.hours.openTime);
  const staffClose = timeToMinutes(staff.hours.closeTime);

  // Slot must be fully within staff's working hours
  if (slotStart < staffOpen || slotEnd > staffClose) return false;

  // Check against staff member's existing bookings
  const hasBookingConflict = staff.existingBookings.some((booking) => {
    const bookedStart = timeToMinutes(booking.startTime);
    const bookedEnd = timeToMinutes(booking.endTime);
    return rangesOverlap(slotStart, slotEnd, bookedStart, bookedEnd);
  });

  return !hasBookingConflict;
}

/**
 * Generates available time slots for a multi-provider (staff-based) business.
 *
 * Two modes:
 *
 * "Any Available" mode (selectedStaffId is null/undefined):
 *   - For each candidate slot within business hours, checks ALL staff members
 *   - Slot is available if AT LEAST ONE staff member is free
 *   - Each returned slot carries the IDs of all staff who are available
 *   - At booking time, round-robin selects the best staff member
 *
 * "Specific Staff" mode (selectedStaffId is set):
 *   - Generates slots based solely on that staff member's hours and bookings
 *   - Ignores all other staff members entirely
 *   - Each returned slot carries only that staff member's ID
 *
 * Business hours act as the outer boundary in both modes — no slot is
 * generated outside business operating hours.
 *
 * @param params - Staff-aware slot generation parameters
 * @returns Array of StaffAwareTimeSlot objects with available staff IDs
 */
export function generateStaffAwareSlots(
  params: StaffAwareSlotParams
): StaffAwareTimeSlot[] {
  const {
    businessOpenTime,
    businessCloseTime,
    serviceDuration,
    staffMembers,
    isToday,
    selectedStaffId,
  } = params;

  const businessOpen = timeToMinutes(businessOpenTime);
  const businessClose = timeToMinutes(businessCloseTime);

  // Calculate current time for today's filtering
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const slots: StaffAwareTimeSlot[] = [];
  const slotInterval = 30; // Slots start every 30 minutes

  // If a specific staff is selected, filter the array to just that member
  const relevantStaff = selectedStaffId
    ? staffMembers.filter((s) => s.id === selectedStaffId)
    : staffMembers;

  // If no relevant staff found at all, return no slots
  if (relevantStaff.length === 0) return [];

  for (
    let slotStart = businessOpen;
    slotStart + serviceDuration <= businessClose;
    slotStart += slotInterval
  ) {
    const slotEnd = slotStart + serviceDuration;

    // Filter past slots when booking for today (30-minute buffer)
    if (isToday && slotStart <= currentMinutes + 30) continue;

    // Find all staff members who are free for this slot
    const availableStaffIds = relevantStaff
      .filter((staff) => isStaffFreeForSlot(staff, slotStart, slotEnd))
      .map((staff) => staff.id);

    // Slot is only available if at least one staff member is free
    if (availableStaffIds.length === 0) continue;

    const startTimeStr = minutesToTime(slotStart);
    const endTimeStr = minutesToTime(slotEnd);

    slots.push({
      startTime: startTimeStr,
      endTime: endTimeStr,
      label: formatTo12Hour(startTimeStr),
      availableStaffIds,
    });
  }

  return slots;
}

// =============================================================================
// Round-Robin Staff Assignment
// =============================================================================

/**
 * Selects the best staff member for a booking using round-robin logic.
 *
 * From the list of available staff IDs, selects the one with the fewest
 * bookings on the booking date. This distributes workload evenly across
 * the team. In case of a tie, the first staff member in the list is selected.
 *
 * This function is called at booking creation time (in the createBooking
 * server action) when the customer chose "Any Available".
 *
 * @param availableStaffIds - IDs of staff members who are free for the slot
 * @param bookingDate - The date of the booking (for counting daily bookings)
 * @param db - Prisma client instance (passed in to avoid circular imports)
 * @returns The selected staff member's ID, or null if the list is empty
 */
export async function selectStaffRoundRobin(
  availableStaffIds: string[],
  bookingDate: Date,
  db: {
    booking: {
      count: (args: {
        where: {
          staffId: string;
          date: Date;
          status: { in: string[] };
        };
      }) => Promise<number>;
    };
  }
): Promise<string | null> {
  if (availableStaffIds.length === 0) return null;

  // If only one staff is available, no need to query
  if (availableStaffIds.length === 1) return availableStaffIds[0];

  // Count bookings for each available staff member on this date
  const bookingCounts = await Promise.all(
    availableStaffIds.map(async (staffId) => {
      const count = await db.booking.count({
        where: {
          staffId,
          date: bookingDate,
          status: { in: ["PENDING", "CONFIRMED"] },
        },
      });
      return { staffId, count };
    })
  );

  // Sort by count ascending (fewest bookings first), then by original order for ties
  bookingCounts.sort((a, b) => a.count - b.count);

  return bookingCounts[0].staffId;
}

// =============================================================================
// Date / Day Utilities
// =============================================================================

/**
 * Gets the DayOfWeek enum value for a given date.
 *
 * JavaScript's getDay() returns 0=Sunday through 6=Saturday.
 * Our Prisma DayOfWeek enum uses MONDAY through SUNDAY.
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
  return new Date(appointmentDateTime.getTime() - 24 * 60 * 60 * 1000);
}
