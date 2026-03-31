/**
 * @file Schedule Display Component
 * @description Read-only display of business operating hours.
 *
 * Show each day of the week with its hours or "Closed" label.
 * Highlights the current day of the week for quick reference.
 *
 * Used on:
 *   - Public business detail pages (customer-facing)
 *   - Dashboard overview (business owner reference)
 *
 * @example
 * ```tsx
 * <ScheduleDisplay hours={businessHours} />
 * ```
 */

import { formatTime24to12, DAYS_OF_WEEK } from "@/constants/time";
import { cn } from "@/lib/utils";

/** Shape of a single day hours from the database. */
interface DayHours {
  dayOfWeek: string;
  closeTime: string;
  openTime: string;
  isClosed: boolean;
}

/** Props accepted by the ScheduleDisplay component. */
interface ScheduleDisplayProps {
  /** Array of business hours (up to 7 entries, one per day). */
  hours: DayHours[];
  /** Whether to highlight the current day. Defaults to true. */
  highlightToday?: boolean;
}

export function ScheduleDisplay({
  hours,
  highlightToday,
}: ScheduleDisplayProps) {
  /**
   * Get the current day of the week as our enum value.
   * JavaScript's getDay() returns 0 = Sunday, 1 = Monday, etc.
   * We map it to our DAYS_OF_WEEK index (0 = Monday, 6 = Sunday).
   */
  const jsDay = new Date().getDay();
  // Convert: JS Sunday(0) → our index 6, JS Monday(1) → our index 0, etc.
  const todayIndex = jsDay === 0 ? 6 : jsDay - 1;
  const todayValue = DAYS_OF_WEEK[todayIndex].value;

  return (
    <div className="space-y-1">
      {DAYS_OF_WEEK.map((day) => {
        const dayHours = hours.find((h) => h.dayOfWeek === day.value);
        const isToday = highlightToday && day.value === todayValue;

        return (
          <div
            key={day.value}
            className={cn(
              "flex items-center justify-between rounded-md px-3 py-2 text-sm",
              isToday && "bg-primary/5 font-medium"
            )}
          >
            {/* Day name */}
            <span
              className={cn(
                "w-24",
                isToday ? "text-primary font-semibold" : "text-muted-foreground"
              )}
            >
              {day.label}
              {isToday && (
                <span className="ml-1.5 text-xs text-primary">(Today)</span>
              )}
            </span>

            {/* Hours or Closed */}
            <span
              className={cn(
                isToday ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {!dayHours || dayHours.isClosed ? (
                <span className="italic text-muted-foreground">Closed</span>
              ) : (
                `${formatTime24to12(dayHours.openTime)} – ${formatTime24to12(dayHours.closeTime)}`
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
