/**
 * @file Authentication Server Actions
 * @description Server-side functions for user registration, login,
 * and email verification.
 *
 * Features:
 *   - signUp no longer sets emailVerified (user must verify via email)
 *   - signUp sends a verification email after creating the account
 *   - New resendVerification action for re-sending the verification email
 *   - login checks email verification status for credential users
 */

"use server";

import { AuthError } from "next-auth";
import { hash } from "bcryptjs";

import { signIn } from "@/lib/auth";
import db from "@/lib/db";
import { sendEmail } from "@/lib/email";
import {
  generateVerificationToken,
  buildVerificationUrl,
} from "@/lib/email-utils";
import { renderVerifyEmail } from "@/emails/verify-email";
import {
  signUpSchema,
  signInSchema,
  type SignUpFormValues,
  type SignInFormValues,
} from "@/lib/validators/auth";

/**
 * Result type for auth actions.
 */
type AuthActionResult = {
  success?: string;
  error?: string;
};

/**
 * Register a new user account.
 *
 * Flow:
 *   1. Validate input with Zod schema
 *   2. Check if email is already registered
 *   3. Hash the password with bcrypt
 *   4. Create the user (emailVerified = null)
 *   5. Send verification email
 *   6. Return success
 *
 * @param values - The sign-up form data
 * @returns Object with `success` or `error` message
 */
export async function signUp(
  values: SignUpFormValues
): Promise<AuthActionResult> {
  try {
    const validatedFields = signUpSchema.safeParse(values);

    if (!validatedFields.success) {
      return { error: "Invalid fields. Please check your inputs." };
    }

    const { name, email, password, role } = validatedFields.data;

    // Check if the email is already registered
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: "An account with this email already exists." };
    }

    // Hash the password
    const hashedPassword = await hash(password, 10);

    // Create the user WITHOUT setting emailVerified
    await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        // emailVerified is null by default — user must verify via email
      },
    });

    // Send verification email (fire-and-forget — don't block sign-up on failure)
    try {
      const token = generateVerificationToken(email);
      const verificationUrl = buildVerificationUrl(token);

      const html = await renderVerifyEmail({
        userName: name,
        verificationUrl,
      });

      await sendEmail({
        to: email,
        subject: "Verify your email — Appointly",
        html,
      });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Don't fail the sign-up — the user can request a new email later
    }

    return {
      success:
        "Account created! Please check your email to verify your address.",
    };
  } catch (error) {
    console.error("Sign-up error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

/**
 * Authenticate user with email and password.
 *
 * Checks email verification status before allowing sign-in.
 * Unverified users are prompted to check their email.
 *
 * @param values - The sign-in form data
 * @returns Object with `error` message on failure (success causes redirect)
 */
export async function login(
  values: SignInFormValues
): Promise<AuthActionResult> {
  try {
    const validatedFields = signInSchema.safeParse(values);

    if (!validatedFields.success) {
      return { error: "Invalid fields. Please check your input." };
    }

    const { email, password } = validatedFields.data;

    // Look up the user to check verification status and role
    const user = await db.user.findUnique({
      where: { email },
      select: { role: true, emailVerified: true, password: true },
    });

    // Check if the user has a password (credential account)
    // OAuth users won't have a password — they should use Google sign-in
    if (user && !user.password) {
      return {
        error:
          "This account uses Google sign-in. Please use the 'Continue with Google' button.",
      };
    }

    // Check email verification for credential users
    if (user && !user.emailVerified) {
      return {
        error:
          "Please verify your email address before signing in. Check your inbox for the verification link.",
      };
    }

    // Determine where to redirect after successful login
    const redirectTo =
      user?.role === "ADMIN"
        ? "/admin/overview"
        : user?.role === "BUSINESS_OWNER"
          ? "/dashboard/overview"
          : "/browse";

    // Attempt sign-in via NextAuth
    await signIn("credentials", {
      email,
      password,
      redirectTo,
    });

    return { success: "Signed in successfully!" };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password." };
        default:
          return { error: "Something went wrong. Please try again." };
      }
    }

    // Re-throw non-auth errors (including NEXT_REDIRECT)
    throw error;
  }
}

/**
 * Resends the verification email to a user.
 *
 * Used when a user's verification link has expired or was lost.
 *
 * @param email - The email address to resend verification to
 * @returns Object with `success` or `error` message
 */
export async function resendVerificationEmail(
  email: string
): Promise<AuthActionResult> {
  try {
    if (!email || !email.includes("@")) {
      return { error: "Please enter a valid email address." };
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { name: true, email: true, emailVerified: true },
    });

    if (!user) {
      // Don't reveal whether the email exists (security)
      return {
        success:
          "If an account exists with this email, a verification link has been sent.",
      };
    }

    if (user.emailVerified) {
      return { error: "This email is already verified. You can sign in." };
    }

    // Generate and send new verification email
    const token = generateVerificationToken(user.email);
    const verificationUrl = buildVerificationUrl(token);

    const html = await renderVerifyEmail({
      userName: user.name ?? "there",
      verificationUrl,
    });

    await sendEmail({
      to: user.email,
      subject: "Verify your email — Appointly",
      html,
    });

    return {
      success: "Verification email sent! Please check your inbox.",
    };
  } catch (error) {
    console.error("Resend verification error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}
