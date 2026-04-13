/**
 * @file Bookings Chart Component
 * @description Area chart showing booking volume over time.
 *
 * Similar to revenue chart but focused on booking counts.
 */

"use client";

import { format, parseISO } from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BookingsChartProps {
  data: Array<{ date: string; count: number }>;
  title?: string;
  groupBy?: "day" | "week" | "month";
}

export function BookingsChart({
  data,
  title = "Bookings Over Time",
  groupBy = "day",
}: BookingsChartProps) {
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
            No booking data for this period
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
              <linearGradient id="bookingsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
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
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;

                return (
                  <div className="rounded-lg border bg-background p-3 shadow-lg">
                    <p className="text-sm font-medium">
                      {payload[0].payload.dateDisplay}
                    </p>
                    <p className="text-lg font-bold text-purple-600">
                      {payload[0].value} booking
                      {payload[0].value !== 1 ? "s" : ""}
                    </p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#8b5cf6"
              strokeWidth={2}
              fill="url(#bookingsGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
