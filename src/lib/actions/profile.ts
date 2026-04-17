/**
 * @file Profile Server Actions
 * @description Server-side functions for updating user profile and password.
 *
 * Security measures:
 *   - Current user authentication check
 *   - Email uniqueness validation
 *   - Current password verification before password change
 *   - Password hashing with bcrypt
 *   - Session revalidation after updates
 */

"use server";

import { revalidatePath } from "next/cache";
import { hash, compare } from "bcryptjs";

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { Prisma } from "@/generated/prisma/client";
import {
  updateProfileSchema,
  changePasswordSchema,
  type UpdateProfileValues,
  type ChangePasswordValues,
} from "@/lib/validators/profile";
import {
  parseEmailPreferences,
  type EmailPreferences,
} from "@/lib/email-utils";

/** Standard result type for profile actions. */
type ActionResult = {
  success?: string;
  error?: string;
};

/**
 * Updates the current user's profile information.
 *
 * Validates:
 *   - User is authenticated
 *   - New email is not already taken by another user
 *   - Input passes Zod schema validation
 *
 * @param values - Profile form data (name, email, phone)
 * @returns Object with `success` or `error` message
 */
export async function updateProfile(
  values: UpdateProfileValues
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { error: "Please sign in." };
    }

    // Validate input
    const validatedFields = updateProfileSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid fields. Please check your input." };
    }

    const { name, email, phone } = validatedFields.data;

    // Check if email is already taken by another user
    if (email !== user.email) {
      const existingUser = await db.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (existingUser && existingUser.id !== user.id) {
        return { error: "This email is already in use." };
      }
    }

    // Update the user record
    await db.user.update({
      where: { id: user.id },
      data: {
        name,
        email,
        phone: phone || null,
      },
    });

    // Revalidate pages that display user info
    revalidatePath("/profile");
    revalidatePath("/my-account");

    return { success: "Profile updated successfully!" };
  } catch (error) {
    console.error("Update profile error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

/**
 * Changes the current user's password.
 *
 * Validates:
 *   - User is authenticated
 *   - User has a password set (not OAuth-only account)
 *   - Current password is correct
 *   - New password meets requirements
 *   - New password and confirmation match
 *
 * @param values - Password change form data
 * @returns Object with `success` or `error` message
 */
export async function changePassword(
  values: ChangePasswordValues
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { error: "Please sign in." };
    }

    // Fetch the full user record (including password hash)
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    });

    if (!fullUser || !fullUser.password) {
      return {
        error:
          "You cannot change your password because you signed in with a social provider.",
      };
    }

    // Validate input
    const validatedFields = changePasswordSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid fields. Please check your input." };
    }

    const { currentPassword, newPassword } = validatedFields.data;

    // Verify the current password is correct
    const passwordsMatch = await compare(currentPassword, fullUser.password);
    if (!passwordsMatch) {
      return { error: "Current password is incorrect." };
    }

    // Hash the new password
    const hashedPassword = await hash(newPassword, 10);

    // Update the password
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return { success: "Password changed successfully!" };
  } catch (error) {
    console.error("Change password error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

/**
 * Updates the current user's email preferences.
 *
 * Only optional email types can be updated. The function merges the
 * provided updates with existing preferences, preserving any keys
 * not explicitly changed.
 *
 * @param updates - Partial email preferences to update
 * @returns Object with `success` or `error` message
 */
export async function updateEmailPreferences(
  updates: Partial<EmailPreferences>
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { error: "Please sign in." };
    }

    // Fetch current preferences from database
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { emailPreferences: true },
    });

    if (!dbUser) {
      return { error: "User not found." };
    }

    // Merge existing preferences with updates
    const currentPreferences = parseEmailPreferences(dbUser.emailPreferences);
    const updatedPreferences: EmailPreferences = {
      ...currentPreferences,
      ...updates,
    };

    // Persist to database
    await db.user.update({
      where: { id: user.id },
      data: {
        emailPreferences:
          updatedPreferences as unknown as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/profile");

    return { success: "Email preferences updated." };
  } catch (error) {
    console.error("Update email preferences error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

/**
 * Fetches the current user's email preferences.
 *
 * @returns Fully populated EmailPreferences with defaults for missing keys
 */
export async function getEmailPreferences(): Promise<EmailPreferences> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      bookingReminders: true,
      reviewRequests: true,
      marketingEmails: true,
    };
  }

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { emailPreferences: true },
  });

  return parseEmailPreferences(dbUser?.emailPreferences);
}
