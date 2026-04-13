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
import { formatPrice } from "@/lib/utils";

interface RevenueBreakdownChartProps {
  data: Array<{
    serviceName: string;
    revenue: number;
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
  "#14b8a6",
  "#f97316",
];

interface FormattedDataEntry {
  name: string;
  value: number;
  percentage: string;
}

export function RevenueBreakdownChart({
  data,
  title = "Revenue Distribution",
}: RevenueBreakdownChartProps) {
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

  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);

  const formattedData: FormattedDataEntry[] = data.map((item) => ({
    name: item.serviceName,
    value: item.revenue,
    percentage: ((item.revenue / totalRevenue) * 100).toFixed(1),
  }));

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
        {formattedData[index].percentage}%
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
              data={formattedData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              label={renderLabel}
            >
              {formattedData.map((_entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;

                const item = payload[0].payload as FormattedDataEntry;

                return (
                  <div className="rounded-lg border bg-background p-3 shadow-lg">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-lg font-bold text-primary">
                      {formatPrice(item.value)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.percentage}% of total
                    </p>
                  </div>
                );
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value: string, entry) => {
                const payload = entry.payload as unknown as FormattedDataEntry;
                return (
                  <span className="text-xs">
                    {value} ({formatPrice(payload.value)})
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
