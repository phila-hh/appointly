/**
 * @file Stats Grid Component
 * @description Grid layout for KPI cards with responsive columns.
 *
 * Automatically adjusts from 1 column (mobile) to 2-4 columns (desktop)
 * based on the number of cards.
 */

import { ReactNode } from "react";

interface StatsGridProps {
  children: ReactNode;
  /** Number of columns on desktop (2, 3, or 4) */
  columns?: 2 | 3 | 4;
}

export function StatsGrid({ children, columns = 4 }: StatsGridProps) {
  const gridCols = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  };

  return <div className={`grid gap-4 ${gridCols[columns]}`}>{children}</div>;
}
