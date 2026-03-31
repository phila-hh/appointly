/**
 * @file Time Constants
 * @description Time-related constants used for scheduling and availability.
 *
 * Provides a pre-generated list of slots in 30-minutes increments
 * covering a full 24-hour period. Used by:
 *   - Business hours time pickers (open/close time selection)
 *   - Booking time slot generation
 *
 * Times are stored and displayed in 24-hour "HH:mm" format to avoid
 * AM/PM ambiguity in the database, and converted to 12-hour format
 * for display in the UI.
 */

/** A single selectable time option dropdowns and pickers. */
export type TimeOption = {
  /** The time value stored in the database (e.g., "09:00", "14:30") */
  value: string;
  /** The human readable display label (e.g., "9:00 AM", "2:30 PM") */
  label: string;
};

/**
 * Converts a 24-hour time string to a 12-hour display format.
 *
 * @param time24 - Time in "HH:MM" format (e.g., "14:30")
 * @returns Time in 12-hour format (e.g., "2:30 PM")
 *
 * @example
 * ```ts
 * formatTime24to12("09:00") // → "09:00 AM"
 * formatTime24to12("14:30") // → "2:30 PM"
 * formatTime24to12("00:00") // → "12:00 AM"
 * formatTime24to12("12:00") // → "12:00 PM"
 * ```
 */
export function formatTime24to12(time24: string): string {
  const [hourStr, minutes] = time24.split(":");
  const hours = parseInt(hourStr, 10);

  if (hours === 0) return `12:${minutes} AM`;
  if (hours === 12) return `12:${minutes} PM`;
  if (hours < 12) return `${hours}:${minutes} AM`;
  return `${hours - 12}:${minutes} PM`;
}

/**
 * Converts an array of time options in 30-minute increments
 * from 00:00 to 23:30.
 *
 * @returns Array of 48 TimeOption objects covering the full day
 */
function generateTimeOptions(): TimeOption[] {
  const options: TimeOption[] = [];

  for (let hours = 0; hours < 24; hours++) {
    for (let minutes = 0; minutes < 60; minutes += 30) {
      const value = `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;

      options.push({
        value,
        label: formatTime24to12(value),
      });
    }
  }

  return options;
}

/**
 * All available time slots for selection in time pickers.
 * Pre-generated at module load time (48 slots: 00:00 to 23:30).
 *
 * Example entries:
 *   { value: "00:00", label:: "12:00 AM" }
 *   { value: "09:00", label: "9:00 AM" }
 *   { value: "14:30", label: "2:30 PM" }
 *   { value: "23:00", label: "11:30 PM" }
 */
export const TIME_OPTIONS: TimeOption[] = generateTimeOptions();

/**
 * Order days of the week matching the Prisma DayOfWeek enum.
 * Used to ensure consistent ordering in schedule display.
 */
export const DAYS_OF_WEEK = [
  { value: "MONDAY", label: "Monday", shortLabel: "Mon" },
  { value: "TUESDAY", label: "Tuesday", shortLabel: "Tue" },
  { value: "WEDNESDAY", label: "Wednesday", shortLabel: "Wed" },
  { value: "THURSDAY", label: "Thursday", shortLabel: "Thu" },
  { value: "FRIDAY", label: "Friday", shortLabel: "Fri" },
  { value: "SATURDAY", label: "Saturday", shortLabel: "Sat" },
  { value: "SUNDAY", label: "Sunday", shortLabel: "Sun" },
] as const;

/*** Type representing a valid day of the week string. */
export type DayOfWeekValue = (typeof DAYS_OF_WEEK)[number]["value"];
