/**
 * @file Availability Validation Schema
 * @description Zod schemas for business hours configuration.
 *
 * Validates the complete weekly schedule submitted from the
 * availability management form. Each day has open/close times
 * and a closed flag.
 *
 * Key validation rules:
 *   - Open time must be before close time (unless the day is marked closed)
 *   - Times must be in "HH:mm" format
 *   - All 7 days must be present
 */

import { z } from "zod";

/** Time string pattern matching "HH:mm" format (00:00 to 23:59). */
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Schema for a single day's business hours.
 *
 * When `isClosed` is true the open/close times are ignored
 * (the business is closed that day regardless of time values.)
 */
const dayHoursSchema = z
  .object({
    dayOfWeek: z.enum([
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ]),
    openTime: z
      .string()
      .regex(timePattern, { error: "Invalid time format. Use HH:mm." }),
    closeTime: z
      .string()
      .regex(timePattern, { error: "Invalid time format. Use HH:mm." }),
    isClosed: z.boolean(),
  })
  .refine(
    (data) => {
      // Skip time validation if the day is closed
      if (data.isClosed) return true;

      // Open time must be strictly before closed time
      return data.openTime < data.closeTime;
    },
    {
      error: "Opening time must be before closing time.",
      path: ["closeTime"],
    }
  );

/**
 * Schema for the complete weekly schedule.
 * Expects an array of exactly 7 day entries.
 */
export const availabilitySchema = z.object({
  schedule: z
    .array(dayHoursSchema)
    .length(7, { error: "All 7 days of the week are required." }),
});

/** TypeScript type for a single day's hours. */
export type DayHoursValue = z.infer<typeof dayHoursSchema>;

/** TypeScript type for the complete weekly schedule form. */
export type AvailabilityFormValues = z.infer<typeof availabilitySchema>;
