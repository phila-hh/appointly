/**
 * @file Day Schedule Row Component
 * @description A single row in the weekly schedule editor representing
 * one day of the week.
 *
 * Features:
 *   - Day name label
 *   - Open/Closed toggle switch
 *   - Open time picker (disabled when closed)
 *   - Close time picker (disabled when closed)
 *   - "to" separator between times
 *   - Error display for invalid time ranges
 *
 * This component is controlled — all state is managed by the parent
 * form via props and callbacks.
 */

"use client";

import { ArrowRight } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TimePicker } from "@/components/ui/time-picker";
import { cn } from "@/lib/utils";

/** Props accepted by the DayScheduleRow component. */
interface DayScheduleRowProps {
  /** Full day name (e.g., "Monday") */
  dayLabel: string;
  /** Short day name for mobile (e.g., "Mon") */
  shortLabel: string;
  /** Whether the business is closed this day */
  isClosed: boolean;
  /** Opening time in "HH:mm" format */
  openTime: string;
  /** Closing time in "HH:mm" format */
  closeTime: string;
  /** Validation error message, if any */
  error?: string;
  /** Called when the closed toggle changes */
  onClosedChange: (closed: boolean) => void;
  /** Called when the open time changes */
  onOpenTimeChange: (time: string) => void;
  /** Called when the close time changes */
  onCloseTimeChange: (time: string) => void;
  /** Whether all controls are disabled (during form submission) */
  disabled?: boolean;
}

export function DayScheduleRow({
  dayLabel,
  shortLabel,
  isClosed,
  openTime,
  closeTime,
  error,
  onClosedChange,
  onOpenTimeChange,
  onCloseTimeChange,
  disabled = false,
}: DayScheduleRowProps) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-colors",
        isClosed ? "bg-muted/50" : "bg-background",
        error && "border-red-300"
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Day name and open/closed toggle */}
        <div className="flex items-center justify-between sm:min-w-[180px] sm:justify-start sm:gap-4">
          {/* Day label — full name on sm+, short name on mobile */}
          <Label className="text-sm font-semibold sm:w-28">
            <span className="hidden sm:inline">{dayLabel}</span>
            <span className="sm:hidden">{shortLabel}</span>
          </Label>

          {/* Open/Closed toggle */}
          <div className="flex items-center gap-2">
            <Switch
              checked={!isClosed}
              onCheckedChange={(checked) => onClosedChange(!checked)}
              disabled={disabled}
              aria-label={`Toggle ${dayLabel} open or closed`}
            />
            <span
              className={cn(
                "text-xs font-medium",
                isClosed ? "text-muted-foreground" : "text-green-600"
              )}
            >
              {isClosed ? "Closed" : "Open"}
            </span>
          </div>
        </div>

        {/* Right: Time pickers */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isClosed ? (
            /* Closed state — show a muted placeholder */
            <p className="text-sm italic text-muted-foreground">
              Closed all day
            </p>
          ) : (
            /* Open state — show time pickers */
            <>
              <div className="w-[130px]">
                <TimePicker
                  value={openTime}
                  onChange={onOpenTimeChange}
                  disabled={disabled}
                  placeholder="Open"
                />
              </div>

              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />

              <div className="w-[130px]">
                <TimePicker
                  value={closeTime}
                  onChange={onCloseTimeChange}
                  disabled={disabled}
                  placeholder="Close"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Validation error */}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
