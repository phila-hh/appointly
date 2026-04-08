/**
 * @file Add to Calendar Button Component
 * @description Button that generates and downloads an .ics calendar file.
 *
 * Compatible with:
 *   - Google Calendar
 *   - Apple Calendar (iCal)
 *   - Microsoft Outlook
 *   - Any iCalendar-compatible application
 */

"use client";

import { Calendar } from "lucide-react";

import { generateICalEvent, downloadICalFile } from "@/lib/calendar-utils";
import { Button } from "@/components/ui/button";

interface AddToCalendarButtonProps {
  event: {
    title: string;
    description?: string;
    location?: string;
    startDate: Date;
    startTime: string; // "HH:mm" format
    endTime: string; // "HH:mm" format
    bookingId: string;
  };
}

export function AddToCalendarButton({ event }: AddToCalendarButtonProps) {
  function handleAddToCalendar() {
    // Combine date and time into full Date objects
    const [startHour, startMinute] = event.startTime.split(":").map(Number);
    const [endHour, endMinute] = event.endTime.split(":").map(Number);

    const startDate = new Date(event.startDate);
    startDate.setHours(startHour, startMinute, 0, 0);

    const endDate = new Date(event.startDate);
    endDate.setHours(endHour, endMinute, 0, 0);

    // Generate the .ics file content
    const icsContent = generateICalEvent({
      title: event.title,
      description: event.description,
      location: event.location,
      startDate,
      endDate,
      uid: event.bookingId,
    });

    // Trigger download
    downloadICalFile(
      icsContent,
      `appointment-${event.bookingId.slice(-8)}.ics`
    );
  }

  return (
    <Button variant="outline" className="w-full" onClick={handleAddToCalendar}>
      <Calendar className="mr-2 h-4 w-4" />
      Add to Calendar
    </Button>
  );
}
