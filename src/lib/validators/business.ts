/**
 * @file Business Validation Schemas
 * @description Zod schemas for business profile creation and editing.
 *
 * Used by:
 *   - BusinessProfileForm (client-side validation)
 *   - createBusiness / updateBusiness server actions (server-side validation)
 */

import { z } from "zod";

/** All valid business category values matching the prisma enum. */
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

/** TypeScript type inferred form the business schema. */
export type BusinessFormValues = z.infer<typeof businessSchema>;
