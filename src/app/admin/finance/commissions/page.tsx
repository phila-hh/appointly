import { format } from "date-fns";

import { getCommissions } from "@/lib/actions/finance-queries";

interface AdminCommissionsPageProps {
  searchParams: Promise<{
    status?: "PENDING" | "INCLUDED_IN_PAYOUT" | "PAID_OUT";
    period?: string;
  }>;
}

export const metadata = { title: "Commissions" };

export default async function AdminCommissionsPage({
  searchParams,
}: AdminCommissionsPageProps) {
  const params = await searchParams;
  const commissions = await getCommissions({
    status: params.status,
    period: params.period,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Commissions</h2>
        <p className="text-muted-foreground">
          Per-booking commission records and payout linkage.
        </p>
      </div>

      <form className="grid gap-3 rounded-lg border p-4 md:grid-cols-3">
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="INCLUDED_IN_PAYOUT">Included in payout</option>
          <option value="PAID_OUT">Paid out</option>
        </select>
        <input
          name="period"
          defaultValue={params.period ?? ""}
          placeholder="YYYY-MM (optional)"
          className="h-10 rounded-md border bg-background px-3 text-sm"
        />
        <button
          type="submit"
          className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Apply filters
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3">Booking</th>
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Gross</th>
              <th className="px-4 py-3">Commission</th>
              <th className="px-4 py-3">Net</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Payout</th>
            </tr>
          </thead>
          <tbody>
            {commissions.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="px-4 py-3 text-xs">
                  <p className="font-medium">{row.booking.id}</p>
                  <p className="text-muted-foreground">
                    {format(row.booking.date, "PPP")} {row.booking.startTime}
                  </p>
                </td>
                <td className="px-4 py-3">{row.business.name}</td>
                <td className="px-4 py-3">
                  ETB {Number(row.grossAmount).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  ETB {Number(row.commissionAmount).toLocaleString()}
                  <p className="text-xs text-muted-foreground">
                    {(row.commissionRate * 100).toFixed(1)}%
                  </p>
                </td>
                <td className="px-4 py-3">
                  ETB {Number(row.netAmount).toLocaleString()}
                </td>
                <td className="px-4 py-3">{row.status}</td>
                <td className="px-4 py-3 text-xs">
                  {row.payout
                    ? `${row.payout.period} • ${row.payout.status}`
                    : "-"}
                </td>
              </tr>
            ))}
            {commissions.length === 0 && (
              <tr>
                <td
                  className="px-4 py-6 text-sm text-muted-foreground"
                  colSpan={7}
                >
                  No commissions found for the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
