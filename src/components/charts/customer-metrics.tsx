/**
 * @file Customer Metrics Component
 * @description Displays new vs returning customer breakdown.
 *
 * Features:
 *   - Visual comparison of new vs returning customers
 *   - Percentage breakdown
 *   - Simple bar visualization
 */

"use client";

import { Users, UserPlus, Repeat } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CustomerMetricsProps {
  newCustomers: number;
  returningCustomers: number;
  title?: string;
}

export function CustomerMetrics({
  newCustomers,
  returningCustomers,
  title = "Customer Breakdown",
}: CustomerMetricsProps) {
  const total = newCustomers + returningCustomers;

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[200px] items-center justify-center">
          <p className="text-sm text-muted-foreground">
            No customer data for this period
          </p>
        </CardContent>
      </Card>
    );
  }

  const newPercentage = (newCustomers / total) * 100;
  const returningPercentage = (returningCustomers / total) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total customers */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Total Customers</span>
          </div>
          <span className="text-2xl font-bold">{total}</span>
        </div>

        {/* New customers */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-green-600" />
              <span className="font-medium">New Customers</span>
            </div>
            <span className="font-semibold">
              {newCustomers} ({newPercentage.toFixed(1)}%)
            </span>
          </div>
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${newPercentage}%` }}
            />
          </div>
        </div>

        {/* Returning customers */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Repeat className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Returning Customers</span>
            </div>
            <span className="font-semibold">
              {returningCustomers} ({returningPercentage.toFixed(1)}%)
            </span>
          </div>
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${returningPercentage}%` }}
            />
          </div>
        </div>

        {/* Insight message */}
        {returningPercentage > 50 && (
          <p className="rounded-lg bg-green-50 p-3 text-xs text-green-800 dark:bg-green-950 dark:text-green-200">
            ✓ Great retention! Over half of your customers are returning.
          </p>
        )}
        {newPercentage > 70 && (
          <p className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800 dark:bg-blue-950 dark:text-blue-200">
            ↗ Strong growth! Most of your customers are new this period.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
