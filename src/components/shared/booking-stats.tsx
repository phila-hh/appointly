/**
 * @file Booking Stats Component
 * @description Summary cards showing booking statistics.
 */

import { CalendarDays, CheckCircle2, Clock, XCircle } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

interface BookingStatsProps {
  stats: {
    total: number;
    completed: number;
    upcoming: number;
    cancelled: number;
  };
}

export function BookingStats({ stats }: BookingStatsProps) {
  const statCards = [
    {
      label: "Total Bookings",
      value: stats.total,
      icon: CalendarDays,
      color: "text-blue-600",
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: CheckCircle2,
      color: "text-green-600",
    },
    {
      label: "Upcoming",
      value: stats.upcoming,
      icon: Clock,
      color: "text-orange-600",
    },
    {
      label: "Cancelled",
      value: stats.cancelled,
      icon: XCircle,
      color: "text-gray-600",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-3xl font-bold">{stat.value}</p>
                </div>
                <Icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
