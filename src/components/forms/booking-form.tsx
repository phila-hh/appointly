/**
 * @file Booking Form Component
 * @description Interactive booking form with calendar, time slots, notes,
 * and optional staff member selection.
 *
 * Features:
 *   - Service selector (switch between available services)
 *   - Staff selector ("Any Available" or specific staff member)
 *   - Calendar date picker with closed days disabled
 *   - Dynamic time-slot loading based on selected date and staff
 *   - Time slot grid with visual selection
 *   - Optional notes textarea
 *   - Loading states during slot fetching and booking creation
 *   - Past dates disabled on calendar
 *
 * Staff selector is only rendered when the business has staff members
 * configured for the selected service. If no staff exist, the form
 * behaves exactly as before (full backwards compatibility).
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, isBefore, startOfDay } from "date-fns";
import { CalendarIcon, Clock, Loader2, UserCog } from "lucide-react";
import { toast } from "sonner";

import { createBooking } from "@/lib/actions/booking";
import { fetchAvailableSlots } from "@/lib/actions/slot-actions";
import type { TimeSlot } from "@/lib/booking-utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPrice, formatDuration } from "@/lib/utils";

/** Service data shape. */
interface ServiceData {
  id: string;
  name: string;
  price: number;
  duration: number;
  description?: string | null;
}

/** Staff member data shape for the selector. */
interface StaffMemberData {
  id: string;
  name: string;
  title: string | null;
}

/** The sentinel value representing "Any Available" staff selection. */
const ANY_AVAILABLE_VALUE = "__any__";

/** Props for the BookingForm component. */
interface BookingFormProps {
  businessId: string;
  businessSlug: string;
  selectedService: ServiceData;
  allServices: ServiceData[];
  closedDays: string[];
  /** Staff members who can perform the initial selected service. */
  staffMembers?: StaffMemberData[];
}

/**
 * Maps our DayOfWeek enum values to JavaScript's getDay() numbers.
 * Used to disable closed days in the calendar.
 */
const DAY_TO_JS_DAY: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

