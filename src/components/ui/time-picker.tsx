/**
 * @file Time Picker Component
 * @description A dropdown selector for choosing time of day.
 *
 * Displays times in 12-hour format (9:00 AM) while storing values
 * in 24-hour format (09:00). Built on shadcn's Select component
 * for consistent styling and accessibility.
 *
 * @example
 * ```tsx
 * <TimePicker
 * value="09:00"
 * onChange={(time) => console.log(time)} // "09:00"
 * disabled={false}
 * />
 * ```
 */

"use client";

import { TIME_OPTIONS } from "@/constants/time";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Props accepted by the TimePicker component. */
interface TimePickerProps {
  /** Current selected time in "HH:mm" format */
  value: string;
  /** Called when the user selects a new time */
  onChange: (time: string) => void;
  /** Whether the picker is disabled */
  disabled: boolean;
  /** Placeholder text shown when no time is selected */
  placeholder?: string;
}

export function TimePicker({
  value,
  onChange,
  disabled = false,
  placeholder = "Select time",
}: TimePickerProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-60">
        {TIME_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
