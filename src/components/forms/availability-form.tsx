/**
 * @file Availability Form Component
 * @description Weekly schedule editor allowing business owners to set
 * their operating hours for each day.
 *
 * Features:
 *   - Renders a DayScheduleRow for each day (Mon-Sun)
 *   - Pre-fills with existing hours if available
 *   - Validates that open times are before close times
 *   - Saves all 7 days automatically via server action
 *   - Quick-fill button to apply the same hours to all weekdays
 *
 * State management:
 *   - Use react-hook-form with Zod validation
 *   - The "schedule" field is an array of 7 day objects
 *   - Each DayScheduleRow is a controlled component receiving its
 *     slice of the array
 */

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Copy } from "lucide-react";
import { toast } from "sonner";

import {
  availabilitySchema,
  type AvailabilityFormValues,
} from "@/lib/validators/availability";
import { saveAvailability } from "@/lib/actions/availability";
import { DAYS_OF_WEEK } from "@/constants/time";
import { Button } from "@/components/ui/button";
import { DayScheduleRow } from "@/components/shared/day-schedule-row";
import { Separator } from "@/components/ui/separator";

/** Shape of a single day's data from the database. */
interface ExistingHours {
  dayOfWeek: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

/** Props accepted by the AvailabilityForm component. */
interface AvailabilityFormProps {
  /** Existing business hours from the database (may be empty). */
  existingHours: ExistingHours[];
}

/**
 * Builds the default schedule array.
 *
 * If existing hours are available, maps them into the form structure.
 * if no existing hours, creates a default schedule:
 *   - Weekdays (Mon - Fri): 09:00 - 17:00 (open)
 *   - Weekend (Sat - Sun): closed
 *
 * @param existingHours - Array of saved business hours from DB
 * @returns Array of 7 day schedule objects
 */
function buildDefaultSchedule(
  existingHours: ExistingHours[]
): AvailabilityFormValues["schedule"] {
  return DAYS_OF_WEEK.map((day) => {
    // Check if we have saved hours for this day
    const existing = existingHours.find((h) => h.dayOfWeek === day.value);

    if (existing) {
      return {
        dayOfWeek:
          existing.dayOfWeek as AvailabilityFormValues["schedule"][number]["dayOfWeek"],
        openTime: existing.openTime,
        closeTime: existing.closeTime,
        isClosed: existing.isClosed,
      };
    }

    // Default values for days without saved hours
    const isWeekend = day.value === "SATURDAY" || day.value === "SUNDAY";

    return {
      dayOfWeek:
        day.value as AvailabilityFormValues["schedule"][number]["dayOfWeek"],
      openTime: isWeekend ? "00:00" : "09:00",
      closeTime: isWeekend ? "00:00" : "17:00",
      isClosed: isWeekend,
    };
  });
}

export function AvailabilityForm({ existingHours }: AvailabilityFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AvailabilityFormValues>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      schedule: buildDefaultSchedule(existingHours),
    },
  });

  // Watch the schedule array to get real-time values for rendering
  const schedule = form.watch("schedule");

  /**
   * Update a specific field for a specific day in the schedule array
   *
   * @param dayIndex - Index of the day in the array (0 = Monday, 6 = Sunday)
   * @param field - The field to update
   * @param value - The new value
   */
  function updateDay(
    dayIndex: number,
    field: "openTime" | "closeTime" | "isClosed",
    value: string | boolean
  ) {
    form.setValue(`schedule.${dayIndex}.${field}` as const, value, {
      shouldValidate: true, // Trigger validation on change
    });
  }

  /**
   * Copies Monday's hours to all other weekdays (Tue-Fri).
   * Useful for businesses with the same hours Monday through Friday.
   */
  function copyMondayToWeekdays() {
    const monday = schedule[0]; // Monday is always index 0

    // Apply Monday's hours to Tuesday (1) through Friday (4)
    for (let i = 1; i <= 4; i++) {
      form.setValue(`schedule.${i}.openTime`, monday.openTime);
      form.setValue(`schedule.${i}.closeTime`, monday.closeTime);
      form.setValue(`schedule.${i}.isClosed`, monday.isClosed);
    }

    toast.info("Monday's hours copied to all weekdays.");
  }

  /** Handle form submission. */
  async function onSubmit(values: AvailabilityFormValues) {
    setIsLoading(true);

    try {
      const result = await saveAvailability(values);

      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(result.success);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Quick actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Set your operating hours for each day. Toggle days on or off.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={copyMondayToWeekdays}
          disabled={isLoading}
        >
          <Copy className="mr-2 h-4 w-4" />
          Copy Mon → Weekdays
        </Button>
      </div>

      {/* Schedule rows — one for each day */}
      <div className="space-y-3">
        {DAYS_OF_WEEK.map((day, index) => {
          // Get the current values for this day from the watched schedule
          const dayData = schedule[index];

          // Get validation errors for this specific day, if any
          const dayErrors = form.formState.errors.schedule?.[index];
          const errorMessage =
            dayErrors?.closeTime?.message ||
            dayErrors?.openTime?.message ||
            undefined;

          return (
            <DayScheduleRow
              key={day.value}
              dayLabel={day.label}
              shortLabel={day.shortLabel}
              isClosed={dayData?.isClosed ?? false}
              openTime={dayData?.openTime ?? "09:00"}
              closeTime={dayData?.closeTime ?? "17:00"}
              error={errorMessage}
              onClosedChange={(closed) => updateDay(index, "isClosed", closed)}
              onOpenTimeChange={(time) => updateDay(index, "openTime", time)}
              onCloseTimeChange={(time) => updateDay(index, "closeTime", time)}
              disabled={isLoading}
            />
          );
        })}
      </div>

      {/* Weekday / Weekend separator is visual through the day list order */}
      <Separator />

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving schedule...
            </>
          ) : (
            "Save Schedule"
          )}
        </Button>
      </div>
    </form>
  );
}
