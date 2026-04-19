/**
 * @file Admin Server Actions
 * @description Server-side functions for admin-level platform management.
 *
 * Includes:
 *   - User account suspension and reactivation (with email notification)
 *   - Business listing suspension and reactivation (with email notification)
 *   - Review moderation (flag / remove)
 *   - Platform settings management
 *
 * Security:
 *   - Every action calls requireAdmin() which redirects non-admins
 *   - Admin cannot suspend their own account
 *   - All actions are logged in the AdminAuditLog (immutable trail)
 *
 * Email notifications:
 *   - Suspension / reactivation emails are sent fire-and-forget
 *   - Email failure never prevents the admin action from completing
 */

"use server";

import { revalidatePath } from "next/cache";

import db from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/guards";
import { sendEmail } from "@/lib/email";
import { platformSettingsSchema } from "@/lib/validators/admin";
import { renderAccountSuspendedEmail } from "@/emails/account-suspended";
import { renderAccountReactivatedEmail } from "@/emails/account-reactivated";

/** Standard result type for admin actions. */
type AdminActionResult = {
  success?: string;
  error?: string;
};

/** Support email address for appeals. */
const SUPPORT_EMAIL = "support@appointly.com";

/** Base URL for appeal links. */
const BASE_URL = process.env.AUTH_URL ?? "http://localhost:3000";

// =============================================================================
// Helpers
// =============================================================================

/**
 * Creates an immutable audit log entry for an admin action.
 * Called after every successful admin operation.
 */
async function createAuditLog(input: {
  adminId: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  await db.adminAuditLog.create({
    data: {
      adminId: input.adminId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata,
    },
  });
}

// =============================================================================
// User Management Actions
// =============================================================================

/**
 * Suspends a user account by setting emailVerified to null.
 *
 * Effect: The suspended user cannot sign in (middleware checks emailVerified).
 * An email is sent notifying them of the suspension and reason.
 *
 * @param userId - The user to suspend
 * @param reason - Admin-provided reason (shown in the suspension email)
 * @returns Object with `success` or `error` message
 */
export async function suspendUser(
  userId: string,
  reason: string
): Promise<AdminActionResult> {
  try {
    const admin = await requireAdmin();

    if (admin.id === userId) {
      return { error: "You cannot suspend your own admin account." };
    }

    if (!reason || reason.trim().length < 10) {
      return {
        error: "Please provide a detailed reason (at least 10 characters).",
      };
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, emailVerified: true },
    });

    if (!user) {
      return { error: "User not found." };
    }

    if (!user.emailVerified) {
      return { error: "This user is already suspended." };
    }

    await db.user.update({
      where: { id: userId },
      data: { emailVerified: null },
    });

    await createAuditLog({
      adminId: admin.id,
      action: "SUSPEND_USER",
      entityType: "USER",
      entityId: userId,
      metadata: { reason: reason.trim(), userEmail: user.email },
    });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin/audit-log");

    // Fire-and-forget suspension email
    sendEmail({
      to: user.email,
      subject: "Your Appointly account has been suspended",
      html: await renderAccountSuspendedEmail({
        recipientName: user.name ?? "there",
        suspensionType: "account",
        reason: reason.trim(),
        supportEmail: SUPPORT_EMAIL,
        appealUrl: `mailto:${SUPPORT_EMAIL}?subject=Account%20Suspension%20Appeal`,
      }),
    }).catch((err) => console.error("suspendUser email error:", err));

    return { success: "User suspended successfully." };
  } catch (error) {
    console.error("suspendUser error:", error);
    return { error: "Failed to suspend user." };
  }
}

/**
 * Reactivates a previously suspended user account.
 * Sets emailVerified to current date, restoring full platform access.
 *
 * @param userId - The user to reactivate
 * @returns Object with `success` or `error` message
 */
export async function activateUser(userId: string): Promise<AdminActionResult> {
  try {
    const admin = await requireAdmin();

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, emailVerified: true },
    });

    if (!user) {
      return { error: "User not found." };
    }

    if (user.emailVerified) {
      return { error: "This user is already active." };
    }

    await db.user.update({
      where: { id: userId },
      data: { emailVerified: new Date() },
    });

    await createAuditLog({
      adminId: admin.id,
      action: "ACTIVATE_USER",
      entityType: "USER",
      entityId: userId,
      metadata: { userEmail: user.email },
    });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin/audit-log");

    // Fire-and-forget reactivation email
    sendEmail({
      to: user.email,
      subject: "Your Appointly account has been reactivated",
      html: await renderAccountReactivatedEmail({
        recipientName: user.name ?? "there",
        reactivationType: "account",
        ctaUrl: `${BASE_URL}/sign-in`,
      }),
    }).catch((err) => console.error("activateUser email error:", err));

    return { success: "User activated successfully." };
  } catch (error) {
    console.error("activateUser error:", error);
    return { error: "Failed to activate user." };
  }
}

