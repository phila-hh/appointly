import Link from "next/link";

import { generatePayoutsForPeriod } from "@/lib/actions/finance";
import { getPayouts } from "@/lib/actions/finance-queries";

interface AdminPayoutsPageProps {
  searchParams: Promise<{
    status?: "PENDING" | "PROCESSING" | "PAID" | "FAILED";
    period?: string;
  }>;
}

export const metadata = { title: "Payouts" };

export default async function AdminPayoutsPage({
  searchParams,
}: AdminPayoutsPageProps) {
  const params = await searchParams;
  const payouts = await getPayouts({
    status: params.status,
    period: params.period,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Payout Management</h2>
        <p className="text-muted-foreground">
          Batch pending commissions and process business payouts.
        </p>
      </div>

      <div className="rounded-lg border p-4">
        <h3 className="font-semibold">Generate Payout Batch</h3>
        <form
          className="mt-3 flex flex-col gap-3 sm:flex-row"
          action={async (formData) => {
            "use server";
            const period = String(formData.get("period") ?? "").trim();
            await generatePayoutsForPeriod(period);
          }}
        >
          <input
            name="period"
            required
            placeholder="YYYY-MM"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm sm:w-56"
          />
          <button
            type="submit"
            className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Generate payouts
          </button>
        </form>
      </div>

      <form className="grid gap-3 rounded-lg border p-4 md:grid-cols-3">
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PROCESSING">Processing</option>
          <option value="PAID">Paid</option>
          <option value="FAILED">Failed</option>
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
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3">Gross</th>
              <th className="px-4 py-3">Commission</th>
              <th className="px-4 py-3">Net Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((payout) => (
              <tr key={payout.id} className="border-t">
                <td className="px-4 py-3">
                  <p className="font-medium">{payout.business.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {payout.business.owner.email}
                  </p>
                </td>
                <td className="px-4 py-3">{payout.period}</td>
                <td className="px-4 py-3">ETB {Number(payout.grossTotal).toLocaleString()}</td>
                <td className="px-4 py-3">
                  ETB {Number(payout.commissionTotal).toLocaleString()}
                </td>
                <td className="px-4 py-3">ETB {Number(payout.amount).toLocaleString()}</td>
                <td className="px-4 py-3">{payout.status}</td>
                <td className="px-4 py-3">{payout._count.commissions}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/finance/payouts/${payout.id}`}
                    className="text-primary hover:underline"
                  >
                    Open
                  </Link>
                </td>
              </tr>
            ))}
            {payouts.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-sm text-muted-foreground" colSpan={8}>
                  No payouts found for the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
