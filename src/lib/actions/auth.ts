/**
 *  @file Authentication Server Actions
 * @description Server-side functions for user registration and login.
 *
 * Server Actions are marked with "use server" and run exclusively on the
 * server. They can be called from client components (forms, buttons) but
 * the code itself never reaches the browser. This is where we safely:
 *   - Access the database
 *   - Hash passwords
 *   - Create sessions
 *
 * @see https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
 */

"use server";

import { AuthError } from "next-auth";
import { hash } from "bcryptjs";

import { signIn } from "@/lib/auth";
import db from "@/lib/db";
import {
  signUpSchema,
  signInSchema,
  type SignUpFormValues,
  type SignInFormValues,
} from "@/lib/validators/auth";

/**
 * Result type for auth actions.
 * Every action returns either a success or an error message.
 * This consistent shape makes it easy for the UI to handle responses.
 */
type AuthActionResult = {
  success?: string;
  error?: string;
};

/**
 * Register a new user account
 *
 * Flow:
 *   1. Validate input with Zod schema (server-side revalidation)
 *   2. Check if email is already registered
 *   3. Hash the password with bcrypt
 *   4. Create the user in the database
 *   5. Return success (client will redirect to sign-in)
 *
 * @param values - The sign-up form data (name, email, password, confirmPassword, role)
 * @returns Object with `success` or `error` message
 */
export async function signUp(
  values: SignUpFormValues
): Promise<AuthActionResult> {
  try {
    // Step 1: Re-validate on the server, NEVER trust client-side validation
    // A malicious user could bypass the form and send raw requests
    const validatedFields = signUpSchema.safeParse(values);

    if (!validatedFields.success) {
      return { error: "Invalid fields. Please check your inputs." };
    }

    const { name, email, password, role } = validatedFields.data;

    // Step 2: Check if the email is already registered
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: "An account with this email already exists." };
    }

    // Step 3: Hash the password. The second argument (10) is the "cost factor"
    // or "salt rounds". Higher = more secure but slower. 10 is the standard
    // balance between security and performance (~ 10 hashes/second).
    const hashedPassword = await hash(password, 10);

    // Step 4: Create the user in the database
    await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        emailVerified: new Date(), // Mark as verified (Email verification to be implemented in the future)
      },
    });

    return { success: "Account created successfully! Please sign in." };
  } catch (error) {
    console.error("Sign-up error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

/**
 * Authenticate user with email and password
 *
 * Flow:
 *   1. Validate input with Zod schema
 *   2. Look up the user to determine their role (for redirect)
 *   3. Call NextAuth's signIn with credentials
 *   4. On success: user is redirected (signIn handles this via redirect)
 *   5. On failure: return error message
 *
 * Note: When signIn() succeeds, it internally throws a NEXT_REDIRECT
 * error to trigger Next.js navigation. We must re-throw this (which
 * the final `throw error` in the catch block does).
 *
 * @param values - The sign-in form data (email, password)
 * @returns Object with `error` message on failure (success causes a redirect)
 */
export async function login(
  values: SignInFormValues
): Promise<AuthActionResult> {
  try {
    // Step 1: Validate input
    const validatedFields = signInSchema.safeParse(values);

    if (!validatedFields.success) {
      return { error: "Invalid fields. Please check your input." };
    }

    const { email, password } = validatedFields.data;

    // Step 2: Look up the user to determine redirect destination
    // We do this before signIn so we know where to send them.
    const user = await db.user.findUnique({
      where: { email },
      select: { role: true }, // Only fetch the role field (efficient)
    });

    // Determine where to redirect after successful login
    const redirectTo =
      user?.role == "BUSINESS_OWNER" ? "/dashboard/overview" : "/browse";

    // Step 3: Attempt to sign in via NextAuth's credentials provider.
    // This calls the `authorize` function we defined in auth.ts
    await signIn("credentials", {
      email,
      password,
      redirectTo,
    });

    // This line is never reached on success (signIn redirects).
    return { success: "Signed in successfully!" };
  } catch (error) {
    // NextAuth throws AuthError for authentication failures.
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password." };
        default:
          return { error: "Something went wrong. Please try again." };
      }
    }

    // Re-throw non-auth errors (including NEXT_REDIRECT).
    // The redirect "error" is how Next.js handles navigation internally.
    // If we catch and suppress it, the redirect won't happen.
    throw error;
  }
}
