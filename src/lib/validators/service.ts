/**
 * @file Service Validation Schema
 * @description Zod schemas for service creation and editing.
 *
 * Used by:
 *   - ServiceForm (client-side validation)
 *   - createService / updateService server actions (server-side validation)
 */

import { z } from "zod";

/**
 * Validation schema for creating or editing a service.
 *
 * Required fields: name, price, duration
 * Optional fields: description
 *
 * Price and duration use `coerce` to handle form inputs that come
 * as strings from HTML number inputs.
 */
export const serviceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: "Service name must be at least 2 characters." })
    .max(100, { error: "Service name must be less than 100 characters." }),
  description: z
    .string()
    .max(500, { error: "Description must be less than 500 characters." })
    .optional()
    .or(z.literal("")),
  price: z.coerce
    .number({ error: "Price must be a number." })
    .positive({ error: "Price must be greater than zero." })
    .max(99999.99, { error: "Price is too high." }),
  duration: z.coerce
    .number({ error: "Duration must be a number." })
    .int({ error: "Duration must be a whole number." })
    .min(5, { error: "Duration must be at least 5 minutes." })
    .max(480, { error: "Duration cannot exceed 8 hours." }),
});

/** Parsed and validated values after Zod preprocessing. (safe for backend use). */
export type ServiceFormValues = z.output<typeof serviceSchema>;

/** Raw input values before Zod parsing (matches form input types). */
export type ServiceFormInput = z.input<typeof serviceSchema>;
