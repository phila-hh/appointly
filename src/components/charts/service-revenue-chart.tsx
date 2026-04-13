/**
 * @file Service Revenue Chart Component
 * @description Bar chart showing revenue breakdown by service.
 *
 * Features:
 *   - Horizontal bar chart for better service name readability
 *   - Sorted by revenue (highest first)
 *   - Shows both revenue and booking count
 *   - Responsive layout
 */

"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

interface ServiceRevenueChartProps {
  data: Array<{
    serviceName: string;
    revenue: number;
    bookings: number;
  }>;
  title?: string;
}

const COLORS = [
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // green
  "#6366f1", // indigo
];

export function ServiceRevenueChart({
  data,
  title = "Revenue by Service",
}: ServiceRevenueChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <p className="text-sm text-muted-foreground">
            No service data for this period
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort by revenue descending and take top 10
  const sortedData = [...data]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer
          width="100%"
          height={Math.max(300, sortedData.length * 50)}
        >
          <BarChart data={sortedData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              type="number"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value) => `$${value}`}
            />
            <YAxis
              type="category"
              dataKey="serviceName"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              width={120}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;

                const data = payload[0].payload;

                return (
                  <div className="rounded-lg border bg-background p-3 shadow-lg">
                    <p className="font-medium">{data.serviceName}</p>
                    <p className="text-lg font-bold text-primary">
                      {formatPrice(data.revenue)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {data.bookings} booking{data.bookings !== 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Avg: {formatPrice(data.revenue / data.bookings)}
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
              {sortedData.map((entry, index) => (
                <Cell
                  key={entry.serviceName}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
