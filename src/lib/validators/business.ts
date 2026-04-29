/**
 * @file Business Validation Schemas
 * @description Zod schemas for business profile creation, editing,
 * and announcement management.
 *
 * Used by:
 *   - BusinessProfileForm (client-side validation)
 *   - createBusiness / updateBusiness server actions (server-side validation)
 *   - AnnouncementForm (client-side validation)
 *   - updateAnnouncement server action (server-side validation)
 */

import { z } from "zod";

/** All valid business category values matching the Prisma enum. */
const BUSINESS_CATEGORY_VALUES = [
  "BARBERSHOP",
  "SALON",
  "SPA",
  "FITNESS",
  "DENTAL",
  "MEDICAL",
  "TUTORING",
  "CONSULTING",
  "PHOTOGRAPHY",
  "AUTOMOTIVE",
  "HOME_SERVICES",
  "PET_SERVICES",
  "OTHER",
] as const;

/**
 * Validation schema for creating or editing a business profile.
 *
 * Required fields: name, category
 * Optional fields: all contact and location info, images
 */
export const businessSchema = z.object({
  name: z
    .string()
    .min(2, { error: "Business name must be at least 2 characters." })
    .max(100, { error: "Business name must be less than 100 characters." })
    .trim(),
  description: z
    .string()
    .max(1000, { error: "Description must be less than 1000 characters." })
    .optional()
    .or(z.literal("")),
  category: z.enum(BUSINESS_CATEGORY_VALUES, {
    error: "Please select a business category.",
  }),
  phone: z
    .string()
    .max(20, { error: "Phone number is too long." })
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .toLowerCase()
    .trim()
    .email({ error: "Please enter a valid email address." })
    .optional()
    .or(z.literal("")),
  website: z
    .url({ error: "Please enter a valid URL." })
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .max(200, { error: "Address is too long." })
    .optional()
    .or(z.literal("")),
  city: z
    .string()
    .max(100, { error: "City name is too long." })
    .optional()
    .or(z.literal("")),
  state: z
    .string()
    .max(50, { error: "State name is too long." })
    .optional()
    .or(z.literal("")),
  zipCode: z
    .string()
    .max(20, { error: "ZIP code is too long." })
    .optional()
    .or(z.literal("")),
});

/** TypeScript type inferred from the business schema. */
export type BusinessFormValues = z.infer<typeof businessSchema>;

/**
 * Validation schema for setting or updating a business announcement.
 *
 * Rules:
 *   - announcement: optional text, max 500 characters.
 *     Empty string is treated as "no announcement" in the server action.
 *   - announcementExpiresAt: optional ISO date string.
 *     Null / empty string means the announcement is permanent until
 *     manually removed by the business owner.
 *     When provided, must parse to a valid date in the future.
 *
 * Business rules enforced in the server action (not here):
 *   - Only the authenticated business owner may update their announcement
 *   - Saving with empty announcement clears both text and expiry date
 */
export const announcementSchema = z.object({
  announcement: z
    .string()
    .max(500, { error: "Announcement must be less than 500 characters." })
    .optional()
    .or(z.literal("")),
  announcementExpiresAt: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => {
        // Empty / undefined → permanent announcement, always valid
        if (!val || val === "") return true;
        // Must parse to a real date
        const date = new Date(val);
        if (isNaN(date.getTime())) return false;
        // Must be in the future
        return date > new Date();
      },
      { error: "Expiry date must be a valid future date." }
    ),
});

/** TypeScript type inferred from the announcement schema. */
export type AnnouncementFormValues = z.infer<typeof announcementSchema>;
