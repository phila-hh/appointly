/**
 * @file Authentication Validation Schemas
 * @description Zod schemas for sign-up and sign-in form validation.
 */

import { z } from "zod";

/**
 * Validation schema for the sign-up form
 *
 * Rules:
 *   - name: required, 2-50 characters
 *   - email: required, must be a valid email format
 *   - password: required, minimum 8 characters
 *   - confirmPassword: must match the password field
 *   - role: must be either CUSTOMER or BUSINESS_OWNER
 */
export const signUpSchema = z
  .object({
    name: z
      .string()
      .min(2, { error: "Name must be at least 2 characters." })
      .max(50, { error: "Name must be less than 50 characters." })
      .trim(),
    email: z
      .email({ error: "Please enter a valid email address." })
      .toLowerCase()
      .trim(),
    password: z
      .string()
      .min(8, { error: "Password must be at least 8 characters." })
      .max(100, { error: "Password must be less than 100 characters." }),
    confirmPassword: z.string(),
    role: z.enum(["CUSTOMER", "BUSINESS_OWNER"], {
      error: "Please select a role.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Passwords do not match.",
    path: ["confirmPassword"],
  });

/**
 * Typescript type inferred from the sign-up schema.
 * Automatically stays in sync with the schema definition above.
 */
export type SignUpFormValues = z.infer<typeof signUpSchema>;

/**
 * Validation schema for the sign-in form.
 *
 * Rules:
 *   - email: required, must be a valid email format
 *   - password: required, at least 1 character
 */
export const signInSchema = z.object({
  email: z
    .email({ error: "Please enter a valid email address." })
    .toLowerCase()
    .trim(),
  password: z.string().min(1, { error: "Password is required." }),
});

/** TypeScript type inferred from the sign-in schema */
export type SignInFormValues = z.infer<typeof signInSchema>;
