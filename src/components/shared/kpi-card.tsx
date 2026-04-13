/**
 * @file KPI Card Component
 * @description Key Performance Indicator card with value, trend, and icon.
 *
 * Features:
 *   - Large primary value display
 *   - Trend indicator (percentage change with arrow)
 *   - Colored based on positive/negative trend
 *   - Icon for visual identification
 *   - Optional comparison period label
 *   - Loading state
 */

import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface KPICardProps {
  /** Card title */
  title: string;
  /** Main value to display */
  value: string | number;
  /** Percentage change from previous period */
  trend?: number;
  /** Icon component */
  icon: LucideIcon;
  /** Optional description/subtitle */
  description?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Format function for the value */
  formatValue?: (value: number) => string;
}

export function KPICard({
  title,
  value,
  trend,
  icon: Icon,
  description,
  isLoading = false,
}: KPICardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-2 h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  // Determine trend direction and color
  const isPositive = trend !== undefined && trend > 0;
  const isNegative = trend !== undefined && trend < 0;

  const trendColor = isPositive
    ? "text-green-600"
    : isNegative
      ? "text-red-600"
      : "text-muted-foreground";

  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {/* Main value */}
          <p className="text-2xl font-bold">{value}</p>

          {/* Trend indicator */}
          {trend !== undefined && (
            <div className="flex items-center gap-1">
              <TrendIcon className={`h-3 w-3 ${trendColor}`} />
              <span className={`text-xs font-medium ${trendColor}`}>
                {Math.abs(trend).toFixed(1)}%
              </span>
              {description && (
                <span className="text-xs text-muted-foreground">
                  vs {description}
                </span>
              )}
            </div>
          )}

          {/* Description without trend */}
          {trend === undefined && description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
