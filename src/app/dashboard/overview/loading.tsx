/**
 * @file Analytics Dashboard Loading State
 * @description Skeleton loaders for the analytics dashboard.
 */

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatsGrid } from "@/components/shared/stats-grid";
import { ChartSkeleton } from "@/components/charts/chart-skeleton";

export default function OverviewLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      {/* KPI Cards skeleton */}
      <StatsGrid columns={4}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="mt-2 h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </StatsGrid>

      {/* Revenue Section skeleton */}
      <div className="space-y-6">
        <Skeleton className="h-6 w-40" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ChartSkeleton height={300} />
          </div>
          <ChartSkeleton height={300} />
        </div>
        <ChartSkeleton height={300} />
      </div>

      {/* Booking Section skeleton */}
      <div className="space-y-6">
        <Skeleton className="h-6 w-40" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ChartSkeleton height={300} />
          </div>
          <ChartSkeleton height={300} />
        </div>
        <ChartSkeleton height={300} />
      </div>

      {/* Customer Section skeleton */}
      <div className="space-y-6">
        <Skeleton className="h-6 w-40" />
        <div className="grid gap-6 lg:grid-cols-3">
          <ChartSkeleton height={200} />
          <div className="lg:col-span-2">
            <ChartSkeleton height={400} />
          </div>
        </div>
      </div>

      {/* Peak Hours Section skeleton */}
      <div className="space-y-6">
        <Skeleton className="h-6 w-40" />
        <ChartSkeleton height={400} />
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartSkeleton height={300} />
          <ChartSkeleton height={300} />
        </div>
      </div>
    </div>
  );
}
