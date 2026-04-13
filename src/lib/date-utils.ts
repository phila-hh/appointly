/**
 * @file Date Utility Functions
 * @description Helper functions for date manipulation and formatting in analytics.
 */

import {
  subDays,
  subMonths,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
  differenceInDays,
} from "date-fns";

export type DateRangePreset =
  | "today"
  | "yesterday"
  | "last7days"
  | "last30days"
  | "last90days"
  | "thisWeek"
  | "lastWeek"
  | "thisMonth"
  | "lastMonth"
  | "custom";

/**
 * Gets the date range for a preset.
 *
 * @param preset - The preset name
 * @param customStart - Custom start date (for 'custom' preset)
 * @param customEnd - Custom end date (for 'custom' preset)
 * @returns { start: Date, end: Date }
 */
export function getDateRangeForPreset(
  preset: DateRangePreset,
  customStart?: Date,
  customEnd?: Date
): { start: Date; end: Date } {
  const now = new Date();

  switch (preset) {
    case "today":
      return {
        start: startOfDay(now),
        end: endOfDay(now),
      };

    case "yesterday":
      const yesterday = subDays(now, 1);
      return {
        start: startOfDay(yesterday),
        end: endOfDay(yesterday),
      };

    case "last7days":
      return {
        start: startOfDay(subDays(now, 6)), // Include today
        end: endOfDay(now),
      };

    case "last30days":
      return {
        start: startOfDay(subDays(now, 29)),
        end: endOfDay(now),
      };

    case "last90days":
      return {
        start: startOfDay(subDays(now, 89)),
        end: endOfDay(now),
      };

    case "thisWeek":
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }), // Monday
        end: endOfWeek(now, { weekStartsOn: 1 }),
      };

    case "lastWeek":
      const lastWeekStart = startOfWeek(subDays(now, 7), { weekStartsOn: 1 });
      const lastWeekEnd = endOfWeek(subDays(now, 7), { weekStartsOn: 1 });
      return {
        start: lastWeekStart,
        end: lastWeekEnd,
      };

    case "thisMonth":
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
      };

    case "lastMonth":
      const lastMonth = subMonths(now, 1);
      return {
        start: startOfMonth(lastMonth),
        end: endOfMonth(lastMonth),
      };

    case "custom":
      if (!customStart || !customEnd) {
        // Default to last 30 days if custom dates not provided
        return getDateRangeForPreset("last30days");
      }
      return {
        start: startOfDay(customStart),
        end: endOfDay(customEnd),
      };

    default:
      return getDateRangeForPreset("last30days");
  }
}

/**
 * Gets the comparison period for a date range (previous period of same length).
 *
 * Used for calculating growth percentages.
 *
 * @param start - Current period start date
 * @param end - Current period end date
 * @returns { start: Date, end: Date } for the comparison period
 */
export function getComparisonPeriod(
  start: Date,
  end: Date
): { start: Date; end: Date } {
  const days = differenceInDays(end, start) + 1; // +1 to include both dates

  return {
    start: subDays(start, days),
    end: subDays(end, days),
  };
}

/**
 * Calculates percentage change between two values.
 *
 * @param current - Current value
 * @param previous - Previous value
 * @returns Percentage change (e.g., 25.5 for 25.5% increase)
 */
export function calculatePercentageChange(
  current: number,
  previous: number
): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return ((current - previous) / previous) * 100;
}

/**
 * Formats a date range as a human-readable string.
 *
 * @param start - Start date
 * @param end - End date
 * @returns Formatted string (e.g., "Jan 1 - Jan 31, 2024")
 */
export function formatDateRange(start: Date, end: Date): string {
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  if (startYear === endYear) {
    if (start.getMonth() === end.getMonth()) {
      // Same month and year
      return `${format(start, "MMM d")} - ${format(end, "d, yyyy")}`;
    }
    // Same year, different months
    return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
  }

  // Different years
  return `${format(start, "MMM d, yyyy")} - ${format(end, "MMM d, yyyy")}`;
}
