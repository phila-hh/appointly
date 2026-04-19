/**
 * @file Seed payouts — monthly payout batches per business.
 *
 * Groups PAID_OUT and INCLUDED_IN_PAYOUT commissions into payout batches.
 * Creates realistic payout history for demo businesses.
 */

import { getPrisma, etb } from "./helpers";
import type { SeededCommission } from "./commissions";

export async function seedPayouts(
  commissions: SeededCommission[]
): Promise<void> {
  const prisma = getPrisma();
  console.log("📤 Creating payouts...");

  // Group commissions by businessId + status
  const paidOut = commissions.filter((c) => c.status === "PAID_OUT");
  const inPayout = commissions.filter((c) => c.status === "INCLUDED_IN_PAYOUT");

  // Helper: group commissions by businessId
  const groupByBiz = (list: SeededCommission[]) => {
    const map = new Map<string, SeededCommission[]>();
    for (const c of list) {
      if (!map.has(c.businessId)) map.set(c.businessId, []);
      map.get(c.businessId)!.push(c);
    }
    return map;
  };

  let payoutCount = 0;

  // ── PAID_OUT commissions → PAID payouts ───────────────────────────────────
  const paidByBiz = groupByBiz(paidOut);
  for (const [bizId, comms] of paidByBiz) {
    // Split into ~monthly batches (every 20 commissions = 1 payout for demo)
    const chunkSize = 15;
    const months = [
      "2025-07",
      "2025-08",
      "2025-09",
      "2025-10",
      "2025-11",
      "2025-12",
    ];

    for (let ci = 0; ci < comms.length; ci += chunkSize) {
      const chunk = comms.slice(ci, ci + chunkSize);
      const grossTotal = etb(chunk.reduce((s, c) => s + c.grossAmount, 0));
      const commTotal = etb(chunk.reduce((s, c) => s + c.commissionAmount, 0));
      const netTotal = etb(grossTotal - commTotal);
      const period = months[Math.floor(ci / chunkSize) % months.length];

      try {
        const payout = await prisma.payout.create({
          data: {
            businessId: bizId,
            grossTotal,
            commissionTotal: commTotal,
            amount: netTotal,
            period,
            status: "PAID",
            paidAt: new Date(`${period}-28T10:00:00Z`),
            reference: `PAY-${bizId.slice(0, 6).toUpperCase()}-${period}`,
            notes: `Monthly payout for ${period}`,
          },
        });

        // Link commissions to payout
        await prisma.commission.updateMany({
          where: { id: { in: chunk.map((c) => c.id) } },
          data: { payoutId: payout.id },
        });
        payoutCount++;
      } catch {
        // skip
      }
    }
  }

  // ── INCLUDED_IN_PAYOUT commissions → PROCESSING payouts ──────────────────
  const inByBiz = groupByBiz(inPayout);
  for (const [bizId, comms] of inByBiz) {
    const grossTotal = etb(comms.reduce((s, c) => s + c.grossAmount, 0));
    const commTotal = etb(comms.reduce((s, c) => s + c.commissionAmount, 0));
    const netTotal = etb(grossTotal - commTotal);

    try {
      const payout = await prisma.payout.create({
        data: {
          businessId: bizId,
          grossTotal,
          commissionTotal: commTotal,
          amount: netTotal,
          period: "2026-01",
          status: "PROCESSING",
          reference: `PAY-${bizId.slice(0, 6).toUpperCase()}-2026-01`,
          notes: "Q1 2026 payout currently processing",
        },
      });

      await prisma.commission.updateMany({
        where: { id: { in: comms.map((c) => c.id) } },
        data: { payoutId: payout.id },
      });
      payoutCount++;
    } catch {
      // skip
    }
  }

  // ── One FAILED payout for edge case coverage ──────────────────────────────
  const firstBizId = [...paidByBiz.keys()][0];
  if (firstBizId) {
    try {
      await prisma.payout.create({
        data: {
          businessId: firstBizId,
          grossTotal: 5000,
          commissionTotal: 500,
          amount: 4500,
          period: "2025-09",
          status: "FAILED",
          notes: "Bank transfer failed — incorrect account number. Retrying.",
        },
      });
      payoutCount++;
    } catch {
      // skip
    }
  }

  console.log(`✅ Created ${payoutCount} payouts.\n`);
}
