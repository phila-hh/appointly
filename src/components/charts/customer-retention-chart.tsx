/**
 * @file Customer Retention Chart Component
 * @description Shows customer retention rate over time.
 *
 * Retention rate = (Returning customers / Total customers) * 100
 */

"use client";

import { format, parseISO } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CustomerRetentionChartProps {
  data: Array<{
    date: string;
    retentionRate: number;
  }>;
  title?: string;
}

export function CustomerRetentionChart({
  data,
  title = "Customer Retention Rate",
}: CustomerRetentionChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Insufficient data to calculate retention rate
          </p>
        </CardContent>
      </Card>
    );
  }

  const formattedData = data.map((item) => ({
    ...item,
    dateDisplay: format(parseISO(item.date), "MMM d"),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="dateDisplay"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;

                return (
                  <div className="rounded-lg border bg-background p-3 shadow-lg">
                    <p className="text-sm font-medium">
                      {payload[0].payload.dateDisplay}
                    </p>
                    <p className="text-lg font-bold text-green-600">
                      {(payload[0].value as number).toFixed(1)}% retention
                    </p>
                  </div>
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="retentionRate"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: "#10b981", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
