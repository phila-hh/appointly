/**
 * @file Chart Skeleton Component
 * @description Loading skeleton for chart components.
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ChartSkeletonProps {
  title?: string;
  height?: number;
}

export function ChartSkeleton({ title, height = 300 }: ChartSkeletonProps) {
  return (
    <Card>
      <CardHeader>
        {title ? (
          <Skeleton className="h-5 w-48" />
        ) : (
          <Skeleton className="h-5 w-32" />
        )}
      </CardHeader>
      <CardContent>
        <Skeleton className="w-full" style={{ height: `${height}px` }} />
      </CardContent>
    </Card>
  );
}