// =============================================================================
// Business Management Actions
// =============================================================================

/**
 * Suspends a business listing, hiding it from public browse.
 * Sends an email to the business owner with the reason.
 *
 * @param businessId - The business to suspend
 * @param reason - Admin-provided reason (shown in the suspension email)
 * @returns Object with `success` or `error` message
 */
export async function suspendBusiness(
  businessId: string,
  reason: string
): Promise<AdminActionResult> {
  try {
    const admin = await requireAdmin();

    if (!reason || reason.trim().length < 10) {
      return {
        error: "Please provide a detailed reason (at least 10 characters).",
      };
    }

    const business = await db.business.findUnique({
      where: { id: businessId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    if (!business) {
      return { error: "Business not found." };
    }

    if (!business.isActive) {
      return { error: "This business is already suspended." };
    }

    await db.business.update({
      where: { id: businessId },
      data: { isActive: false },
    });

    await createAuditLog({
      adminId: admin.id,
      action: "SUSPEND_BUSINESS",
      entityType: "BUSINESS",
      entityId: businessId,
      metadata: {
        reason: reason.trim(),
        businessName: business.name,
        ownerEmail: business.owner.email,
      },
    });

    revalidatePath("/admin/businesses");
    revalidatePath(`/admin/businesses/${businessId}`);
    revalidatePath("/browse");
    revalidatePath("/admin/audit-log");

    // Fire-and-forget suspension email to business owner
    sendEmail({
      to: business.owner.email,
      subject: `Your Appointly business listing has been suspended — ${business.name}`,
      html: await renderAccountSuspendedEmail({
        recipientName: business.owner.name ?? "there",
        suspensionType: "business",
        businessName: business.name,
        reason: reason.trim(),
        supportEmail: SUPPORT_EMAIL,
        appealUrl: `mailto:${SUPPORT_EMAIL}?subject=Business%20Suspension%20Appeal%20-%20${encodeURIComponent(business.name)}`,
      }),
    }).catch((err) => console.error("suspendBusiness email error:", err));

    return { success: "Business suspended successfully." };
  } catch (error) {
    console.error("suspendBusiness error:", error);
    return { error: "Failed to suspend business." };
  }
}

/**
 * Reactivates a suspended business listing.
 * Sends a reactivation email to the business owner.
 *
 * @param businessId - The business to reactivate
 * @returns Object with `success` or `error` message
 */
export async function activateBusiness(
  businessId: string
): Promise<AdminActionResult> {
  try {
    const admin = await requireAdmin();

    const business = await db.business.findUnique({
      where: { id: businessId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    if (!business) {
      return { error: "Business not found." };
    }

    if (business.isActive) {
      return { error: "This business is already active." };
    }

    await db.business.update({
      where: { id: businessId },
      data: { isActive: true },
    });

    await createAuditLog({
      adminId: admin.id,
      action: "ACTIVATE_BUSINESS",
      entityType: "BUSINESS",
      entityId: businessId,
      metadata: {
        businessName: business.name,
        ownerEmail: business.owner.email,
      },
    });

    revalidatePath("/admin/businesses");
    revalidatePath(`/admin/businesses/${businessId}`);
    revalidatePath("/browse");
    revalidatePath("/admin/audit-log");

    // Fire-and-forget reactivation email
    sendEmail({
      to: business.owner.email,
      subject: `Your business listing has been reactivated — ${business.name}`,
      html: await renderAccountReactivatedEmail({
        recipientName: business.owner.name ?? "there",
        reactivationType: "business",
        businessName: business.name,
        ctaUrl: `${BASE_URL}/dashboard/overview`,
      }),
    }).catch((err) => console.error("activateBusiness email error:", err));

    return { success: "Business activated successfully." };
  } catch (error) {
    console.error("activateBusiness error:", error);
    return { error: "Failed to activate business." };
  }
}

// =============================================================================
// Review Moderation Actions
// =============================================================================

/**
 * Permanently removes a review from the platform.
 * Used for reviews that violate community guidelines.
 *
 * @param reviewId - The review to remove
 * @returns Object with `success` or `error` message
 */
export async function removeReview(
  reviewId: string
): Promise<AdminActionResult> {
  try {
    const admin = await requireAdmin();

    const review = await db.review.findUnique({
      where: { id: reviewId },
      select: {
        id: true,
        businessId: true,
        bookingId: true,
        rating: true,
        business: { select: { slug: true } },
      },
    });

    if (!review) {
      return { error: "Review not found." };
    }

    await db.review.delete({
      where: { id: reviewId },
    });

    await createAuditLog({
      adminId: admin.id,
      action: "REMOVE_REVIEW",
      entityType: "REVIEW",
      entityId: reviewId,
      metadata: {
        businessId: review.businessId,
        bookingId: review.bookingId,
        rating: review.rating,
      },
    });

    revalidatePath("/admin/reviews");
    revalidatePath("/admin/audit-log");
    revalidatePath(`/business/${review.business.slug}`);
    revalidatePath("/browse");

    return { success: "Review removed successfully." };
  } catch (error) {
    console.error("removeReview error:", error);
    return { error: "Failed to remove review." };
  }
}

/**
 * Flags a review for follow-up moderation.
 * Records the flag in the audit log for visibility.
 *
 * Note: Flagging does not remove or hide the review. It creates an
 * audit trail entry so admins can track reviews under scrutiny.
 *
 * @param reviewId - The review to flag
 * @returns Object with `success` or `error` message
 */
export async function flagReview(reviewId: string): Promise<AdminActionResult> {
  try {
    const admin = await requireAdmin();

    // Verify the review exists before logging
    const review = await db.review.findUnique({
      where: { id: reviewId },
      select: { id: true, businessId: true, rating: true },
    });

    if (!review) {
      return { error: "Review not found." };
    }

    await createAuditLog({
      adminId: admin.id,
      action: "FLAG_REVIEW",
      entityType: "REVIEW",
      entityId: reviewId,
      metadata: {
        businessId: review.businessId,
        rating: review.rating,
      },
    });

    revalidatePath("/admin/reviews");
    revalidatePath("/admin/audit-log");

    return { success: "Review flagged for moderation follow-up." };
  } catch (error) {
    console.error("flagReview error:", error);
    return { error: "Failed to flag review." };
  }
}

// =============================================================================
// Platform Settings Actions
// =============================================================================

/**
 * Updates platform-wide settings (commission rate, payout schedule).
 *
 * Uses an upsert to handle the case where no settings record exists yet.
 * Changes are logged in the audit trail.
 *
 * @param rawRate - Commission percentage (0–100, e.g., 10 for 10%)
 * @param payoutSchedule - The new payout cadence
 * @returns Object with `success` or `error` message
 */
export async function updatePlatformSettings(
  rawRate: number,
  payoutSchedule: "MONTHLY" | "WEEKLY" | "BIWEEKLY"
): Promise<AdminActionResult> {
  try {
    const admin = await requireAdmin();

    // Validate via Zod schema (transforms percentage → decimal)
    const validated = platformSettingsSchema.safeParse({
      defaultCommissionRate: rawRate,
      payoutSchedule,
    });

    if (!validated.success) {
      return { error: "Invalid settings values. Please check your input." };
    }

    const { defaultCommissionRate, payoutSchedule: schedule } = validated.data;

    // Fetch current settings for comparison (for audit log)
    const currentSettings = await db.platformSettings.findFirst();

    await db.platformSettings.upsert({
      where: { id: currentSettings?.id ?? "" },
      update: { defaultCommissionRate, payoutSchedule: schedule },
      create: { defaultCommissionRate, payoutSchedule: schedule },
    });

    await createAuditLog({
      adminId: admin.id,
      action: "UPDATE_PLATFORM_SETTINGS",
      entityType: "PLATFORM_SETTINGS",
      metadata: {
        previousCommissionRate: currentSettings?.defaultCommissionRate,
        newCommissionRate: defaultCommissionRate,
        previousPayoutSchedule: currentSettings?.payoutSchedule,
        newPayoutSchedule: schedule,
      },
    });

    revalidatePath("/admin/platform");
    revalidatePath("/admin/overview");
    revalidatePath("/admin/audit-log");

    return {
      success: `Settings updated. Commission rate set to ${rawRate}%, payout schedule: ${schedule}.`,
    };
  } catch (error) {
    console.error("updatePlatformSettings error:", error);
    return { error: "Failed to update platform settings." };
  }
}
