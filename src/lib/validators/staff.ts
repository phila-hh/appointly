/**
 * @file Staff Validation Schemas
 * @description Zod schemas for staff member management, service
 * assignments, and individual working hours.
 *
 * Used by:
 *   - StaffForm (client-side validation for add/edit)
 *   - StaffServiceForm (service assignment validation)
 *   - StaffHoursForm (individual schedule validation)
 *   - Server actions (server-side validation)
 *
 * Three distinct schemas cover the three staff management operations:
 *   1. staffSchema — Staff member details (name, contact, title)
 *   2. staffServiceSchema — Service assignment (which services they perform)
 *   3. staffHoursSchema — Individual weekly schedule
 */

import { z } from "zod";

/**
 * Validation schema for creating or editing a staff member.
 *
 * Required fields: name
 * Optional fields: email, phone, title, image
 */
export const staffSchema = z.object({
  name: z
    .string()
    .min(2, { error: "Name must be at least 2 characters." })
    .max(100, { error: "Name must be less than 100 characters." })
    .trim(),
  email: z
    .email({ error: "Please enter a valid email address." })
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .max(20, { error: "Phone number is too long." })
    .optional()
    .or(z.literal("")),
  title: z
    .string()
    .max(100, { error: "Title must be less than 100 characters." })
    .optional()
    .or(z.literal("")),
});

/** Parsed and validated staff form values (safe for backend use). */
export type StaffFormValues = z.infer<typeof staffSchema>;

/**
 * Validation schema for assigning services to a staff member.
 *
 * Requires at least one service to be selected. The server action
 * additionally validates that all service IDs belong to the same business.
 */
export const staffServiceSchema = z.object({
  staffId: z.string().min(1, { error: "Staff member is required." }),
  serviceIds: z
    .array(z.string().min(1))
    .min(1, { error: "Please assign at least one service." }),
});

/** TypeScript type for the staff service assignment form. */
export type StaffServiceFormValues = z.infer<typeof staffServiceSchema>;

/** Time string pattern matching "HH:mm" format (00:00 to 23:59). */
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Schema for a single day's staff working hours.
 *
 * When `isClosed` is true the open/close times are ignored
 * (the staff member does not work that day).
 */
const staffDayHoursSchema = z
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

      // Open time must be strictly before close time
      return data.openTime < data.closeTime;
    },
    {
      error: "Start time must be before end time.",
      path: ["closeTime"],
    }
  );

/**
 * Schema for the complete weekly staff schedule.
 * Expects an array of exactly 7 day entries.
 */
export const staffHoursSchema = z.object({
  staffId: z.string().min(1, { error: "Staff member is required." }),
  schedule: z
    .array(staffDayHoursSchema)
    .length(7, { error: "All 7 days of the week are required." }),
});

/** TypeScript type for a single day's staff hours. */
export type StaffDayHoursValue = z.infer<typeof staffDayHoursSchema>;

/** TypeScript type for the complete weekly staff schedule form. */
export type StaffHoursFormValues = z.infer<typeof staffHoursSchema>;
