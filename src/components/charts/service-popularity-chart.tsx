/**
 * @file Service Popularity Chart Component
 * @description Horizontal bar chart showing most booked services.
 *
 * Ranks services by booking count (not revenue).
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

interface ServicePopularityChartProps {
  data: Array<{
    serviceName: string;
    bookings: number;
  }>;
  title?: string;
}

const COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#6366f1",
];

export function ServicePopularityChart({
  data,
  title = "Most Popular Services",
}: ServicePopularityChartProps) {
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

  // Sort by bookings and take top 8
  const sortedData = [...data]
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 8);

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
              allowDecimals={false}
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
                      {data.bookings} booking{data.bookings !== 1 ? "s" : ""}
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="bookings" radius={[0, 4, 4, 0]}>
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
