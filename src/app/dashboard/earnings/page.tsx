import { format } from "date-fns";

import { getBusinessEarnings } from "@/lib/actions/finance-queries";

export const metadata = { title: "Earnings" };

export default async function DashboardEarningsPage() {
  const data = await getBusinessEarnings();

  const pendingBalance = Number(data.pending._sum.netAmount ?? 0);
  const paidOut = Number(data.paid._sum.netAmount ?? 0);
  const lifetimeGross =
    Number(data.pending._sum.grossAmount ?? 0) +
    Number(data.paid._sum.grossAmount ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Earnings</h2>
        <p className="text-muted-foreground">
          Track commissions, pending balance, and payout history.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Pending Balance</p>
          <p className="mt-2 text-2xl font-semibold">
            ETB {pendingBalance.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Paid Out</p>
          <p className="mt-2 text-2xl font-semibold">
            ETB {paidOut.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Lifetime Gross</p>
          <p className="mt-2 text-2xl font-semibold">
            ETB {lifetimeGross.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="border-b p-4">
          <h3 className="font-semibold">Commission Breakdown Per Booking</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Booking</th>
              <th className="px-4 py-3">Gross</th>
              <th className="px-4 py-3">Commission</th>
              <th className="px-4 py-3">Net</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.commissions.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="px-4 py-3 text-xs">
                  {format(row.booking.date, "PPP")} {row.booking.startTime}
                </td>
                <td className="px-4 py-3 text-xs">{row.booking.id}</td>
                <td className="px-4 py-3">
                  ETB {Number(row.grossAmount).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  ETB {Number(row.commissionAmount).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  ETB {Number(row.netAmount).toLocaleString()}
                </td>
                <td className="px-4 py-3">{row.status}</td>
              </tr>
            ))}
            {data.commissions.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-sm text-muted-foreground"
                >
                  No commissions available yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border">
        <div className="border-b p-4">
          <h3 className="font-semibold">Payout History</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Commission</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Paid At</th>
            </tr>
          </thead>
          <tbody>
            {data.payouts.map((payout) => (
              <tr key={payout.id} className="border-t">
                <td className="px-4 py-3">{payout.period}</td>
                <td className="px-4 py-3">
                  ETB {Number(payout.amount).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  ETB {Number(payout.commissionTotal).toLocaleString()}
                </td>
                <td className="px-4 py-3">{payout.status}</td>
                <td className="px-4 py-3 text-xs">{payout.reference ?? "-"}</td>
                <td className="px-4 py-3 text-xs">
                  {payout.paidAt ? format(payout.paidAt, "PPP p") : "-"}
                </td>
              </tr>
            ))}
            {data.payouts.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-sm text-muted-foreground"
                >
                  No payout history yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
