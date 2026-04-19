/**
 * @file Finance Server Actions
 * @description Server-side functions for commission and payout management.
 *
 * Handles:
 *   - Generating payout batches for a period (groups pending commissions by business)
 *   - Moving payouts through the lifecycle (PENDING → PROCESSING → PAID / FAILED)
 *   - Email notification to business owners when a payout is marked PAID
 *
 * All actions require ADMIN role and are logged in the AdminAuditLog.
 *
 * Payout lifecycle:
 *   PENDING → (admin reviews) → PROCESSING → PAID
 *                                           → FAILED → commissions returned to PENDING
 */

"use server";

import { revalidatePath } from "next/cache";

import { Prisma } from "@/generated/prisma/client";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/guards";
import { sendEmail } from "@/lib/email";
import { formatPrice } from "@/lib/utils";
import { renderPayoutProcessedEmail } from "@/emails/payout-processed";

/** Standard result type for finance actions. */
type FinanceActionResult = {
  success?: string;
  error?: string;
};

/** Base URL for CTA links in emails. */
const BASE_URL = process.env.AUTH_URL ?? "http://localhost:3000";

// =============================================================================
// Helpers
// =============================================================================

/** Rounds a currency value to 2 decimal places. */
function roundCurrency(value: number): number {
  return Number(value.toFixed(2));
}

/**
 * Creates an audit log entry under the FINANCE entity type.
 * Keeps finance audit entries separate from user/business entries.
 */
async function writeFinanceAudit(input: {
  adminId: string;
  action: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  await db.adminAuditLog.create({
    data: {
      adminId: input.adminId,
      action: input.action,
      entityType: "FINANCE",
      entityId: input.entityId,
      metadata: input.metadata,
    },
  });
}

// =============================================================================
// Payout Generation
// =============================================================================

/**
 * Generates payout batches for all pending commissions in a given period.
 *
 * Algorithm:
 *   1. Fetch all PENDING commissions
 *   2. Group them by businessId
 *   3. For each business, create a Payout record (sum of net amounts)
 *   4. Link commissions to payout and mark as INCLUDED_IN_PAYOUT
 *   5. All operations in a single transaction
 *
 * Idempotency: Running this twice with the same period is safe because
 * only PENDING commissions are picked up (already-included ones are skipped).
 *
 * @param period - The payout period string (e.g., "2025-06")
 * @returns Object with `success` or `error` message
 */
export async function generatePayoutsForPeriod(
  period: string
): Promise<FinanceActionResult> {
  try {
    const admin = await requireAdmin();

    const selectedPeriod = period.trim();
    if (!selectedPeriod) {
      return { error: "Payout period is required (format: YYYY-MM)." };
    }

    // Validate period format
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(selectedPeriod)) {
      return {
        error: "Invalid period format. Use YYYY-MM (e.g., 2025-06).",
      };
    }

    const pending = await db.commission.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
    });

    if (pending.length === 0) {
      return {
        error: "No pending commissions available for payout generation.",
      };
    }

    // Group commissions by businessId
    const grouped = new Map<string, typeof pending>();
    for (const row of pending) {
      const existing = grouped.get(row.businessId) ?? [];
      existing.push(row);
      grouped.set(row.businessId, existing);
    }

    // Create payout batches in a single transaction
    await db.$transaction(async (tx) => {
      for (const [businessId, commissions] of grouped.entries()) {
        const grossTotal = roundCurrency(
          commissions.reduce((sum, c) => sum + Number(c.grossAmount), 0)
        );
        const commissionTotal = roundCurrency(
          commissions.reduce((sum, c) => sum + Number(c.commissionAmount), 0)
        );
        const amount = roundCurrency(
          commissions.reduce((sum, c) => sum + Number(c.netAmount), 0)
        );

        const payout = await tx.payout.create({
          data: {
            businessId,
            amount,
            commissionTotal,
            grossTotal,
            period: selectedPeriod,
            status: "PENDING",
          },
        });

        await tx.commission.updateMany({
          where: { id: { in: commissions.map((c) => c.id) } },
          data: {
            payoutId: payout.id,
            status: "INCLUDED_IN_PAYOUT",
          },
        });
      }
    });

    await writeFinanceAudit({
      adminId: admin.id,
      action: "GENERATE_PAYOUT_BATCH",
      metadata: {
        period: selectedPeriod,
        businessCount: grouped.size,
        commissionCount: pending.length,
      },
    });

    revalidatePath("/admin/finance");
    revalidatePath("/admin/finance/commissions");
    revalidatePath("/admin/finance/payouts");
    revalidatePath("/admin/audit-log");
    revalidatePath("/dashboard/earnings");

    return {
      success: `${grouped.size} payout batch${grouped.size === 1 ? "" : "es"} generated for ${selectedPeriod}.`,
    };
  } catch (error) {
    console.error("generatePayoutsForPeriod error:", error);
    return { error: "Failed to generate payout batches." };
  }
}

// =============================================================================
// Payout Lifecycle Actions
// =============================================================================

/**
 * Moves a payout from PENDING to PROCESSING status.
 * Used when an admin has started the bank/mobile money transfer.
 *
 * @param payoutId - The payout to mark as processing
 * @returns Object with `success` or `error` message
 */
