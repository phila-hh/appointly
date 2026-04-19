// src/lib/actions/finance-queries.ts

/**
 * @file Finance Query Functions
 * @description Server-side data fetching for the admin finance panel
 * and the business owner earnings dashboard.
 *
 * These are NOT server actions (they don't mutate data).
 * They are plain async functions called from Server Components.
 *
 * Two access levels:
 *   - Admin queries (requireAdmin): getFinanceOverview, getCommissions,
 *     getPayouts, getPayoutDetail
 *   - Business owner queries (requireBusiness): getBusinessEarnings
 *
 * Separated from finance.ts (mutations) to maintain the clear
 * query / mutation distinction used throughout the project.
 *
 * Provides:
 *   - Platform-wide financial KPIs (overview dashboard)
 *   - Commission records with filtering (admin commissions page)
 *   - Payout batches with filtering (admin payouts page)
 *   - Single payout detail with line items (admin payout detail page)
 *   - Business earnings summary and payout history (dashboard earnings page)
 */

import { notFound } from "next/navigation";

import db from "@/lib/db";
import { requireAdmin } from "@/lib/guards";
import { requireBusiness } from "@/lib/actions/business-queries";

// =============================================================================
// Admin Finance Queries
// =============================================================================

/**
 * Fetches platform-wide financial KPI data for the admin finance overview.
 *
 * Returns three datasets in parallel:
 *   - Pending commissions aggregate (count + gross/commission/net sums)
 *   - Payout status breakdown (count per status for the pipeline card)
 *   - All-time commission totals (lifetime platform earnings)
 *
 * @returns Financial overview object with pending, payoutStats, and totals
 */
