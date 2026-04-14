import { format } from "date-fns";

import {
  markPayoutFailed,
  markPayoutPaid,
  setPayoutProcessing,
} from "@/lib/actions/finance";
import { getPayoutDetail } from "@/lib/actions/finance-queries";
import { ConfirmActionForm } from "@/components/shared/confirm-action-form";

interface AdminPayoutDetailPageProps {
  params: Promise<{ payoutId: string }>;
}

export const metadata = { title: "Payout Detail" };

export default async function AdminPayoutDetailPage({
  params,
}: AdminPayoutDetailPageProps) {
  const { payoutId } = await params;
  const payout = await getPayoutDetail(payoutId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Payout Detail</h2>
        <p className="text-muted-foreground">
          {payout.business.name} • {payout.period}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Status</p>
          <p className="mt-1 font-semibold">{payout.status}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Gross Total</p>
          <p className="mt-1 font-semibold">
            ETB {Number(payout.grossTotal).toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Commission Total</p>
          <p className="mt-1 font-semibold">
            ETB {Number(payout.commissionTotal).toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Net Amount</p>
          <p className="mt-1 font-semibold">
            ETB {Number(payout.amount).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h3 className="font-semibold">Payout Actions</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <ConfirmActionForm
            action={setPayoutProcessing.bind(null, payout.id)}
            confirmMessage="Move payout to PROCESSING?"
            label="Mark Processing"
          />
          <ConfirmActionForm
            action={markPayoutFailed.bind(null, payout.id)}
            confirmMessage="Mark payout as FAILED and return commissions to pending?"
            label="Mark Failed"
            variant="destructive"
          />
        </div>

        <form
          action={async (formData) => {
            "use server";
            await markPayoutPaid(payout.id, formData);
          }}
          className="mt-4 grid gap-3 md:grid-cols-3"
        >
          <input
            name="reference"
            required
            placeholder="Transfer reference"
            className="h-10 rounded-md border bg-background px-3 text-sm"
          />
          <input
            name="notes"
            placeholder="Optional notes"
            className="h-10 rounded-md border bg-background px-3 text-sm"
          />
          <button
            type="submit"
            className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Mark as Paid
          </button>
        </form>

        {payout.paidAt && (
          <p className="mt-3 text-xs text-muted-foreground">
            Paid at {format(payout.paidAt, "PPP p")} • Ref:{" "}
            {payout.reference ?? "-"}
          </p>
        )}
      </div>

      <div className="rounded-lg border">
        <div className="border-b p-4">
          <h3 className="font-semibold">Commission Line Items</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3">Booking</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Gross</th>
              <th className="px-4 py-3">Commission</th>
              <th className="px-4 py-3">Net</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {payout.commissions.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="px-4 py-3 text-xs">{row.booking.id}</td>
                <td className="px-4 py-3 text-xs">
                  {format(row.booking.date, "PPP")} {row.booking.startTime}
                </td>
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
          </tbody>
        </table>
      </div>
    </div>
  );
}
