/**
 * @file Peak Hours Chart Component
 * @description Bar chart showing booking distribution by hour of day.
 *
 * Helps identify when customers prefer to book (e.g., mornings vs evenings).
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

interface PeakHoursChartProps {
  data: Array<{ hour: number; count: number }>;
  title?: string;
}

export function PeakHoursChart({
  data,
  title = "Bookings by Hour",
}: PeakHoursChartProps) {
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

  // Fill missing hours with 0 and format for display
  const fullDayData = Array.from({ length: 24 }, (_, hour) => {
    const existingData = data.find((d) => d.hour === hour);
    return {
      hour,
      count: existingData?.count ?? 0,
      label: formatHour(hour),
    };
  });

  // Find peak hour for highlighting
  const maxCount = Math.max(...fullDayData.map((d) => d.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={fullDayData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="label"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              interval={2} // Show every 3rd label to avoid crowding
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;

                const data = payload[0].payload;

                return (
                  <div className="rounded-lg border bg-background p-3 shadow-lg">
                    <p className="text-sm font-medium">{data.label}</p>
                    <p className="text-lg font-bold text-primary">
                      {data.count} booking{data.count !== 1 ? "s" : ""}
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {fullDayData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.count === maxCount ? "#3b82f6" : "#94a3b8"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/**
 * Formats hour (0-23) into 12-hour time with AM/PM.
 */
function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}
