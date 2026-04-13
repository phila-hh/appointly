/**
 * @file Export Button Component
 * @description Button to export analytics data to CSV.
 */

"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  downloadCSV,
  formatAnalyticsForCSV,
  type AnalyticsDataItem,
} from "@/lib/csv-utils";

interface ExportButtonProps {
  type: "revenue" | "bookings" | "services" | "customers";
  data: AnalyticsDataItem[];
  dateRange: string;
  label?: string;
}

export function ExportButton({
  type,
  data,
  dateRange,
  label = "Export to CSV",
}: ExportButtonProps) {
  function handleExport() {
    const { data: formattedData, filename } = formatAnalyticsForCSV(
      type,
      data,
      dateRange
    );

    downloadCSV(formattedData, filename);
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <Download className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}
