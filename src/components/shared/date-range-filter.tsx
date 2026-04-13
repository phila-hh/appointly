/**
 * @file Date Range Filter Component
 * @description Dropdown selector for analytics date ranges.
 *
 * Features:
 *   - Preset ranges (Today, Last 7 days, Last 30 days, etc.)
 *   - Custom date range picker
 *   - Displays selected range as formatted text
 */

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";

import {
  type DateRangePreset,
  getDateRangeForPreset,
  formatDateRange,
} from "@/lib/date-utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const PRESETS: Array<{ value: DateRangePreset; label: string }> = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7days", label: "Last 7 days" },
  { value: "last30days", label: "Last 30 days" },
  { value: "last90days", label: "Last 90 days" },
  { value: "thisWeek", label: "This week" },
  { value: "lastWeek", label: "Last week" },
  { value: "thisMonth", label: "This month" },
  { value: "lastMonth", label: "Last month" },
];

export function DateRangeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPreset =
    (searchParams.get("range") as DateRangePreset) ?? "last30days";
  const [customRange, setCustomRange] = useState<DateRange>({
    from: undefined,
  });

  function handlePresetChange(preset: DateRangePreset) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", preset);
    router.push(`?${params.toString()}`);
  }

  function handleCustomRange() {
    if (!customRange.from || !customRange.to) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("range", "custom");
    params.set("from", format(customRange.from, "yyyy-MM-dd"));
    params.set("to", format(customRange.to, "yyyy-MM-dd"));
    router.push(`?${params.toString()}`);
  }

  // Get current range for display
  const range = getDateRangeForPreset(
    currentPreset,
    customRange.from,
    customRange.to
  );

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      {/* Preset selector */}
      <Select value={currentPreset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[180px]">
          <CalendarIcon className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Select range" />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map((preset) => (
            <SelectItem key={preset.value} value={preset.value}>
              {preset.label}
            </SelectItem>
          ))}
          <Separator className="my-2" />
          <SelectItem value="custom">Custom range...</SelectItem>
        </SelectContent>
      </Select>

      {/* Custom range picker (shown if "custom" is selected) */}
      {currentPreset === "custom" && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[240px] justify-start">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {customRange.from && customRange.to
                ? formatDateRange(customRange.from, customRange.to)
                : "Pick a date range"}
              <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={customRange}
              onSelect={(range) => setCustomRange(range ?? { from: undefined })}
              numberOfMonths={2}
            />
            <div className="border-t p-3">
              <Button
                onClick={handleCustomRange}
                disabled={!customRange.from || !customRange.to}
                className="w-full"
              >
                Apply Range
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Display current range */}
      <span className="text-sm text-muted-foreground">
        {formatDateRange(range.start, range.end)}
      </span>
    </div>
  );
}
