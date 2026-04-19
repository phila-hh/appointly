/**
 * @file Admin Payouts Page
 * @description Payout batch management with generation and lifecycle controls.
 *
 * Features:
 *   - Generate payout batches for a period (groups all pending commissions)
 *   - Filter by payout status and period
 *   - Color-coded status badges
 *   - Links to payout detail pages
 *   - Commission count per payout
 *   - Empty state with guidance
 *
 * URL: /admin/finance/payouts?status=...&period=...
 */

import Link from "next/link";
import { format } from "date-fns";
import { Wallet, ArrowRight } from "lucide-react";

import { getPayouts } from "@/lib/actions/finance-queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice } from "@/lib/utils";
import { GeneratePayoutForm } from "./generate-payout-form";

interface AdminPayoutsPageProps {
  searchParams: Promise<{
    status?: "PENDING" | "PROCESSING" | "PAID" | "FAILED";
    period?: string;
  }>;
}

export const metadata = { title: "Payouts" };

/**
 * Badge config for payout status display.
 */
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
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Payout Management</h2>
        <p className="text-muted-foreground">
          Generate payout batches from pending commissions and process transfers
          to businesses.
        </p>
      </div>

      {/* Generate payout batch form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Generate Payout Batch</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Groups all pending commissions by business and creates payout
            records for the specified period. Only commissions with{" "}
            <strong>PENDING</strong> status are included.
          </p>
          <GeneratePayoutForm />
        </CardContent>
      </Card>

      <Separator />

      {/* Filters */}
      <form className="flex flex-wrap items-end gap-3">
        <Select name="status" defaultValue={params.status ?? "ALL"}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="PROCESSING">Processing</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>

        <Input
          name="period"
          placeholder="Period (YYYY-MM)"
          defaultValue={params.period ?? ""}
          className="w-[180px]"
        />

        <Button type="submit" variant="outline">
          Apply Filters
        </Button>
      </form>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {payouts.length} payout{payouts.length !== 1 ? "s" : ""} found
      </p>

      {/* Payouts table */}
      {payouts.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead className="text-right">Net Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Items</TableHead>
                <TableHead className="text-right">Created</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map((payout) => {
                const statusConfig =
                  PAYOUT_STATUS_CONFIG[payout.status] ??
                  PAYOUT_STATUS_CONFIG.PENDING;

                return (
                  <TableRow key={payout.id}>
                    {/* Business */}
                    <TableCell>
                      <p className="text-sm font-medium">
                        {payout.business.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {payout.business.owner.email}
                      </p>
                    </TableCell>

                    {/* Period */}
                    <TableCell className="text-sm">{payout.period}</TableCell>

                    {/* Gross */}
                    <TableCell className="text-right text-sm">
                      {formatPrice(Number(payout.grossTotal))}
                    </TableCell>

                    {/* Commission */}
                    <TableCell className="text-right text-sm text-muted-foreground">
                      − {formatPrice(Number(payout.commissionTotal))}
                    </TableCell>

                    {/* Net amount */}
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

                    {/* Commission count */}
                    <TableCell className="text-center text-sm">
                      {payout._count.commissions}
                    </TableCell>

                    {/* Created date */}
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {format(payout.createdAt, "MMM d, yyyy")}
                    </TableCell>

                    {/* Detail link */}
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/finance/payouts/${payout.id}`}>
                          Open
                          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Wallet className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No payouts found</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            {params.status || params.period
              ? "Try adjusting your filters."
              : "Generate your first payout batch using the form above."}
          </p>
        </div>
      )}
    </div>
  );
}
