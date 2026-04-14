"use server";

import { revalidatePath } from "next/cache";

import db from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/guards";

type AdminActionResult = {
  success?: string;
  error?: string;
};

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

export async function suspendUser(userId: string): Promise<AdminActionResult> {
  try {
    const admin = await requireAdmin();
    if (admin.id === userId) {
      return { error: "You cannot suspend your own admin account." };
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
    });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin/audit-log");
    return { success: "User suspended successfully." };
  } catch (error) {
    console.error("suspendUser error:", error);
    return { error: "Failed to suspend user." };
  }
}

export async function activateUser(userId: string): Promise<AdminActionResult> {
  try {
    const admin = await requireAdmin();

    await db.user.update({
      where: { id: userId },
      data: { emailVerified: new Date() },
    });

    await createAuditLog({
      adminId: admin.id,
      action: "ACTIVATE_USER",
      entityType: "USER",
      entityId: userId,
    });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin/audit-log");
    return { success: "User activated successfully." };
  } catch (error) {
    console.error("activateUser error:", error);
    return { error: "Failed to activate user." };
  }
}

export async function suspendBusiness(
  businessId: string
): Promise<AdminActionResult> {
  try {
    const admin = await requireAdmin();

    await db.business.update({
      where: { id: businessId },
      data: { isActive: false },
    });

    await createAuditLog({
      adminId: admin.id,
      action: "SUSPEND_BUSINESS",
      entityType: "BUSINESS",
      entityId: businessId,
    });

    revalidatePath("/admin/businesses");
    revalidatePath(`/admin/businesses/${businessId}`);
    revalidatePath("/browse");
    revalidatePath("/admin/audit-log");
    return { success: "Business suspended successfully." };
  } catch (error) {
    console.error("suspendBusiness error:", error);
    return { error: "Failed to suspend business." };
  }
}

export async function activateBusiness(
  businessId: string
): Promise<AdminActionResult> {
  try {
    const admin = await requireAdmin();

    await db.business.update({
      where: { id: businessId },
      data: { isActive: true },
    });

    await createAuditLog({
      adminId: admin.id,
      action: "ACTIVATE_BUSINESS",
      entityType: "BUSINESS",
      entityId: businessId,
    });

    revalidatePath("/admin/businesses");
    revalidatePath(`/admin/businesses/${businessId}`);
    revalidatePath("/browse");
    revalidatePath("/admin/audit-log");
    return { success: "Business activated successfully." };
  } catch (error) {
    console.error("activateBusiness error:", error);
    return { error: "Failed to activate business." };
  }
}

export async function removeReview(
  reviewId: string
): Promise<AdminActionResult> {
  try {
    const admin = await requireAdmin();

    const review = await db.review.findUnique({
      where: { id: reviewId },
      select: { id: true, businessId: true, bookingId: true },
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
      },
    });

    revalidatePath("/admin/reviews");
    revalidatePath("/admin/audit-log");
    revalidatePath("/browse");
    return { success: "Review removed successfully." };
  } catch (error) {
    console.error("removeReview error:", error);
    return { error: "Failed to remove review." };
  }
}

export async function flagReview(reviewId: string): Promise<AdminActionResult> {
  try {
    const admin = await requireAdmin();

    await createAuditLog({
      adminId: admin.id,
      action: "FLAG_REVIEW",
      entityType: "REVIEW",
      entityId: reviewId,
    });

    revalidatePath("/admin/reviews");
    revalidatePath("/admin/audit-log");
    return { success: "Review flagged for moderation follow-up." };
  } catch (error) {
    console.error("flagReview error:", error);
    return { error: "Failed to flag review." };
  }
}
