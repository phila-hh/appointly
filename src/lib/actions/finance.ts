"use server";

import { revalidatePath } from "next/cache";

import { Prisma } from "@/generated/prisma/client";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/guards";

type FinanceActionResult = {
  success?: string;
  error?: string;
};

function roundCurrency(value: number): number {
  return Number(value.toFixed(2));
}

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

export async function generatePayoutsForPeriod(
  period: string
): Promise<FinanceActionResult> {
  try {
    const admin = await requireAdmin();
    const selectedPeriod = period.trim();
    if (!selectedPeriod) return { error: "Payout period is required." };

    const pending = await db.commission.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
    });

    if (pending.length === 0) {
      return {
        error: "No pending commissions available for payout generation.",
      };
    }

    const grouped = new Map<string, typeof pending>();
    for (const row of pending) {
      const existing = grouped.get(row.businessId) ?? [];
      existing.push(row);
      grouped.set(row.businessId, existing);
    }

    await db.$transaction(async (tx) => {
      for (const [businessId, commissions] of grouped.entries()) {
        const grossTotal = roundCurrency(
          commissions.reduce((sum, item) => sum + Number(item.grossAmount), 0)
        );
        const commissionTotal = roundCurrency(
          commissions.reduce(
            (sum, item) => sum + Number(item.commissionAmount),
            0
          )
        );
        const amount = roundCurrency(
          commissions.reduce((sum, item) => sum + Number(item.netAmount), 0)
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
          where: {
            id: { in: commissions.map((c) => c.id) },
          },
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
      metadata: { period: selectedPeriod, groupedBusinesses: grouped.size },
    });

    revalidatePath("/admin/finance");
    revalidatePath("/admin/finance/commissions");
    revalidatePath("/admin/finance/payouts");
    revalidatePath("/admin/audit-log");
    revalidatePath("/dashboard/earnings");
    return { success: "Payout batches generated successfully." };
  } catch (error) {
    console.error("generatePayoutsForPeriod error:", error);
    return { error: "Failed to generate payout batches." };
  }
}

export async function setPayoutProcessing(
  payoutId: string
): Promise<FinanceActionResult> {
  try {
    const admin = await requireAdmin();
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

export async function markPayoutPaid(
  payoutId: string,
  formData: FormData
): Promise<FinanceActionResult> {
  try {
    const admin = await requireAdmin();
    const reference = String(formData.get("reference") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();

    if (!reference) {
      return { error: "Reference is required to mark payout as paid." };
    }

    const payout = await db.payout.findUnique({
      where: { id: payoutId },
      select: { id: true },
    });
    if (!payout) return { error: "Payout not found." };

    await db.$transaction([
      db.payout.update({
        where: { id: payoutId },
        data: {
          status: "PAID",
          paidAt: new Date(),
          reference,
          notes: notes || null,
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
      metadata: { reference, hasNotes: !!notes },
    });

    revalidatePath("/admin/finance");
    revalidatePath("/admin/finance/commissions");
    revalidatePath("/admin/finance/payouts");
    revalidatePath(`/admin/finance/payouts/${payoutId}`);
    revalidatePath("/admin/audit-log");
    revalidatePath("/dashboard/earnings");
    return { success: "Payout marked as paid." };
  } catch (error) {
    console.error("markPayoutPaid error:", error);
    return { error: "Failed to mark payout as paid." };
  }
}

export async function markPayoutFailed(
  payoutId: string
): Promise<FinanceActionResult> {
  try {
    const admin = await requireAdmin();

    await db.$transaction([
      db.payout.update({
        where: { id: payoutId },
        data: { status: "FAILED" },
      }),
      db.commission.updateMany({
        where: { payoutId },
        data: { status: "PENDING", payoutId: null },
      }),
    ]);

    await writeFinanceAudit({
      adminId: admin.id,
      action: "MARK_PAYOUT_FAILED",
      entityId: payoutId,
    });

    revalidatePath("/admin/finance");
    revalidatePath("/admin/finance/commissions");
    revalidatePath("/admin/finance/payouts");
    revalidatePath(`/admin/finance/payouts/${payoutId}`);
    revalidatePath("/admin/audit-log");
    revalidatePath("/dashboard/earnings");
    return {
      success: "Payout marked failed and commissions returned to pending.",
    };
  } catch (error) {
    console.error("markPayoutFailed error:", error);
    return { error: "Failed to mark payout as failed." };
  }
}
