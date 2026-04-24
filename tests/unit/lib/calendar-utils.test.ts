/**
 * @file Calendar Utils Unit Tests
 * @description Tests for generateICalEvent() — the ICS content generator.
 *
 * Covers:
 *   - Required fields are present in output (UID, DTSTART, DTEND, SUMMARY)
 *   - Optional fields only appear when provided (DESCRIPTION, LOCATION)
 *   - iCalendar structure is valid (BEGIN/END blocks, VERSION, METHOD)
 *   - Dates are formatted in UTC iCalendar format (YYYYMMDDTHHMMSSZ)
 *   - Special characters in text fields are correctly escaped
 *   - Lines are joined with CRLF as required by RFC 5545
 *
 * Note: downloadICalFile() is NOT tested here — it calls
 * URL.createObjectURL and DOM methods that jsdom does not support.
 * That function is a thin browser wrapper and is covered by E2E tests.
 *
 * Pure input/output — no database, no network.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { generateICalEvent } from "@/lib/calendar-utils";

describe("generateICalEvent", () => {
  // Pin system clock so DTSTAMP is deterministic
  const FIXED_NOW = new Date("2027-06-15T12:00:00.000Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const baseParams = {
    title: "Haircut at Fresh Cuts",
    startDate: new Date("2027-07-01T09:00:00.000Z"),
    endDate: new Date("2027-07-01T09:30:00.000Z"),
    uid: "booking-abc123",
  };

  // ── iCalendar structure ─────────────────────────────────────────────────

  it("begins with BEGIN:VCALENDAR", () => {
    const result = generateICalEvent(baseParams);
    expect(result.startsWith("BEGIN:VCALENDAR")).toBe(true);
  });

  it("ends with END:VCALENDAR", () => {
    const result = generateICalEvent(baseParams);
    expect(result.endsWith("END:VCALENDAR")).toBe(true);
  });

  it("contains a VEVENT block", () => {
    const result = generateICalEvent(baseParams);
    expect(result).toContain("BEGIN:VEVENT");
    expect(result).toContain("END:VEVENT");
  });

  it("includes VERSION:2.0", () => {
    const result = generateICalEvent(baseParams);
    expect(result).toContain("VERSION:2.0");
  });

  it("includes CALSCALE:GREGORIAN", () => {
    const result = generateICalEvent(baseParams);
    expect(result).toContain("CALSCALE:GREGORIAN");
  });

  it("includes METHOD:PUBLISH", () => {
    const result = generateICalEvent(baseParams);
    expect(result).toContain("METHOD:PUBLISH");
  });

  it("includes STATUS:CONFIRMED", () => {
    const result = generateICalEvent(baseParams);
    expect(result).toContain("STATUS:CONFIRMED");
  });

  it("uses CRLF line endings as required by RFC 5545", () => {
    const result = generateICalEvent(baseParams);
    expect(result).toContain("\r\n");
    // Every line break should be CRLF — no bare LF
    const bareNewlines = result.split("\r\n").join("").includes("\n");
    expect(bareNewlines).toBe(false);
  });

  // ── Required fields ─────────────────────────────────────────────────────

  it("includes UID with @appointly.com suffix", () => {
    const result = generateICalEvent(baseParams);
    expect(result).toContain("UID:booking-abc123@appointly.com");
  });

  it("includes SUMMARY from the title", () => {
    const result = generateICalEvent(baseParams);
    expect(result).toContain("SUMMARY:Haircut at Fresh Cuts");
  });

  it("includes DTSTART in UTC iCalendar format", () => {
    const result = generateICalEvent(baseParams);
    expect(result).toContain("DTSTART:20270701T090000Z");
  });

  it("includes DTEND in UTC iCalendar format", () => {
    const result = generateICalEvent(baseParams);
    expect(result).toContain("DTEND:20270701T093000Z");
  });

  it("includes DTSTAMP for the current time", () => {
    const result = generateICalEvent(baseParams);
    // Fixed to 2027-06-15T12:00:00Z
    expect(result).toContain("DTSTAMP:20270615T120000Z");
  });

  it("includes the Appointly PRODID", () => {
    const result = generateICalEvent(baseParams);
    expect(result).toContain("PRODID:-//Appointly//Booking System//EN");
  });

  // ── Optional fields ─────────────────────────────────────────────────────

  it("includes DESCRIPTION when provided", () => {
    const result = generateICalEvent({
      ...baseParams,
      description: "Classic haircut",
    });
    expect(result).toContain("DESCRIPTION:Classic haircut");
  });

  it("does NOT include DESCRIPTION when not provided", () => {
    const result = generateICalEvent(baseParams);
    expect(result).not.toContain("DESCRIPTION:");
  });

  it("includes LOCATION when provided", () => {
    const result = generateICalEvent({
      ...baseParams,
      location: "123 Bole Road, Addis Ababa",
    });
    expect(result).toContain("LOCATION:123 Bole Road\\, Addis Ababa");
  });

  it("does NOT include LOCATION when not provided", () => {
    const result = generateICalEvent(baseParams);
    expect(result).not.toContain("LOCATION:");
  });

  // ── Text escaping ───────────────────────────────────────────────────────

  it("escapes commas in the title", () => {
    const result = generateICalEvent({
      ...baseParams,
      title: "Cut, Style, and Wash",
    });
    expect(result).toContain("SUMMARY:Cut\\, Style\\, and Wash");
  });

  it("escapes semicolons in the title", () => {
    const result = generateICalEvent({
      ...baseParams,
      title: "Cut; Style",
    });
    expect(result).toContain("SUMMARY:Cut\\; Style");
  });

  it("escapes backslashes in the description", () => {
    const result = generateICalEvent({
      ...baseParams,
      description: "Path: C:\\Users\\test",
    });
    expect(result).toContain("DESCRIPTION:Path: C:\\\\Users\\\\test");
  });

  it("escapes newlines in the description", () => {
    const result = generateICalEvent({
      ...baseParams,
      description: "Line one\nLine two",
    });
    expect(result).toContain("DESCRIPTION:Line one\\nLine two");
  });

  it("escapes commas in the location", () => {
    const result = generateICalEvent({
      ...baseParams,
      location: "Addis Ababa, Ethiopia",
    });
    expect(result).toContain("LOCATION:Addis Ababa\\, Ethiopia");
  });

  // ── Date formatting edge cases ──────────────────────────────────────────

  it("correctly formats midnight UTC", () => {
    const result = generateICalEvent({
      ...baseParams,
      startDate: new Date("2027-01-01T00:00:00.000Z"),
    });
    expect(result).toContain("DTSTART:20270101T000000Z");
  });

  it("correctly formats end of day UTC", () => {
    const result = generateICalEvent({
      ...baseParams,
      endDate: new Date("2027-12-31T23:59:59.000Z"),
    });
    expect(result).toContain("DTEND:20271231T235959Z");
  });

  it("pads single-digit months and days with zeros", () => {
    const result = generateICalEvent({
      ...baseParams,
      startDate: new Date("2027-01-05T09:05:00.000Z"),
    });
    expect(result).toContain("DTSTART:20270105T090500Z");
  });
});
