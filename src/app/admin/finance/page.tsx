/**
 * @file Admin Finance Overview Page
 * @description Platform financial health dashboard.
 *
 * Features:
 *   - KPI cards: pending commissions, pending net payout, platform earnings
 *   - Payout pipeline status breakdown (PENDING / PROCESSING / PAID / FAILED)
 *   - Recent payouts list with quick links
 *   - Quick action navigation to commissions and payouts pages
 *
 * URL: /admin/finance
 */

import Link from "next/link";
import { format } from "date-fns";
import { HandCoins, TrendingUp, Clock, ArrowRight } from "lucide-react";

import { getFinanceOverview, getPayouts } from "@/lib/actions/finance-queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { KPICard } from "@/components/shared/kpi-card";
import { StatsGrid } from "@/components/shared/stats-grid";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Finance" };

/**
 * Badge variant config for payout status labels.
 */
const PAYOUT_STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  PENDING: { label: "Pending", variant: "secondary" },
  PROCESSING: { label: "Processing", variant: "outline" },
  PAID: { label: "Paid", variant: "default" },
  FAILED: { label: "Failed", variant: "destructive" },
};

export default async function AdminFinanceOverviewPage() {
  const [overview, recentPayouts] = await Promise.all([
    getFinanceOverview(),
    getPayouts(),
  ]);

  const pendingGross = Number(overview.pending._sum.grossAmount ?? 0);
  const pendingCommission = Number(overview.pending._sum.commissionAmount ?? 0);
  const pendingNet = Number(overview.pending._sum.netAmount ?? 0);
  const totalCommission = Number(overview.totals._sum.commissionAmount ?? 0);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Finance Overview</h2>
        <p className="text-muted-foreground">
          Monitor platform commissions, payout pipeline, and financial health.
        </p>
      </div>

      {/* KPI cards */}
      <StatsGrid columns={4}>
        <KPICard
          title="Pending Commissions"
          value={overview.pending._count.id.toLocaleString()}
          description="Awaiting payout generation"
          icon={Clock}
        />
        <KPICard
          title="Pending Gross"
          value={formatPrice(pendingGross)}
          description="Customer payments"
          icon={TrendingUp}
        />
        <KPICard
          title="Pending Net Payout"
          value={formatPrice(pendingNet)}
          description="To pay businesses"
          icon={HandCoins}
        />
        <KPICard
          title="Platform Earnings"
          value={formatPrice(totalCommission)}
          description="All-time commission"
          icon={TrendingUp}
        />
      </StatsGrid>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Payout pipeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payout Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overview.payoutStats.length > 0 ? (
              <>
                {overview.payoutStats.map((stat) => {
                  const config =
                    PAYOUT_STATUS_CONFIG[stat.status] ??
                    PAYOUT_STATUS_CONFIG.PENDING;
                  return (
                    <div
                      key={stat.status}
                      className="flex items-center justify-between"
                    >
                      <Badge variant={config.variant}>{config.label}</Badge>
                      <span className="text-sm font-medium">
                        {stat._count.id.toLocaleString()}{" "}
                        {stat._count.id === 1 ? "payout" : "payouts"}
                      </span>
                    </div>
                  );
                })}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No payouts generated yet.
              </p>
            )}

            <Separator />

            <p className="text-xs text-muted-foreground">
              Pending commission value:{" "}
              <span className="font-medium text-foreground">
                {formatPrice(pendingCommission)}
              </span>
            </p>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/admin/finance/commissions"
              className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
            >
              <div>
                <p className="text-sm font-medium">View Commissions</p>
                <p className="text-xs text-muted-foreground">
                  {overview.pending._count.id} pending commission
                  {overview.pending._count.id !== 1 ? "s" : ""}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>

            <Link
              href="/admin/finance/payouts"
              className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
            >
              <div>
                <p className="text-sm font-medium">Manage Payouts</p>
                <p className="text-xs text-muted-foreground">
                  Generate and process business payouts
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent payouts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Payouts</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/finance/payouts">
              View all
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {recentPayouts.length > 0 ? (
            <div className="divide-y">
              {recentPayouts.slice(0, 8).map((payout) => {
                const config =
                  PAYOUT_STATUS_CONFIG[payout.status] ??
                  PAYOUT_STATUS_CONFIG.PENDING;

                return (
                  <div
                    key={payout.id}
                    className="flex items-center justify-between px-6 py-4"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">
                        {payout.business.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                          {payout.period}
                        </p>
                        <Badge variant={config.variant} className="text-xs">
                          {config.label}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {formatPrice(Number(payout.amount))}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(payout.createdAt, "MMM d, yyyy")}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/finance/payouts/${payout.id}`}>
                          Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No payouts generated yet. Generate your first payout batch from
                the{" "}
                <Link
                  href="/admin/finance/payouts"
                  className="text-primary hover:underline"
                >
                  payouts page
                </Link>
                .
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
