/**
 * @file Admin Overview Page
 * @description Platform-wide KPI dashboard for administrators.
 *
 * Features:
 *   - Platform KPI cards (total users, businesses, bookings, gross revenue)
 *   - Financial summary (pending commissions, total platform earnings)
 *   - Recent audit log activity feed
 *   - Quick navigation to key admin sections
 *
 * URL: /admin/overview
 */

import Link from "next/link";
import { format } from "date-fns";
import {
  Users,
  Building2,
  CalendarDays,
  TrendingUp,
  HandCoins,
  Clock,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

import { requireAdmin } from "@/lib/guards";
import db from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { KPICard } from "@/components/shared/kpi-card";
import { StatsGrid } from "@/components/shared/stats-grid";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Overview" };

export default async function AdminOverviewPage() {
  await requireAdmin();

  // Fetch all overview data in parallel
  const [
    totalUsers,
    activeUsers,
    totalBusinesses,
    activeBusinesses,
    totalBookings,
    completedBookings,
    grossRevenue,
    pendingCommissions,
    recentAuditLogs,
    settings,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { emailVerified: { not: null } } }),
    db.business.count(),
    db.business.count({ where: { isActive: true } }),
    db.booking.count(),
    db.booking.count({ where: { status: "COMPLETED" } }),
    db.payment.aggregate({
      _sum: { amount: true },
      where: { status: "SUCCEEDED" },
    }),
    db.commission.aggregate({
      where: { status: "PENDING" },
      _sum: { commissionAmount: true },
      _count: { id: true },
    }),
    db.adminAuditLog.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        admin: { select: { name: true } },
      },
    }),
    db.platformSettings.findFirst(),
  ]);

  const grossRevenueAmount = Number(grossRevenue._sum.amount ?? 0);
  const pendingCommissionAmount = Number(
    pendingCommissions._sum.commissionAmount ?? 0
  );

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Platform Overview</h2>
        <p className="text-muted-foreground">
          Real-time metrics and platform health at a glance.
        </p>
      </div>

      {/* KPI Cards */}
      <StatsGrid columns={4}>
        <KPICard
          title="Total Users"
          value={totalUsers.toLocaleString()}
          description={`${activeUsers.toLocaleString()} active`}
          icon={Users}
        />
        <KPICard
          title="Total Businesses"
          value={totalBusinesses.toLocaleString()}
          description={`${activeBusinesses.toLocaleString()} active`}
          icon={Building2}
        />
        <KPICard
          title="Total Bookings"
          value={totalBookings.toLocaleString()}
          description={`${completedBookings.toLocaleString()} completed`}
          icon={CalendarDays}
        />
        <KPICard
          title="Gross Revenue"
          value={formatPrice(grossRevenueAmount)}
          description="All time"
          icon={TrendingUp}
        />
      </StatsGrid>

      {/* Secondary metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Finance summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HandCoins className="h-4 w-4" />
              Finance Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Pending Commissions
                </p>
                <p className="text-xl font-bold">
                  {pendingCommissions._count.id.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  Commission Value
                </p>
                <p className="text-xl font-bold text-primary">
                  {formatPrice(pendingCommissionAmount)}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Commission Rate</span>
              <Badge variant="outline">
                {Math.round((settings?.defaultCommissionRate ?? 0.1) * 100)}%
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Payout Schedule</span>
              <Badge variant="outline">
                {settings?.payoutSchedule ?? "MONTHLY"}
              </Badge>
            </div>

            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/admin/finance">
                View Finance Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent audit activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4" />
              Recent Admin Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {recentAuditLogs.length > 0 ? (
              <>
                {recentAuditLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 py-2">
                    <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {log.action.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {log.admin.name ?? "Admin"} ·{" "}
                        {format(log.createdAt, "MMM d, h:mm a")}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {log.entityType}
                    </Badge>
                  </div>
                ))}
                <Separator className="my-2" />
                <Button variant="ghost" size="sm" className="w-full" asChild>
                  <Link href="/admin/audit-log">
                    View full audit log
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No admin actions recorded yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Manage Users",
                href: "/admin/users",
                description: `${totalUsers.toLocaleString()} users`,
                icon: Users,
              },
              {
                label: "Manage Businesses",
                href: "/admin/businesses",
                description: `${totalBusinesses.toLocaleString()} businesses`,
                icon: Building2,
              },
              {
                label: "Review Moderation",
                href: "/admin/reviews",
                description: "Flag & remove content",
                icon: ShieldCheck,
              },
              {
                label: "Generate Payouts",
                href: "/admin/finance/payouts",
                description: `${pendingCommissions._count.id} pending`,
                icon: HandCoins,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-accent"
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