export function BookingForm({
  businessId,
  selectedService,
  allServices,
  closedDays,
  staffMembers = [],
}: BookingFormProps) {
  const router = useRouter();

  // Form state
  const [currentService, setCurrentService] = useState(selectedService);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState("");

  // Staff selection state
  // ANY_AVAILABLE_VALUE = no preference; a staff ID = specific staff
  const [selectedStaffId, setSelectedStaffId] =
    useState<string>(ANY_AVAILABLE_VALUE);

  // Loading states
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available time slots for the selected date and staff
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [slotsMessage, setSlotsMessage] = useState<string>("");

  /** Whether this business has any staff members configured. */
  const hasStaff = staffMembers.length > 0;

  /**
   * Convert closed days to JS day numbers for calendar disabling.
   */
  const closedJsDays = closedDays
    .map((d) => DAY_TO_JS_DAY[d])
    .filter((d) => d !== undefined);

  /**
   * Calendar date disabling function.
   * Disables:
   *   - Past dates (before today)
   *   - Days the business is closed
   *   - Dates more than 60 days in the future
   */
  function isDateDisabled(date: Date): boolean {
    const today = startOfDay(new Date());

    // Past dates
    if (isBefore(date, today)) return true;

    // More than 60 days in the future
    const maxDate = startOfDay(new Date());
    maxDate.setDate(maxDate.getDate() + 60);
    if (date > maxDate) return true;

    // Closed days
    const dayOfWeek = date.getDay();
    if (closedJsDays.includes(dayOfWeek)) return true;

    return false;
  }

  /**
   * Fetch available slots when the date, service, or staff selection changes.
   * Passes the staffId to the server action (null = any available).
   */
  useEffect(() => {
    if (!selectedDate) {
      setAvailableSlots([]);
      setSlotsMessage("");
      return;
    }

    async function loadSlots() {
      setIsLoadingSlots(true);
      setSelectedSlot(null);
      setSlotsMessage("");

      try {
        const dateStr = format(selectedDate!, "yyyy-MM-dd");

        // Resolve staffId: null for "any available", string for specific
        const staffIdParam =
          selectedStaffId === ANY_AVAILABLE_VALUE ? null : selectedStaffId;

        const slots = await fetchAvailableSlots(
          businessId,
          currentService.id,
          dateStr,
          staffIdParam
        );

        setAvailableSlots(slots);

        if (slots.length === 0) {
          const staffNote =
            hasStaff && selectedStaffId !== ANY_AVAILABLE_VALUE
              ? " for this staff member"
              : "";
          setSlotsMessage(
            `No available time slots${staffNote} for this date. Try another date${hasStaff ? " or staff member" : ""}.`
          );
        }
      } catch {
        setSlotsMessage("Failed to load time slots. Please try again.");
        setAvailableSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    }

    loadSlots();
  }, [selectedDate, currentService.id, businessId, selectedStaffId, hasStaff]);

  /**
   * Handle service change from the dropdown.
   * Reset staff selection and slot state when service changes.
   */
  function handleServiceChange(serviceId: string) {
    const service = allServices.find((s) => s.id === serviceId);
    if (service) {
      setCurrentService(service);
      setSelectedSlot(null);
      setSelectedStaffId(ANY_AVAILABLE_VALUE);
    }
  }

  /**
   * Handle staff selection change.
   * Reset slot and date selection when staff changes.
   */
  function handleStaffChange(value: string) {
    setSelectedStaffId(value);
    setSelectedSlot(null);
    // Keep the selected date — just reload slots for the new staff
  }

  /**
   * Handle booking submission.
   */
  async function handleSubmit() {
    if (!selectedDate || !selectedSlot) {
      toast.error("Please select a date and time slot.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Resolve staffId: undefined for "any available", string for specific
      const staffIdToSubmit =
        selectedStaffId === ANY_AVAILABLE_VALUE ? undefined : selectedStaffId;

      const result = await createBooking({
        businessId,
        serviceId: currentService.id,
        date: format(selectedDate, "yyyy-MM-dd"),
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        notes: notes || "",
        staffId: staffIdToSubmit,
      });

      if (result.error) {
        toast.error(result.error);
        // Refresh slots in case the slot was taken
        if (
          result.error.includes("no longer available") ||
          result.error.includes("not available")
        ) {
          const dateStr = format(selectedDate, "yyyy-MM-dd");
          const staffIdParam =
            selectedStaffId === ANY_AVAILABLE_VALUE ? null : selectedStaffId;
          const freshSlots = await fetchAvailableSlots(
            businessId,
            currentService.id,
            dateStr,
            staffIdParam
          );
          setAvailableSlots(freshSlots);
          setSelectedSlot(null);
        }
        return;
      }

      if (result.success) {
        toast.success(result.success);
        router.push(`/bookings/${result.bookingId}/pay`);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  /** Display label for the selected staff member (for the booking summary). */
  const selectedStaffName =
    selectedStaffId === ANY_AVAILABLE_VALUE
      ? "Any Available"
      : (staffMembers.find((s) => s.id === selectedStaffId)?.name ??
        "Any Available");

  return (
    <div className="space-y-6">
      {/* Selected service summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Selected Service</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{currentService.name}</p>
              {currentService.description && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {currentService.description}
                </p>
              )}
              <p className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {formatDuration(currentService.duration)}
              </p>
            </div>
            <p className="text-lg font-semibold">
              {formatPrice(currentService.price)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Service selector (if multiple services available) */}
      {allServices.length > 1 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Change Service</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={currentService.id}
              onValueChange={handleServiceChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allServices.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} — {formatPrice(service.price)} (
                    {formatDuration(service.duration)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Staff selector — only rendered when business has staff */}
      {hasStaff && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCog className="h-4 w-4" />
              Select a Staff Member
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedStaffId} onValueChange={handleStaffChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {/* "Any Available" default option */}
                <SelectItem value={ANY_AVAILABLE_VALUE}>
                  <span className="flex items-center gap-2">
                    Any Available
                    <span className="text-xs text-muted-foreground">
                      — System assigns best available
                    </span>
                  </span>
                </SelectItem>

                {/* Individual staff members */}
                {staffMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <span className="flex items-center gap-2">
                      {member.name}
                      {member.title && (
                        <span className="text-xs text-muted-foreground">
                          — {member.title}
                        </span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Date selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarIcon className="h-4 w-4" />
            Select a Date
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="w-full max-w-sm p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={isDateDisabled}
              className="rounded-md border w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Time slot selection */}
      {selectedDate && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Select a Time — {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSlots ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="mr-2 h-5 w-5 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Loading available times...
                </span>
              </div>
            ) : availableSlots.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                {availableSlots.map((slot) => (
                  <Button
                    key={slot.startTime}
                    variant={
                      selectedSlot?.startTime === slot.startTime
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    className={cn(
                      "text-sm",
                      selectedSlot?.startTime === slot.startTime &&
                        "ring-2 ring-primary ring-offset-2"
                    )}
                    onClick={() => setSelectedSlot(slot)}
                    disabled={isSubmitting}
                  >
                    {slot.label}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {slotsMessage}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notes and confirmation */}
      {selectedSlot && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Additional Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="notes">Any special requests? (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., I'd prefer a specific style, or I have allergies..."
                className="mt-1.5 min-h-[80px] resize-y"
                maxLength={500}
                disabled={isSubmitting}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {notes.length}/500 characters
              </p>
            </div>

            <Separator />

            {/* Booking summary */}
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <h4 className="font-medium">Booking Summary</h4>
              <div className="grid gap-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service</span>
                  <span>{currentService.name}</span>
                </div>
                {/* Staff summary row — only shown when business has staff */}
                {hasStaff && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Staff</span>
                    <span>{selectedStaffName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span>{format(selectedDate!, "MMMM d, yyyy")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time</span>
                  <span>
                    {selectedSlot.label} (
                    {formatDuration(currentService.duration)})
                  </span>
                </div>
                <Separator className="my-1" />
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>{formatPrice(currentService.price)}</span>
                </div>
              </div>
            </div>

            {/* Confirm button */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Booking...
                </>
              ) : (
                `Confirm Booking — ${formatPrice(currentService.price)}`
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
