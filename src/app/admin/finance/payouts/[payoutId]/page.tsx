/**
 * @file Admin Payout Detail Page
 * @description Detailed view of a single payout batch with lifecycle controls.
 *
 * Features:
 *   - Summary KPI cards (status, gross, commission, net)
 *   - Business and owner info
 *   - Lifecycle action buttons:
 *       - Mark Processing (PENDING → PROCESSING)
 *       - Mark Paid (any → PAID, requires reference number)
 *       - Mark Failed (PROCESSING → FAILED, returns commissions to pending)
 *   - Commission line items table
 *   - Paid-at timestamp and reference display
 *
 * URL: /admin/finance/payouts/[payoutId]
 */

import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  Building2,
  Mail,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";

import { getPayoutDetail } from "@/lib/actions/finance-queries";
import { markPayoutFailed, setPayoutProcessing } from "@/lib/actions/finance";
import { ConfirmActionForm } from "@/components/shared/confirm-action-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice } from "@/lib/utils";
import { MarkPayoutPaidForm } from "./mark-payout-paid-form";

interface AdminPayoutDetailPageProps {
  params: Promise<{ payoutId: string }>;
}

export const metadata = { title: "Payout Detail" };

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

export default async function AdminPayoutDetailPage({
  params,
}: AdminPayoutDetailPageProps) {
  const { payoutId } = await params;
  const payout = await getPayoutDetail(payoutId);

  const statusConfig =
    PAYOUT_STATUS_CONFIG[payout.status] ?? PAYOUT_STATUS_CONFIG.PENDING;

  const canMarkProcessing = payout.status === "PENDING";
  const canMarkPaid = payout.status !== "PAID";
  const canMarkFailed =
    payout.status === "PENDING" || payout.status === "PROCESSING";

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/admin/finance/payouts">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Payouts
        </Link>
      </Button>

      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Payout Detail</h2>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span className="text-sm">{payout.business.name}</span>
            <span className="text-sm">·</span>
            <CalendarDays className="h-4 w-4" />
            <span className="text-sm">{payout.period}</span>
          </div>
        </div>
        <Badge
          variant={statusConfig.variant}
          className={`text-sm ${statusConfig.className ?? ""}`}
        >
          {statusConfig.label}
        </Badge>
      </div>

      {/* Summary KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Gross Total",
            value: formatPrice(Number(payout.grossTotal)),
          },
          {
            label: "Commission Deducted",
            value: formatPrice(Number(payout.commissionTotal)),
          },
          {
            label: "Net Amount",
            value: formatPrice(Number(payout.amount)),
          },
          {
            label: "Line Items",
            value: payout.commissions.length.toString(),
          },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <p className="mt-1 text-xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Business info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Business</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-semibold">{payout.business.name}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{payout.business.owner.email}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Owner: {payout.business.owner.name ?? "Unnamed"}
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/users/${payout.business.owner.id}`}>
                View Owner Account
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Payout actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payout Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {payout.status === "PAID" ? (
              /* Paid state — show confirmation details */
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Payout Completed</span>
                </div>
                {payout.paidAt && (
                  <p className="text-sm text-muted-foreground">
                    Paid on {format(payout.paidAt, "MMMM d, yyyy 'at' h:mm a")}
                  </p>
                )}
                {payout.reference && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Reference
                    </p>
                    <p className="font-mono text-sm">{payout.reference}</p>
                  </div>
                )}
                {payout.notes && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Notes
                    </p>
                    <p className="text-sm">{payout.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              /* Active state — show action buttons */
              <div className="space-y-4">
                {/* Mark processing */}
                {canMarkProcessing && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Mark as Processing</p>
                      <p className="text-xs text-muted-foreground">
                        Indicates transfer has been initiated
                      </p>
                    </div>
                    <ConfirmActionForm
                      action={() => setPayoutProcessing(payoutId)}
                      title="Mark Payout as Processing"
                      description="This indicates you have started the bank or mobile money transfer. Move the payout to PROCESSING status?"
                      label="Mark Processing"
                      variant="outline"
                    />
                  </div>
                )}

                {canMarkProcessing && canMarkPaid && <Separator />}

                {/* Mark paid */}
                {canMarkPaid && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">Mark as Paid</p>
                      <p className="text-xs text-muted-foreground">
                        Enter the transfer reference to confirm payment
                      </p>
                    </div>
                    <MarkPayoutPaidForm payoutId={payoutId} />
                  </div>
                )}

                {canMarkFailed && <Separator />}

                {/* Mark failed */}
                {canMarkFailed && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-destructive">
                        Mark as Failed
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Returns commissions to pending for next cycle
                      </p>
                    </div>
                    <ConfirmActionForm
                      action={() => markPayoutFailed(payoutId)}
                      title="Mark Payout as Failed"
                      description="This will mark the payout as FAILED and return all linked commissions to PENDING status so they can be included in a future payout batch. This cannot be undone."
                      label="Mark Failed"
                      variant="destructive"
                    />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Commission line items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Commission Line Items ({payout.commissions.length})
          </CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booking ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Gross</TableHead>
              <TableHead className="text-right">Commission</TableHead>
              <TableHead className="text-right">Net</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payout.commissions.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-mono text-xs">
                  {row.booking.id}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(row.booking.date, "MMM d, yyyy")}{" "}
                  {row.booking.startTime}
                </TableCell>
                <TableCell className="text-right text-sm">
                  {formatPrice(Number(row.grossAmount))}
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  − {formatPrice(Number(row.commissionAmount))}
                </TableCell>
                <TableCell className="text-right text-sm font-medium">
                  {formatPrice(Number(row.netAmount))}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {row.status.replace("_", " ")}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
