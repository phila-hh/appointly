import { ShieldCheck } from "lucide-react";

import db from "@/lib/db";

export default async function AdminOverviewPage() {
  const [totalUsers, totalBusinesses, totalBookings, totalRevenue, settings] =
    await Promise.all([
      db.user.count(),
      db.business.count(),
      db.booking.count(),
      db.payment.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          status: "SUCCEEDED",
        },
      }),
      db.platformSettings.findFirst(),
    ]);

  const kpis = [
    { label: "Total Users", value: totalUsers.toLocaleString() },
    { label: "Total Businesses", value: totalBusinesses.toLocaleString() },
    { label: "Total Bookings", value: totalBookings.toLocaleString() },
    {
      label: "Gross Revenue",
      value: `ETB ${Number(totalRevenue._sum.amount ?? 0).toLocaleString()}`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold tracking-tight">Platform Overview</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">{kpi.label}</p>
            <p className="mt-2 text-2xl font-semibold">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Platform Settings
        </h3>
        <div className="mt-3 space-y-1 text-sm">
          <p>
            Default Commission Rate:{" "}
            <span className="font-medium">
              {Math.round((settings?.defaultCommissionRate ?? 0.1) * 100)}%
            </span>
          </p>
          <p>
            Payout Schedule:{" "}
            <span className="font-medium">
              {settings?.payoutSchedule ?? "MONTHLY"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
