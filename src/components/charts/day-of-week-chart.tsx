/**
 * @file Day of Week Chart Component
 * @description Shows booking distribution across days of the week.
 *
 * Helps identify which days are busiest (e.g., weekends vs weekdays).
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

interface DayOfWeekChartProps {
  data: Array<{ dayOfWeek: string; count: number }>;
  title?: string;
}

const DAY_COLORS: Record<string, string> = {
  Monday: "#3b82f6",
  Tuesday: "#8b5cf6",
  Wednesday: "#ec4899",
  Thursday: "#f59e0b",
  Friday: "#10b981",
  Saturday: "#6366f1",
  Sunday: "#ef4444",
};

export function DayOfWeekChart({
  data,
  title = "Bookings by Day of Week",
}: DayOfWeekChartProps) {
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

  // Ensure days are in order (Monday-Sunday)
  const orderedData = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ].map((day) => {
    const dayData = data.find((d) => d.dayOfWeek === day);
    return {
      day: day.slice(0, 3), // Abbreviate for mobile
      dayFull: day,
      count: dayData?.count ?? 0,
    };
  });

  const maxCount = Math.max(...orderedData.map((d) => d.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={orderedData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="day"
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

                const data = payload[0].payload;

                return (
                  <div className="rounded-lg border bg-background p-3 shadow-lg">
                    <p className="text-sm font-medium">{data.dayFull}</p>
                    <p className="text-lg font-bold text-primary">
                      {data.count} booking{data.count !== 1 ? "s" : ""}
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {orderedData.map((entry) => (
                <Cell
                  key={entry.day}
                  fill={DAY_COLORS[entry.dayFull]}
                  opacity={entry.count === maxCount ? 1 : 0.6}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
