/**
 * @file Revenue Chart Component
 * @description Line chart showing revenue over time.
 *
 * Features:
 *   - Responsive line chart
 *   - Tooltip with formatted values
 *   - Gradient fill under the line
 *   - Customizable time grouping (day, week, month)
 *   - Empty state for no data
 */

"use client";

import { format, parseISO } from "date-fns";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

interface RevenueChartProps {
  data: Array<{ date: string; revenue: number }>;
  title?: string;
  groupBy?: "day" | "week" | "month";
}

export function RevenueChart({
  data,
  title = "Revenue Over Time",
  groupBy = "day",
}: RevenueChartProps) {
  // Format dates for display
  const formattedData = data.map((item) => ({
    ...item,
    dateDisplay:
      groupBy === "month"
        ? format(parseISO(item.date), "MMM yyyy")
        : groupBy === "week"
          ? format(parseISO(item.date), "MMM d")
          : format(parseISO(item.date), "MMM d"),
  }));

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <p className="text-sm text-muted-foreground">
            No revenue data for this period
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={formattedData}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="dateDisplay"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;

                return (
                  <div className="rounded-lg border bg-background p-3 shadow-lg">
                    <p className="text-sm font-medium">
                      {payload[0].payload.dateDisplay}
                    </p>
                    <p className="text-lg font-bold text-primary">
                      {formatPrice(payload[0].value as number)}
                    </p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#revenueGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