export async function getFinanceOverview() {
  await requireAdmin();

  const [pendingCommissions, payoutStats, totals] = await Promise.all([
    // Aggregate all PENDING commissions — the "money waiting to be paid out"
    db.commission.aggregate({
      where: { status: "PENDING" },
      _sum: {
        grossAmount: true,
        commissionAmount: true,
        netAmount: true,
      },
      _count: { id: true },
    }),

    // Group payouts by status for the pipeline visualization
    db.payout.groupBy({
      by: ["status"],
      _count: { id: true },
    }),

    // All-time totals across all commission statuses
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

/**
 * Fetches commission records with optional status, business, and period
 * filtering for the admin commissions page.
 *
 * Supports:
 *   - Status filter (PENDING, INCLUDED_IN_PAYOUT, PAID_OUT)
 *   - Business ID filter (narrow to a single business's commissions)
 *   - Period filter — matches commissions whose payout has the given period,
 *     OR commissions with no payout yet (payoutId = null) when filtering
 *     by period is applied. This allows viewing "what was pending for June"
 *     alongside "what got paid in June".
 *
 * Includes:
 *   - Business name for display
 *   - Booking date, time, and status
 *   - Linked payout period and status (if included in a payout)
 *
 * @param filters - Optional status, businessId, and period filters
 * @returns Array of commission records ordered by creation date (newest first)
 */
export async function getCommissions(filters?: {
  status?: "PENDING" | "INCLUDED_IN_PAYOUT" | "PAID_OUT";
  businessId?: string;
  period?: string;
}) {
  await requireAdmin();

  // Normalize enum filters — "ALL" from Select components means no filter
  const statusFilter =
    filters?.status && filters.status !== ("ALL" as string)
      ? { status: filters.status }
      : {};

  const businessFilter = filters?.businessId
    ? { businessId: filters.businessId }
    : {};

  // Period filter: match commissions linked to a payout for that period
  const periodFilter =
    filters?.period && filters.period.trim()
      ? {
          payout: { period: filters.period.trim() },
        }
      : {};

  return db.commission.findMany({
    where: {
      ...statusFilter,
      ...businessFilter,
      ...periodFilter,
    },
    include: {
      business: {
        select: { id: true, name: true },
      },
      booking: {
        select: { id: true, date: true, startTime: true, status: true },
      },
      payout: {
        select: { id: true, period: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Fetches payout batches with optional status and period filtering
 * for the admin payouts list page.
 *
 * Supports:
 *   - Status filter (PENDING, PROCESSING, PAID, FAILED)
 *   - Period filter (exact match against the YYYY-MM period string)
 *
 * Includes:
 *   - Business name and owner email for display in the table
 *   - Commission count per payout (shown in the "Items" column)
 *
 * @param filters - Optional status and period filters
 * @returns Array of payout records ordered by creation date (newest first)
 */
export async function getPayouts(filters?: {
  status?: "PENDING" | "PROCESSING" | "PAID" | "FAILED";
  period?: string;
}) {
  await requireAdmin();

  // Normalize enum filter — "ALL" from Select means no filter
  const statusFilter =
    filters?.status && filters.status !== ("ALL" as string)
      ? { status: filters.status }
      : {};

  const periodFilter =
    filters?.period && filters.period.trim()
      ? { period: filters.period.trim() }
      : {};

  return db.payout.findMany({
    where: {
      ...statusFilter,
      ...periodFilter,
    },
    include: {
      business: {
        select: {
          id: true,
          name: true,
          owner: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      _count: {
        select: { commissions: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Fetches a single payout by ID with full detail for the admin
 * payout detail page.
 *
 * Includes:
 *   - Business info with owner (name, email — for the action email)
 *   - All commission line items with their linked booking info
 *   - Payout metadata (reference, notes, paidAt)
 *
 * Calls notFound() if the payout does not exist, triggering Next.js's
 * 404 page automatically.
 *
 * @param payoutId - The payout's ID
 * @returns Full payout record with business, owner, and commissions
 */
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

// =============================================================================
// Business Owner Earnings Queries
// =============================================================================

/**
 * Fetches earnings data for the current business owner's dashboard.
 *
 * Runs four queries in parallel:
 *   1. Pending aggregate — commissions not yet in a payout batch
 *   2. Paid aggregate — commissions that have been paid out
 *   3. Recent commissions — up to 100 records with booking and payout info
 *   4. Payout history — up to 24 most recent payout batches
 *
 * The "pending" and "paid" aggregates power the KPI summary cards.
 * The commissions list powers the per-booking breakdown table.
 * The payouts list powers the payout history table.
 *
 * Note: INCLUDED_IN_PAYOUT commissions (in a batch but not yet paid)
 * are intentionally excluded from both pending and paid aggregates —
 * they appear in the commissions list with their own status badge.
 *
 * @returns Earnings object with business, pending, paid, commissions, payouts
 */
export async function getBusinessEarnings() {
  // requireBusiness handles both authentication and business existence check.
  // Redirects to /sign-in if not authenticated, /dashboard/setup if no business.
  const business = await requireBusiness();

  const [pending, paid, inPayout, commissions, payouts] = await Promise.all([
    // Commissions not yet assigned to any payout batch
    db.commission.aggregate({
      where: { businessId: business.id, status: "PENDING" },
      _sum: {
        netAmount: true,
        grossAmount: true,
        commissionAmount: true,
      },
      _count: { id: true },
    }),

    // Commissions that have been fully paid out
    db.commission.aggregate({
      where: { businessId: business.id, status: "PAID_OUT" },
      _sum: {
        netAmount: true,
        grossAmount: true,
        commissionAmount: true,
      },
      _count: { id: true },
    }),

    // Commissions currently in a payout batch (processing or pending payment)
    db.commission.aggregate({
      where: { businessId: business.id, status: "INCLUDED_IN_PAYOUT" },
      _sum: {
        netAmount: true,
        grossAmount: true,
        commissionAmount: true,
      },
      _count: { id: true },
    }),

    // Recent commission line items for the per-booking breakdown table
    db.commission.findMany({
      where: { businessId: business.id },
      include: {
        booking: {
          select: { id: true, date: true, startTime: true, status: true },
        },
        payout: {
          select: { id: true, period: true, status: true, paidAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100, // Limit to 100 most recent for performance
    }),

    // Payout history for the payout history table
    db.payout.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
      take: 24, // Limit to 24 months (2 years) of history
    }),
  ]);

  return {
    business,
    pending,
    paid,
    inPayout,
    commissions,
    payouts,
  };
}
