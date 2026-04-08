/**
 * @file Calendar Utilities
 * @description Functions for generating calendar event files (.ics format).
 *
 * Generates .ics files compatible with:
 *   - Google Calendar
 *   - Apple Calendar
 *   - Outlook
 *   - Any iCalendar-compliant application
 *
 * @see https://datatracker.ietf.org/doc/html/rfc5545
 */

/**
 * Formats a date for iCalendar format (YYYYMMDDTHHMMSSZ).
 *
 * @param date - The date to format
 * @returns Formatted date string for .ics file
 *
 * @example
 * ```ts
 * formatICalDate(new Date("2025-03-15T10:00:00"))
 * // → "20250315T100000Z"
 * ```
 */
function formatICalDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escapes special characters for iCalendar text fields.
 *
 * @param text - The text to escape
 * @returns Escaped text safe for .ics format
 */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, "\\\\") // Backslash → \\
    .replace(/;/g, "\\;") // Semicolon → \;
    .replace(/,/g, "\\,") // Comma → \,
    .replace(/\n/g, "\\n"); // Newline → \n
}

/**
 * Parameters for generating a calendar event.
 */
export interface CalendarEventParams {
  /** Event title */
  title: string;
  /** Event description (optional) */
  description?: string;
  /** Event location (optional) */
  location?: string;
  /** Event start date and time */
  startDate: Date;
  /** Event end date and time */
  endDate: Date;
  /** Unique identifier for the event (booking ID) */
  uid: string;
}

/**
 * Generates an .ics file content string for a calendar event.
 *
 * @param params - Event parameters
 * @returns .ics file content as a string
 *
 * @example
 * ```ts
 * const icsContent = generateICalEvent({
 *   title: "Haircut at Fresh Cuts",
 *   description: "Classic Men's Haircut",
 *   location: "123 Main St, Austin, TX",
 *   startDate: new Date("2025-03-15T10:00:00"),
 *   endDate: new Date("2025-03-15T10:30:00"),
 *   uid: "booking-abc123",
 * });
 *
 * // Download the file
 * const blob = new Blob([icsContent], { type: "text/calendar" });
 * const url = URL.createObjectURL(blob);
 * const link = document.createElement("a");
 * link.href = url;
 * link.download = "appointment.ics";
 * link.click();
 * ```
 */
export function generateICalEvent(params: CalendarEventParams): string {
  const startDateFormatted = formatICalDate(params.startDate);
  const endDateFormatted = formatICalDate(params.endDate);
  const timestamp = formatICalDate(new Date());

  // Build the .ics file content
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Appointly//Booking System//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${params.uid}@appointly.com`,
    `DTSTAMP:${timestamp}`,
    `DTSTART:${startDateFormatted}`,
    `DTEND:${endDateFormatted}`,
    `SUMMARY:${escapeICalText(params.title)}`,
  ];

  if (params.description) {
    lines.push(`DESCRIPTION:${escapeICalText(params.description)}`);
  }

  if (params.location) {
    lines.push(`LOCATION:${escapeICalText(params.location)}`);
  }

  lines.push("STATUS:CONFIRMED", "SEQUENCE:0", "END:VEVENT", "END:VCALENDAR");

  // Join with CRLF (required by iCalendar spec)
  return lines.join("\r\n");
}

/**
 * Triggers a download of an .ics file in the browser.
 *
 * @param icsContent - The .ics file content
 * @param filename - The filename for the download (default: "appointment.ics")
 */
export function downloadICalFile(
  icsContent: string,
  filename: string = "appointment.ics"
): void {
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the object URL
  URL.revokeObjectURL(url);
}
