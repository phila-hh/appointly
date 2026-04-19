/**
 * @file Admin Commissions Page
 * @description Per-booking commission records with filtering.
 *
 * Features:
 *   - Filter by commission status (PENDING, INCLUDED_IN_PAYOUT, PAID_OUT)
 *   - Filter by payout period (YYYY-MM format)
 *   - Color-coded status badges
 *   - Links to related payout detail
 *   - Commission rate display alongside amounts
 *   - Empty state
 *
 * URL: /admin/finance/commissions?status=...&period=...
 */

import { format } from "date-fns";
import { HandCoins } from "lucide-react";
import Link from "next/link";

import { getCommissions } from "@/lib/actions/finance-queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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

interface AdminCommissionsPageProps {
  searchParams: Promise<{
    status?: "PENDING" | "INCLUDED_IN_PAYOUT" | "PAID_OUT";
    period?: string;
  }>;
}

export const metadata = { title: "Commissions" };

/**
 * Badge variant and label config for commission status.
 */
const COMMISSION_STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "outline";
    className?: string;
  }
> = {
  PENDING: {
    label: "Pending",
    variant: "secondary",
  },
  INCLUDED_IN_PAYOUT: {
    label: "In Payout",
    variant: "outline",
    className:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300",
  },
  PAID_OUT: {
    label: "Paid Out",
    variant: "default",
    className:
      "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300",
  },
};

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
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Commissions</h2>
        <p className="text-muted-foreground">
          Per-booking commission records and their payout linkage.
        </p>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap items-end gap-3">
        <Select name="status" defaultValue={params.status ?? "ALL"}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="INCLUDED_IN_PAYOUT">
              Included in Payout
            </SelectItem>
            <SelectItem value="PAID_OUT">Paid Out</SelectItem>
          </SelectContent>
        </Select>

        <Input
          name="period"
          placeholder="Period (YYYY-MM)"
          defaultValue={params.period ?? ""}
          className="w-[180px]"
        />

        <Button type="submit">Apply Filters</Button>
      </form>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {commissions.length} commission record
        {commissions.length !== 1 ? "s" : ""} found
      </p>

      {/* Commissions table */}
      {commissions.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking</TableHead>
                <TableHead>Business</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead className="text-right">Net</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payout</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissions.map((row) => {
                const statusConfig =
                  COMMISSION_STATUS_CONFIG[row.status] ??
                  COMMISSION_STATUS_CONFIG.PENDING;

                return (
                  <TableRow key={row.id}>
                    {/* Booking info */}
                    <TableCell>
                      <p className="font-mono text-xs">{row.booking.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(row.booking.date, "MMM d, yyyy")}{" "}
                        {row.booking.startTime}
                      </p>
                    </TableCell>

                    {/* Business */}
                    <TableCell className="text-sm">
                      {row.business.name}
                    </TableCell>

                    {/* Gross amount */}
                    <TableCell className="text-right text-sm">
                      {formatPrice(Number(row.grossAmount))}
                    </TableCell>

                    {/* Commission amount + rate */}
                    <TableCell className="text-right">
                      <p className="text-sm">
                        {formatPrice(Number(row.commissionAmount))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(row.commissionRate * 100).toFixed(1)}%
                      </p>
                    </TableCell>

                    {/* Net amount */}
                    <TableCell className="text-right text-sm font-medium">
                      {formatPrice(Number(row.netAmount))}
                    </TableCell>

                    {/* Status badge */}
                    <TableCell>
                      <Badge
                        variant={statusConfig.variant}
                        className={`text-xs ${statusConfig.className ?? ""}`}
                      >
                        {statusConfig.label}
                      </Badge>
                    </TableCell>

                    {/* Payout link */}
                    <TableCell>
                      {row.payout ? (
                        <div>
                          <Link
                            href={`/admin/finance/payouts/${row.payout.id}`}
                            className="text-xs text-primary hover:underline"
                          >
                            {row.payout.period}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {row.payout.status}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
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
          <HandCoins className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No commissions found</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Commission records are created automatically when a booking payment
            succeeds. Try adjusting the filters.
          </p>
        </div>
      )}
    </div>
  );
}
