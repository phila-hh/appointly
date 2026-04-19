/**
 * @file Admin Validation Schemas
 * @description Zod schemas for admin-level actions including user/business
 * suspension, platform settings updates, and payout management.
 *
 * Used by:
 *   - Admin server actions (server-side validation)
 *   - Admin UI forms (client-side validation)
 */

import { z } from "zod";

// =============================================================================
// Suspension Schema
// =============================================================================

/**
 * Schema for suspending a user or business.
 * Requires a reason so the suspension email can inform the recipient.
 */
export const suspendSchema = z.object({
  reason: z
    .string()
    .min(10, { error: "Please provide a reason of at least 10 characters." })
    .max(500, { error: "Reason must be less than 500 characters." })
    .trim(),
});

export type SuspendFormValues = z.infer<typeof suspendSchema>;

// =============================================================================
// Platform Settings Schema
// =============================================================================

/**
 * Schema for updating platform-wide settings.
 * Commission rate is stored as a decimal (0.10 = 10%).
 */
export const platformSettingsSchema = z.object({
  defaultCommissionRate: z.coerce
    .number({ error: "Commission rate must be a number." })
    .min(0, { error: "Commission rate cannot be negative." })
    .max(100, { error: "Commission rate cannot exceed 100%." })
    .transform((val) => val / 100), // Convert percentage to decimal for storage
  payoutSchedule: z.enum(["MONTHLY", "WEEKLY", "BIWEEKLY"], {
    error: "Please select a valid payout schedule.",
  }),
});

export type PlatformSettingsFormValues = z.infer<typeof platformSettingsSchema>;

/** Raw input type before transformation (what the form sends). */
export type PlatformSettingsFormInput = {
  defaultCommissionRate: number | string;
  payoutSchedule: "MONTHLY" | "WEEKLY" | "BIWEEKLY";
};
