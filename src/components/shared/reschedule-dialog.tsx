/**
 * @file Reschedule Dialog Component
 * @description Modal dialog for rescheduling a confirmed booking to a new
 * date and time. Reuses the slot-fetching pattern from the booking form.
 *
 * Features:
 *   - Shows current appointment for reference
 *   - Reschedule count indicator ("1 of 2 reschedules used")
 *   - Date picker (shadcn Calendar) — disables past dates and today
 *   - Time slot grid — fetched server-side via getAvailableSlots on date change
 *   - Conflict detection handled server-side in rescheduleBooking action
 *   - Loading states for slot fetching and form submission
 *
 * Rules enforced server-side (shown as error toasts here if violated):
 *   - Booking must be CONFIRMED (paid)
 *   - Must be > 24h before current appointment
 *   - Max 2 reschedules (rescheduleCount < 2)
 *   - New slot must not conflict with existing bookings
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { CalendarIcon, Clock, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { rescheduleBooking } from "@/lib/actions/booking";
import { getAvailableSlots } from "@/lib/actions/booking-queries";
import { formatTime24to12 } from "@/constants/time";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// =============================================================================
// Types
// =============================================================================

interface TimeSlot {
  startTime: string;
  endTime: string;
  label: string;
}

interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: {
    id: string;
    businessId: string;
    serviceId: string;
    /** Assigned staff member ID — null for single-provider businesses */
    staffId: string | null;
    /** Current appointment date as ISO string */
    currentDate: string;
    /** Current appointment start time in HH:mm */
    currentStartTime: string;
    /** Current appointment end time in HH:mm */
    currentEndTime: string;
    serviceName: string;
    businessName: string;
    /** How many times this booking has already been rescheduled (0, 1, or 2) */
    rescheduleCount: number;
  };
}

// =============================================================================
// Reschedule count indicator config
// =============================================================================

/**
 * Returns the badge variant and label for the reschedule count indicator.
 * 0 used → neutral, 1 used → warning, 2 used → should not reach dialog
 */
function getRescheduleIndicator(count: number) {
  if (count === 0) {
    return {
      label: "0 of 2 reschedules used",
      className: "bg-green-50 text-green-700 border-green-200",
    };
  }
  return {
    label: `${count} of 2 reschedules used`,
    className: "bg-amber-50 text-amber-700 border-amber-200",
  };
}

// =============================================================================
// Component
// =============================================================================

export function RescheduleDialog({
  open,
  onOpenChange,
  booking,
}: RescheduleDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Selected date from the calendar picker
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  // Available time slots for the selected date
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  // Whether slots are currently being fetched
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);
  // Currently selected time slot
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  const currentDate = new Date(booking.currentDate);
  const indicator = getRescheduleIndicator(booking.rescheduleCount);

  /**
   * Dates the calendar should disable.
   * - All dates in the past (before tomorrow)
   * - Today itself (same-day rescheduling makes no sense for an appointment
   *   booking system — there would be no available morning slots)
   */
  function isDateDisabled(date: Date): boolean {
    return isBefore(date, startOfDay(addDays(new Date(), 1)));
  }

  /**
   * Handle date selection from the calendar.
   * Clears the selected slot and fetches available slots for the new date.
   */
  async function handleDateSelect(date: Date | undefined) {
    if (!date) return;

    setSelectedDate(date);
    setSelectedSlot(null);
    setAvailableSlots([]);
    setIsFetchingSlots(true);

    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const slots = await getAvailableSlots(
        booking.businessId,
        booking.serviceId,
        dateStr,
        booking.staffId
      );

      setAvailableSlots(slots);
    } catch (error) {
      console.error("Failed to fetch available slots:", error);
      toast.error("Could not load available slots. Please try again.");
    } finally {
      setIsFetchingSlots(false);
    }
  }

  /**
   * Submit the reschedule request.
   * Validation is handled server-side — errors are shown as toasts.
   */
  function handleConfirm() {
    if (!selectedDate || !selectedSlot) return;

    startTransition(async () => {
      const result = await rescheduleBooking({
        bookingId: booking.id,
        date: format(selectedDate, "yyyy-MM-dd"),
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(result.success ?? "Booking rescheduled successfully!");
      onOpenChange(false);
      router.refresh();
    });
  }

  /** Reset local state when dialog closes. */
  function handleOpenChange(next: boolean) {
    if (isPending) return; // Prevent closing during submission
    onOpenChange(next);
    if (!next) {
      setSelectedDate(undefined);
      setAvailableSlots([]);
      setSelectedSlot(null);
    }
  }

  const canConfirm = !!selectedDate && !!selectedSlot && !isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-muted-foreground" />
            Reschedule Appointment
          </DialogTitle>
          <DialogDescription>
            Choose a new date and time for your{" "}
            <span className="font-medium">{booking.serviceName}</span>{" "}
            appointment at{" "}
            <span className="font-medium">{booking.businessName}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* ---------------------------------------------------------------- */}
          {/* Current appointment reference                                    */}
          {/* ---------------------------------------------------------------- */}
          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Current appointment
            </p>
            <p className="text-sm font-medium">
              {format(currentDate, "EEEE, MMMM d, yyyy")}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatTime24to12(booking.currentStartTime)} –{" "}
              {formatTime24to12(booking.currentEndTime)}
            </p>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Reschedule count indicator                                       */}
          {/* ---------------------------------------------------------------- */}
          <Badge
            variant="outline"
            className={cn("text-xs", indicator.className)}
          >
            {indicator.label}
          </Badge>

          <Separator />

          {/* ---------------------------------------------------------------- */}
          {/* Date picker                                                       */}
          {/* ---------------------------------------------------------------- */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Select a new date</p>
            </div>
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={isDateDisabled}
                initialFocus
              />
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Time slot grid                                                    */}
          {/* ---------------------------------------------------------------- */}
          {selectedDate && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">
                  Available times for{" "}
                  <span className="text-foreground">
                    {format(selectedDate, "MMM d")}
                  </span>
                </p>
              </div>

              {isFetchingSlots ? (
                /* Loading state */
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    Loading available slots...
                  </span>
                </div>
              ) : availableSlots.length === 0 ? (
                /* No slots available */
                <div className="rounded-lg border border-dashed py-8 text-center">
                  <Clock className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No available slots on this date.
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Please select a different date.
                  </p>
                </div>
              ) : (
                /* Slot grid */
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {availableSlots.map((slot) => {
                    const isSelected =
                      selectedSlot?.startTime === slot.startTime;
                    return (
                      <button
                        key={slot.startTime}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={cn(
                          "rounded-lg border px-2 py-2 text-center text-xs font-medium transition-colors",
                          "hover:border-primary hover:bg-primary/5",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-foreground"
                        )}
                      >
                        {slot.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* Selected slot confirmation summary                               */}
          {/* ---------------------------------------------------------------- */}
          {selectedSlot && selectedDate && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-primary">
                New appointment
              </p>
              <p className="mt-1 text-sm font-semibold">
                {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatTime24to12(selectedSlot.startTime)} –{" "}
                {formatTime24to12(selectedSlot.endTime)}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!canConfirm}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rescheduling...
              </>
            ) : (
              "Confirm Reschedule"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
