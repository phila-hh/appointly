/**
 * @file Dashboard Earnings Page
 * @description Business owner view of commission records and payout history.
 *
 * Features:
 *   - KPI cards: pending balance, paid out, lifetime gross earnings
 *   - Commission breakdown per booking with status badges
 *   - Payout history with reference and date
 *   - Clear empty states for both sections
 *   - Explanation of the commission model for business owners
 *
 * URL: /dashboard/earnings
 */

import { format } from "date-fns";
import {
  Wallet,
  TrendingUp,
  Clock,
  Receipt,
  HandCoins,
  CheckCircle2,
} from "lucide-react";

import { requireBusiness } from "@/lib/actions/business-queries";
import { getBusinessEarnings } from "@/lib/actions/finance-queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KPICard } from "@/components/shared/kpi-card";
import { StatsGrid } from "@/components/shared/stats-grid";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Earnings" };

/**
 * Badge config for commission status labels visible to the business owner.
 * Uses simplified, customer-friendly labels (not internal enum names).
 */
const COMMISSION_STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "outline";
    className?: string;
  }
> = {
  PENDING: {
    label: "Pending Payout",
    variant: "secondary",
  },
  INCLUDED_IN_PAYOUT: {
    label: "In Payout Batch",
    variant: "outline",
    className:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300",
  },
  PAID_OUT: {
    label: "Paid Out",
    variant: "default",
    className:
      "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300",
  },
};

const PAYOUT_STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    className?: string;
  }
> = {
  PENDING: { label: "Pending", variant: "secondary" },
  PROCESSING: {
    label: "Processing",
    variant: "outline",
    className:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300",
  },
  PAID: {
    label: "Paid",
    variant: "default",
    className:
      "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300",
  },
  FAILED: { label: "Failed", variant: "destructive" },
};

export default async function DashboardEarningsPage() {
  await requireBusiness();
  const data = await getBusinessEarnings();

  // Calculate summary figures
  const pendingBalance = Number(data.pending._sum.netAmount ?? 0);
  const paidOut = Number(data.paid._sum.netAmount ?? 0);
  const lifetimeGross =
    Number(data.pending._sum.grossAmount ?? 0) +
    Number(data.paid._sum.grossAmount ?? 0);
  const totalCommissions =
    Number(data.pending._sum.commissionAmount ?? 0) +
    Number(data.paid._sum.commissionAmount ?? 0);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Earnings</h2>
        <p className="text-muted-foreground">
          Track your commission breakdown, pending balance, and payout history.
        </p>
      </div>

      {/* Summary KPI cards */}
      <StatsGrid columns={3}>
        <KPICard
          title="Pending Balance"
          value={formatPrice(pendingBalance)}
          description={`${data.pending._count.id} commission${data.pending._count.id !== 1 ? "s" : ""} awaiting payout`}
          icon={Clock}
        />
        <KPICard
          title="Total Paid Out"
          value={formatPrice(paidOut)}
          description={`${data.paid._count.id} payment${data.paid._count.id !== 1 ? "s" : ""} received`}
          icon={CheckCircle2}
        />
        <KPICard
          title="Lifetime Gross Revenue"
          value={formatPrice(lifetimeGross)}
          description="Before platform commission"
          icon={TrendingUp}
        />
      </StatsGrid>

      {/* Commission model explanation */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <HandCoins className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
            <div className="space-y-1">
              <p className="text-sm font-medium">How Earnings Work</p>
              <p className="text-sm text-muted-foreground">
                Appointly deducts a small platform commission from each
                completed booking payment. The remainder is your net earnings.
                Payouts are generated periodically and transferred to your
                registered account.
              </p>
              {totalCommissions > 0 && (
                <p className="text-xs text-muted-foreground pt-1">
                  Total platform commission deducted:{" "}
                  <span className="font-medium text-foreground">
                    {formatPrice(totalCommissions)}
                  </span>
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commission breakdown table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-4 w-4" />
            Commission Breakdown per Booking
          </CardTitle>
        </CardHeader>
        {data.commissions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead className="text-right">Your Earnings</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.commissions.map((row) => {
                const statusConfig =
                  COMMISSION_STATUS_CONFIG[row.status] ??
                  COMMISSION_STATUS_CONFIG.PENDING;

                return (
                  <TableRow key={row.id}>
                    {/* Date */}
                    <TableCell>
                      <p className="text-sm">
                        {format(row.booking.date, "MMM d, yyyy")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {row.booking.startTime}
                      </p>
                    </TableCell>

                    {/* Gross */}
                    <TableCell className="text-right text-sm">
                      {formatPrice(Number(row.grossAmount))}
                    </TableCell>

                    {/* Commission */}
                    <TableCell className="text-right">
                      <p className="text-sm text-muted-foreground">
                        − {formatPrice(Number(row.commissionAmount))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(row.commissionRate * 100).toFixed(1)}%
                      </p>
                    </TableCell>

                    {/* Net earnings */}
                    <TableCell className="text-right text-sm font-semibold">
                      {formatPrice(Number(row.netAmount))}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge
                        variant={statusConfig.variant}
                        className={`text-xs ${statusConfig.className ?? ""}`}
                      >
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Receipt className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">No earnings yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Commission records are created when customers complete payment
                for their bookings.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Payout history table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-4 w-4" />
            Payout History
          </CardTitle>
        </CardHeader>
        {data.payouts.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead className="text-right">Net Payout</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Paid At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.payouts.map((payout) => {
                const statusConfig =
                  PAYOUT_STATUS_CONFIG[payout.status] ??
                  PAYOUT_STATUS_CONFIG.PENDING;

                return (
                  <TableRow key={payout.id}>
                    {/* Period */}
                    <TableCell className="text-sm font-medium">
                      {payout.period}
                    </TableCell>

                    {/* Gross */}
                    <TableCell className="text-right text-sm">
                      {formatPrice(Number(payout.grossTotal))}
                    </TableCell>

                    {/* Commission */}
                    <TableCell className="text-right text-sm text-muted-foreground">
                      − {formatPrice(Number(payout.commissionTotal))}
                    </TableCell>

                    {/* Net payout */}
                    <TableCell className="text-right text-sm font-semibold">
                      {formatPrice(Number(payout.amount))}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge
                        variant={statusConfig.variant}
                        className={`text-xs ${statusConfig.className ?? ""}`}
                      >
                        {statusConfig.label}
                      </Badge>
                    </TableCell>

                    {/* Reference */}
                    <TableCell className="text-xs">
                      {payout.reference ? (
                        <span className="font-mono">{payout.reference}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Paid at */}
                    <TableCell className="text-xs text-muted-foreground">
                      {payout.paidAt
                        ? format(payout.paidAt, "MMM d, yyyy")
                        : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Wallet className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">No payouts yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Payouts are generated by the Appointly team and transferred to
                your account periodically.
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
