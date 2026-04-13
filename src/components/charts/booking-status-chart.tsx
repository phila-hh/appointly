/**
 * @file Booking Status Chart Component
 * @description Donut chart showing distribution of booking statuses.
 *
 * Shows: Completed, Confirmed, Pending, Cancelled, No-Show
 */

"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  type PieLabelRenderProps,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BOOKING_STATUS_CONFIG } from "@/constants";

interface BookingStatusChartProps {
  data: Record<string, number>;
  title?: string;
}

interface ChartDataEntry {
  name: string;
  value: number;
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "#10b981",
  CONFIRMED: "#3b82f6",
  PENDING: "#f59e0b",
  CANCELLED: "#ef4444",
  NO_SHOW: "#6b7280",
};

export function BookingStatusChart({
  data,
  title = "Booking Status Distribution",
}: BookingStatusChartProps) {
  const chartData: ChartDataEntry[] = Object.entries(data)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      name: BOOKING_STATUS_CONFIG[status]?.label ?? status,
      value: count,
      status,
    }));

  if (chartData.length === 0) {
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

  const totalBookings = chartData.reduce((sum, item) => sum + item.value, 0);

  const renderLabel = (props: PieLabelRenderProps) => {
    const RADIAN = Math.PI / 180;
    const cx = Number(props.cx ?? 0);
    const cy = Number(props.cy ?? 0);
    const midAngle = props.midAngle ?? 0;
    const outerRadius = Number(props.outerRadius ?? 0);
    const index = props.index ?? 0;

    const radius = outerRadius + 20;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="currentColor"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="text-xs"
      >
        {chartData[index].value}
      </text>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              label={renderLabel}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.status}
                  fill={STATUS_COLORS[entry.status] ?? "#6b7280"}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;

                const item = payload[0].payload as ChartDataEntry;
                const percentage = ((item.value / totalBookings) * 100).toFixed(
                  1
                );

                return (
                  <div className="rounded-lg border bg-background p-3 shadow-lg">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-lg font-bold">{item.value} bookings</p>
                    <p className="text-sm text-muted-foreground">
                      {percentage}% of total
                    </p>
                  </div>
                );
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value: string, entry) => {
                const payload = entry.payload as unknown as ChartDataEntry;
                return (
                  <span className="text-xs">
                    {value} ({payload.value})
                  </span>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
