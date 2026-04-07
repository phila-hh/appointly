/**
 * @file Profile Validation Schemas
 * @description Zod schemas for user profile updates and password changes.
 *
 * Used by:
 *   - Profile form (client-side validation)
 *   - updateProfile server action (server-side validation)
 *   - changePassword server action (server-side validation)
 */

import { z } from "zod";

/**
 * Schema for updating user profile information.
 *
 * Allow updating: name, email, phone
 * Email must be valid format, phone is optional
 */
export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, { error: "Name must be at least 2 characters." })
    .max(50, { error: "Name must be less than 50 characters." })
    .trim(),
  email: z
    .email({ error: "Please enter a valid email address." })
    .trim()
    .toLowerCase(),
  phone: z
    .string()
    .max(20, { error: "Phone number is too long." })
    .optional()
    .or(z.literal("")),
});

/** TypeScript type inferred from the update profile schema. */
export type UpdateProfileValues = z.infer<typeof updateProfileSchema>;

/**
 * Schema for updating user password.
 *
 * Requires:
 *   - Current password (for verification)
 *   - New password (min 8 characters)
 *   - Confirmation password (must match new password)
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { error: "Current password is required." }),
    newPassword: z
      .string()
      .min(8, { error: "Password must be at least 8 characters." })
      .max(100, { error: "Password must be less than 100 characters" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    error: "Passwords do not match.",
    path: ["confirmPassword"], // Error shows on confirmPassword field
  });

/** TypeScrip type inferred from change password schema. */
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
