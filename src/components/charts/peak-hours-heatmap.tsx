/**
 * @file Peak Hours Heatmap Component
 * @description 2D heatmap showing bookings by day AND hour.
 *
 * This is the "wow" visualization — shows exactly when your business is busiest.
 * Example: "Most bookings are Saturday afternoons at 2 PM"
 */

"use client";

import { Fragment } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PeakHoursHeatmapProps {
  data: Array<{
    dayOfWeek: string;
    hour: number;
    count: number;
  }>;
  title?: string;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18]; // Business hours

export function PeakHoursHeatmap({
  data,
  title = "Peak Hours Heatmap",
}: PeakHoursHeatmapProps) {
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

  // Find max count for color scaling
  const maxCount = Math.max(...data.map((d) => d.count));

  // Get count for specific day/hour combo
  const getCount = (day: string, hour: number): number => {
    const dayFull = {
      Mon: "Monday",
      Tue: "Tuesday",
      Wed: "Wednesday",
      Thu: "Thursday",
      Fri: "Friday",
      Sat: "Saturday",
      Sun: "Sunday",
    }[day];

    const entry = data.find((d) => d.dayOfWeek === dayFull && d.hour === hour);
    return entry?.count ?? 0;
  };

  // Calculate color intensity based on count
  const getColor = (count: number): string => {
    if (count === 0) return "bg-muted";
    const intensity = Math.ceil((count / maxCount) * 5);
    const colors = [
      "bg-blue-100 dark:bg-blue-950",
      "bg-blue-200 dark:bg-blue-900",
      "bg-blue-300 dark:bg-blue-800",
      "bg-blue-400 dark:bg-blue-700",
      "bg-blue-500 dark:bg-blue-600",
    ];
    return colors[intensity - 1];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div
            className="inline-grid min-w-full gap-1"
            style={{ gridTemplateColumns: `auto repeat(${DAYS.length}, 1fr)` }}
          >
            {/* Header row (days) */}
            <div className="text-xs font-medium text-muted-foreground"></div>
            {DAYS.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}

            {/* Hour rows */}
            {HOURS.map((hour) => (
              <Fragment key={hour}>
                <div className="flex items-center pr-2 text-xs font-medium text-muted-foreground">
                  {formatHour(hour)}
                </div>
                {DAYS.map((day) => {
                  const count = getCount(day, hour);
                  return (
                    <div
                      key={`${day}-${hour}`}
                      className={`group relative aspect-square rounded ${getColor(count)} transition-all hover:scale-110 hover:shadow-md`}
                      title={`${day} ${formatHour(hour)}: ${count} bookings`}
                    >
                      {count > 0 && (
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold opacity-0 group-hover:opacity-100">
                          {count}
                        </span>
                      )}
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="h-4 w-4 rounded bg-muted"></div>
              <div className="h-4 w-4 rounded bg-blue-100 dark:bg-blue-950"></div>
              <div className="h-4 w-4 rounded bg-blue-200 dark:bg-blue-900"></div>
              <div className="h-4 w-4 rounded bg-blue-300 dark:bg-blue-800"></div>
              <div className="h-4 w-4 rounded bg-blue-400 dark:bg-blue-700"></div>
              <div className="h-4 w-4 rounded bg-blue-500 dark:bg-blue-600"></div>
            </div>
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}
