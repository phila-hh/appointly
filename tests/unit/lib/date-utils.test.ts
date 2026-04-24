/**
 * @file Date Utils Unit Tests
 * @description Tests for getDateRangeForPreset(), getComparisonPeriod(),
 * calculatePercentageChange(), and formatDateRange().
 *
 * Covers:
 *   - getDateRangeForPreset: all 10 presets including custom and default fallback
 *   - getComparisonPeriod: previous period calculation
 *   - calculatePercentageChange: growth percentage with edge cases
 *   - formatDateRange: human-readable formatting for same month,
 *     same year, and different years
 *
 * Time-sensitive presets (today, thisWeek, etc.) are tested by asserting on
 * structural properties (start <= end, correct day boundaries) rather than
 * hardcoded dates, so tests remain valid on any date they are run.
 *
 * Pure input/output — no database, no network.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getDateRangeForPreset,
  getComparisonPeriod,
  calculatePercentageChange,
  formatDateRange,
} from "@/lib/date-utils";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  subMonths,
} from "date-fns";

// ─────────────────────────────────────────────────────────────────────────────
// getDateRangeForPreset
// ─────────────────────────────────────────────────────────────────────────────

describe("getDateRangeForPreset", () => {
  // Pin the system clock so all tests run against a known date
  const FIXED_NOW = new Date("2027-06-15T12:00:00.000Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── today ───────────────────────────────────────────────────────────────

  it("'today' returns start and end of the current day", () => {
    const { start, end } = getDateRangeForPreset("today");
    expect(start).toEqual(startOfDay(FIXED_NOW));
    expect(end).toEqual(endOfDay(FIXED_NOW));
  });

  // ── yesterday ───────────────────────────────────────────────────────────

  it("'yesterday' returns start and end of the previous day", () => {
    const yesterday = subDays(FIXED_NOW, 1);
    const { start, end } = getDateRangeForPreset("yesterday");
    expect(start).toEqual(startOfDay(yesterday));
    expect(end).toEqual(endOfDay(yesterday));
  });

  // ── last7days ───────────────────────────────────────────────────────────

  it("'last7days' starts 6 days ago and ends today", () => {
    const { start, end } = getDateRangeForPreset("last7days");
    expect(start).toEqual(startOfDay(subDays(FIXED_NOW, 6)));
    expect(end).toEqual(endOfDay(FIXED_NOW));
  });

  it("'last7days' spans exactly 7 days", () => {
    const { start, end } = getDateRangeForPreset("last7days");
    const diffMs = end.getTime() - start.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    // 7 full days from start-of-day to end-of-day is just under 7 * 24h
    expect(diffDays).toBeGreaterThan(6);
    expect(diffDays).toBeLessThanOrEqual(7);
  });

  // ── last30days ──────────────────────────────────────────────────────────

  it("'last30days' starts 29 days ago and ends today", () => {
    const { start, end } = getDateRangeForPreset("last30days");
    expect(start).toEqual(startOfDay(subDays(FIXED_NOW, 29)));
    expect(end).toEqual(endOfDay(FIXED_NOW));
  });

  // ── last90days ──────────────────────────────────────────────────────────

  it("'last90days' starts 89 days ago and ends today", () => {
    const { start, end } = getDateRangeForPreset("last90days");
    expect(start).toEqual(startOfDay(subDays(FIXED_NOW, 89)));
    expect(end).toEqual(endOfDay(FIXED_NOW));
  });

  // ── thisWeek ────────────────────────────────────────────────────────────

  it("'thisWeek' starts on Monday and ends on Sunday of current week", () => {
    const { start, end } = getDateRangeForPreset("thisWeek");
    expect(start).toEqual(startOfWeek(FIXED_NOW, { weekStartsOn: 1 }));
    expect(end).toEqual(endOfWeek(FIXED_NOW, { weekStartsOn: 1 }));
  });

  it("'thisWeek' start is before or equal to today", () => {
    const { start } = getDateRangeForPreset("thisWeek");
    expect(start.getTime()).toBeLessThanOrEqual(FIXED_NOW.getTime());
  });

  // ── lastWeek ────────────────────────────────────────────────────────────

  it("'lastWeek' starts on Monday of last week", () => {
    const { start } = getDateRangeForPreset("lastWeek");
    const expectedStart = startOfWeek(subDays(FIXED_NOW, 7), {
      weekStartsOn: 1,
    });
    expect(start).toEqual(expectedStart);
  });

  it("'lastWeek' ends on Sunday of last week", () => {
    const { end } = getDateRangeForPreset("lastWeek");
    const expectedEnd = endOfWeek(subDays(FIXED_NOW, 7), { weekStartsOn: 1 });
    expect(end).toEqual(expectedEnd);
  });

  it("'lastWeek' end is before 'thisWeek' start", () => {
    const lastWeek = getDateRangeForPreset("lastWeek");
    const thisWeek = getDateRangeForPreset("thisWeek");
    expect(lastWeek.end.getTime()).toBeLessThan(thisWeek.start.getTime());
  });

  // ── thisMonth ───────────────────────────────────────────────────────────

  it("'thisMonth' starts on the first of the current month", () => {
    const { start } = getDateRangeForPreset("thisMonth");
    expect(start).toEqual(startOfMonth(FIXED_NOW));
  });

  it("'thisMonth' ends on the last day of the current month", () => {
    const { end } = getDateRangeForPreset("thisMonth");
    expect(end).toEqual(endOfMonth(FIXED_NOW));
  });

  // ── lastMonth ───────────────────────────────────────────────────────────

  it("'lastMonth' starts on the first of the previous month", () => {
    const { start } = getDateRangeForPreset("lastMonth");
    expect(start).toEqual(startOfMonth(subMonths(FIXED_NOW, 1)));
  });

  it("'lastMonth' ends on the last day of the previous month", () => {
    const { end } = getDateRangeForPreset("lastMonth");
    expect(end).toEqual(endOfMonth(subMonths(FIXED_NOW, 1)));
  });

  // ── custom ──────────────────────────────────────────────────────────────

  it("'custom' with provided dates returns start/end of those dates", () => {
    const customStart = new Date("2027-01-01");
    const customEnd = new Date("2027-01-31");
    const { start, end } = getDateRangeForPreset(
      "custom",
      customStart,
      customEnd
    );
    expect(start).toEqual(startOfDay(customStart));
    expect(end).toEqual(endOfDay(customEnd));
  });

  it("'custom' without dates falls back to last30days", () => {
    const fallback = getDateRangeForPreset("last30days");
    const custom = getDateRangeForPreset("custom");
    expect(custom.start).toEqual(fallback.start);
    expect(custom.end).toEqual(fallback.end);
  });

  // ── start is always before end ──────────────────────────────────────────

  it.each([
    "today",
    "yesterday",
    "last7days",
    "last30days",
    "last90days",
    "thisWeek",
    "lastWeek",
    "thisMonth",
    "lastMonth",
  ] as const)("'%s' always returns start before end", (preset) => {
    const { start, end } = getDateRangeForPreset(preset);
    expect(start.getTime()).toBeLessThanOrEqual(end.getTime());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getComparisonPeriod
// ─────────────────────────────────────────────────────────────────────────────

describe("getComparisonPeriod", () => {
  it("returns a period of equal length before the given range", () => {
    const start = new Date("2027-06-01");
    const end = new Date("2027-06-30");
    const { start: cmpStart, end: cmpEnd } = getComparisonPeriod(start, end);

    // The comparison period should span 30 days (same as input)
    const inputDays =
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1;
    const cmpDays =
      (cmpEnd.getTime() - cmpStart.getTime()) / (1000 * 60 * 60 * 24) + 1;
    expect(cmpDays).toBe(inputDays);
  });

  it("comparison period ends the day before the current period starts", () => {
    const start = new Date("2027-06-01");
    const end = new Date("2027-06-30");
    const { end: cmpEnd } = getComparisonPeriod(start, end);

    // cmpEnd should be exactly `days` before `end`
    const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1;
    const expectedCmpEnd = subDays(end, days);
    expect(cmpEnd).toEqual(expectedCmpEnd);
  });

  it("handles a single-day range", () => {
    const day = new Date("2027-06-15");
    const { start: cmpStart, end: cmpEnd } = getComparisonPeriod(day, day);

    // 1-day range → comparison is the previous 1 day
    expect(cmpStart).toEqual(subDays(day, 1));
    expect(cmpEnd).toEqual(subDays(day, 1));
  });

  it("comparison period start is before current period start", () => {
    const start = new Date("2027-06-01");
    const end = new Date("2027-06-30");
    const { start: cmpStart } = getComparisonPeriod(start, end);
    expect(cmpStart.getTime()).toBeLessThan(start.getTime());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calculatePercentageChange
// ─────────────────────────────────────────────────────────────────────────────

describe("calculatePercentageChange", () => {
  // ── Standard cases ──────────────────────────────────────────────────────

  it("calculates a 50% increase correctly", () => {
    expect(calculatePercentageChange(150, 100)).toBe(50);
  });

  it("calculates a 100% increase correctly", () => {
    expect(calculatePercentageChange(200, 100)).toBe(100);
  });

  it("calculates a 50% decrease correctly", () => {
    expect(calculatePercentageChange(50, 100)).toBe(-50);
  });

  it("calculates 0% change when values are equal", () => {
    expect(calculatePercentageChange(100, 100)).toBe(0);
  });

  it("calculates a fractional percentage", () => {
    expect(calculatePercentageChange(110, 100)).toBeCloseTo(10);
  });

  // ── Zero previous value (division guard) ───────────────────────────────

  it("returns 100 when previous is 0 and current is positive", () => {
    expect(calculatePercentageChange(50, 0)).toBe(100);
  });

  it("returns 0 when both previous and current are 0", () => {
    expect(calculatePercentageChange(0, 0)).toBe(0);
  });

  // ── Negative current ────────────────────────────────────────────────────

  it("calculates a negative change from a positive previous", () => {
    expect(calculatePercentageChange(0, 100)).toBe(-100);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// formatDateRange
// ─────────────────────────────────────────────────────────────────────────────

describe("formatDateRange", () => {
  // ── Same month and year ─────────────────────────────────────────────────

  it("formats a range within the same month and year", () => {
    const start = new Date("2027-06-01");
    const end = new Date("2027-06-30");
    expect(formatDateRange(start, end)).toBe("Jun 1 - 30, 2027");
  });

  it("formats a single-day range within a month", () => {
    const day = new Date("2027-06-15");
    expect(formatDateRange(day, day)).toBe("Jun 15 - 15, 2027");
  });

  // ── Same year, different months ─────────────────────────────────────────

  it("formats a range spanning two months in the same year", () => {
    const start = new Date("2027-01-01");
    const end = new Date("2027-03-31");
    expect(formatDateRange(start, end)).toBe("Jan 1 - Mar 31, 2027");
  });

  it("formats a range from January to December in same year", () => {
    const start = new Date("2027-01-01");
    const end = new Date("2027-12-31");
    expect(formatDateRange(start, end)).toBe("Jan 1 - Dec 31, 2027");
  });

  // ── Different years ─────────────────────────────────────────────────────

  it("formats a range spanning two different years", () => {
    const start = new Date("2026-12-01");
    const end = new Date("2027-01-31");
    expect(formatDateRange(start, end)).toBe("Dec 1, 2026 - Jan 31, 2027");
  });

  it("formats a multi-year range", () => {
    const start = new Date("2025-01-01");
    const end = new Date("2027-12-31");
    expect(formatDateRange(start, end)).toBe("Jan 1, 2025 - Dec 31, 2027");
  });
});