export async function setPayoutProcessing(
  payoutId: string
): Promise<FinanceActionResult> {
  try {
    const admin = await requireAdmin();

    const payout = await db.payout.findUnique({
      where: { id: payoutId },
      select: { id: true, status: true, businessId: true },
    });

    if (!payout) {
      return { error: "Payout not found." };
    }

    if (payout.status !== "PENDING") {
      return {
        error: `Cannot mark as processing — payout is currently ${payout.status}.`,
      };
    }

    await db.payout.update({
      where: { id: payoutId },
      data: { status: "PROCESSING" },
    });

    await writeFinanceAudit({
      adminId: admin.id,
      action: "SET_PAYOUT_PROCESSING",
      entityId: payoutId,
    });

    revalidatePath("/admin/finance/payouts");
    revalidatePath(`/admin/finance/payouts/${payoutId}`);
    revalidatePath("/admin/audit-log");

    return { success: "Payout moved to processing." };
  } catch (error) {
    console.error("setPayoutProcessing error:", error);
    return { error: "Failed to update payout status." };
  }
}

/**
 * Marks a payout as PAID with a transfer reference.
 * Marks all linked commissions as PAID_OUT.
 * Sends a payout confirmation email to the business owner.
 *
 * @param payoutId - The payout to mark as paid
 * @param reference - The bank/mobile money transfer reference number
 * @param notes - Optional admin notes about the transfer
 * @returns Object with `success` or `error` message
 */
export async function markPayoutPaid(
  payoutId: string,
  reference: string,
  notes?: string
): Promise<FinanceActionResult> {
  try {
    const admin = await requireAdmin();

    const trimmedRef = reference.trim();
    if (!trimmedRef) {
      return { error: "Reference is required to mark a payout as paid." };
    }

    const payout = await db.payout.findUnique({
      where: { id: payoutId },
      include: {
        business: {
          include: {
            owner: { select: { name: true, email: true } },
          },
        },
        _count: { select: { commissions: true } },
      },
    });

    if (!payout) {
      return { error: "Payout not found." };
    }

    if (payout.status === "PAID") {
      return { error: "This payout has already been marked as paid." };
    }

    const trimmedNotes = notes?.trim() || null;

    await db.$transaction([
      db.payout.update({
        where: { id: payoutId },
        data: {
          status: "PAID",
          paidAt: new Date(),
          reference: trimmedRef,
          notes: trimmedNotes,
        },
      }),
      db.commission.updateMany({
        where: { payoutId },
        data: { status: "PAID_OUT" },
      }),
    ]);

    await writeFinanceAudit({
      adminId: admin.id,
      action: "MARK_PAYOUT_PAID",
      entityId: payoutId,
      metadata: {
        reference: trimmedRef,
        businessName: payout.business.name,
        amount: Number(payout.amount),
        period: payout.period,
      },
    });

    revalidatePath("/admin/finance");
    revalidatePath("/admin/finance/commissions");
    revalidatePath("/admin/finance/payouts");
    revalidatePath(`/admin/finance/payouts/${payoutId}`);
    revalidatePath("/admin/audit-log");
    revalidatePath("/dashboard/earnings");

    // Fire-and-forget payout notification email to the business owner
    sendEmail({
      to: payout.business.owner.email,
      subject: `Payout processed — ${formatPrice(Number(payout.amount))} for ${payout.period}`,
      html: await renderPayoutProcessedEmail({
        businessOwnerName: payout.business.owner.name ?? "there",
        businessName: payout.business.name,
        period: payout.period,
        netAmount: formatPrice(Number(payout.amount)),
        grossTotal: formatPrice(Number(payout.grossTotal)),
        commissionTotal: formatPrice(Number(payout.commissionTotal)),
        commissionCount: payout._count.commissions,
        reference: trimmedRef,
        notes: trimmedNotes,
        earningsUrl: `${BASE_URL}/dashboard/earnings`,
      }),
    }).catch((err) => console.error("markPayoutPaid email error:", err));

    return { success: "Payout marked as paid and business owner notified." };
  } catch (error) {
    console.error("markPayoutPaid error:", error);
    return { error: "Failed to mark payout as paid." };
  }
}

/**
 * Marks a payout as FAILED and returns its commissions to PENDING status.
 * Use when a bank/mobile money transfer fails.
 *
 * The returned commissions will be picked up in the next payout
 * generation cycle.
 *
 * @param payoutId - The payout that failed
 * @returns Object with `success` or `error` message
 */
export async function markPayoutFailed(
  payoutId: string
): Promise<FinanceActionResult> {
  try {
    const admin = await requireAdmin();

    const payout = await db.payout.findUnique({
      where: { id: payoutId },
      select: { id: true, status: true, businessId: true, period: true },
    });

    if (!payout) {
      return { error: "Payout not found." };
    }

    if (payout.status === "PAID") {
      return { error: "Cannot mark a completed payout as failed." };
    }

    await db.$transaction([
      db.payout.update({
        where: { id: payoutId },
        data: { status: "FAILED" },
      }),
      // Return commissions to PENDING so they can be included in the next batch
      db.commission.updateMany({
        where: { payoutId },
        data: { status: "PENDING", payoutId: null },
      }),
    ]);

    await writeFinanceAudit({
      adminId: admin.id,
      action: "MARK_PAYOUT_FAILED",
      entityId: payoutId,
      metadata: { period: payout.period },
    });

    revalidatePath("/admin/finance");
    revalidatePath("/admin/finance/commissions");
    revalidatePath("/admin/finance/payouts");
    revalidatePath(`/admin/finance/payouts/${payoutId}`);
    revalidatePath("/admin/audit-log");
    revalidatePath("/dashboard/earnings");

    return {
      success:
        "Payout marked as failed. Commissions returned to pending for next cycle.",
    };
  } catch (error) {
    console.error("markPayoutFailed error:", error);
    return { error: "Failed to mark payout as failed." };
  }
}
