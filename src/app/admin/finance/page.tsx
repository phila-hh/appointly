import Link from "next/link";

import { getFinanceOverview, getPayouts } from "@/lib/actions/finance-queries";

export const metadata = { title: "Finance Overview" };

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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Finance Overview</h2>
        <p className="text-muted-foreground">
          Monitor platform commissions and payouts in one place.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Pending Commissions</p>
          <p className="mt-2 text-2xl font-semibold">
            {overview.pending._count.id.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Pending Gross</p>
          <p className="mt-2 text-2xl font-semibold">
            ETB {pendingGross.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Pending Net Payout</p>
          <p className="mt-2 text-2xl font-semibold">
            ETB {pendingNet.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Platform Commission</p>
          <p className="mt-2 text-2xl font-semibold">
            ETB {totalCommission.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Payout Pipeline</h3>
          <div className="mt-3 space-y-2 text-sm">
            {overview.payoutStats.map((stat) => (
              <p key={stat.status}>
                {stat.status}:{" "}
                <span className="font-medium">{stat._count.id.toLocaleString()}</span>
              </p>
            ))}
            {overview.payoutStats.length === 0 && (
              <p className="text-muted-foreground">No payouts yet.</p>
            )}
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Quick Actions</h3>
          <div className="mt-3 flex gap-2">
            <Link
              href="/admin/finance/commissions"
              className="rounded-md border px-3 py-2 text-sm hover:bg-muted"
            >
              View commissions
            </Link>
            <Link
              href="/admin/finance/payouts"
              className="rounded-md border px-3 py-2 text-sm hover:bg-muted"
            >
              Manage payouts
            </Link>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Pending commission total: ETB {pendingCommission.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="border-b p-4">
          <h3 className="font-semibold">Recent Payouts</h3>
        </div>
        <div className="divide-y">
          {recentPayouts.slice(0, 8).map((payout) => (
            <div key={payout.id} className="flex items-center justify-between p-4 text-sm">
              <div>
                <p className="font-medium">{payout.business.name}</p>
                <p className="text-xs text-muted-foreground">
                  {payout.period} • {payout.status}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">ETB {Number(payout.amount).toLocaleString()}</p>
                <Link
                  href={`/admin/finance/payouts/${payout.id}`}
                  className="text-xs text-primary hover:underline"
                >
                  View details
                </Link>
              </div>
            </div>
          ))}
          {recentPayouts.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground">No payouts generated yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
