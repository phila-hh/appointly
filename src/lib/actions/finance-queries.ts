import { notFound } from "next/navigation";

import db from "@/lib/db";
import { requireAdmin } from "@/lib/guards";
import { requireBusiness } from "@/lib/actions/business-queries";

export async function getFinanceOverview() {
  await requireAdmin();

  const [pendingCommissions, payoutStats, totals] = await Promise.all([
    db.commission.aggregate({
      where: { status: "PENDING" },
      _sum: {
        grossAmount: true,
        commissionAmount: true,
        netAmount: true,
      },
      _count: { id: true },
    }),
    db.payout.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    db.commission.aggregate({
      _sum: {
        grossAmount: true,
        commissionAmount: true,
        netAmount: true,
      },
      _count: { id: true },
    }),
  ]);

  return {
    pending: pendingCommissions,
    payoutStats,
    totals,
  };
}

export async function getCommissions(filters?: {
  status?: "PENDING" | "INCLUDED_IN_PAYOUT" | "PAID_OUT";
  businessId?: string;
  period?: string;
}) {
  await requireAdmin();

  return db.commission.findMany({
    where: {
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.businessId ? { businessId: filters.businessId } : {}),
      ...(filters?.period
        ? { OR: [{ payout: { period: filters.period } }, { payoutId: null }] }
        : {}),
    },
    include: {
      business: { select: { id: true, name: true } },
      booking: { select: { id: true, date: true, startTime: true, status: true } },
      payout: { select: { id: true, period: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPayouts(filters?: {
  status?: "PENDING" | "PROCESSING" | "PAID" | "FAILED";
  period?: string;
}) {
  await requireAdmin();

  return db.payout.findMany({
    where: {
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.period ? { period: filters.period } : {}),
    },
    include: {
      business: {
        select: { id: true, name: true, owner: { select: { email: true, name: true } } },
      },
      _count: {
        select: { commissions: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPayoutDetail(payoutId: string) {
  await requireAdmin();

  const payout = await db.payout.findUnique({
    where: { id: payoutId },
    include: {
      business: {
        include: {
          owner: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      commissions: {
        include: {
          booking: {
            select: { id: true, date: true, startTime: true, status: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!payout) notFound();
  return payout;
}

export async function getBusinessEarnings() {
  const business = await requireBusiness();

  const [pending, paid, commissions, payouts] = await Promise.all([
    db.commission.aggregate({
      where: { businessId: business.id, status: "PENDING" },
      _sum: { netAmount: true, grossAmount: true, commissionAmount: true },
      _count: { id: true },
    }),
    db.commission.aggregate({
      where: { businessId: business.id, status: "PAID_OUT" },
      _sum: { netAmount: true, grossAmount: true, commissionAmount: true },
      _count: { id: true },
    }),
    db.commission.findMany({
      where: { businessId: business.id },
      include: {
        booking: { select: { id: true, date: true, startTime: true, status: true } },
        payout: { select: { id: true, period: true, status: true, paidAt: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.payout.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
      take: 24,
    }),
  ]);

  return { business, pending, paid, commissions, payouts };
}
