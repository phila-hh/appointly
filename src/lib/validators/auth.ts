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
      .min(2, { message: "Name must be at least 2 characters." })
      .max(50, { message: "Name must be less than 50 characters." })
      .trim(),
    email: z
      .string()
      .email({ message: "Please enter a valid email address." })
      .toLowerCase()
      .trim(),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." })
      .max(100, { message: "Password must be less than 100 characters." }),
    confirmPassword: z.string(),
    role: z.enum(["CUSTOMER", "BUSINESS_OWNER"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.role !== undefined, {
    message: "Please select a role.",
    path: ["role"],
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
    .string()
    .email({ message: "Please enter a valid email address." })
    .toLowerCase()
    .trim(),
  password: z.string().min(1, { message: "Password is required." }),
});

/** TypeScript type inferred from the sign-in schema */
export type SignInFormValues = z.infer<typeof signInSchema>;
