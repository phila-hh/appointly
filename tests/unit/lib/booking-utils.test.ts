/**
 * @file Booking Utils Unit Tests
 * @description Tests for all exported functions in booking-utils.ts.
 *
 * Covers:
 *   - timeToMinutes: "HH:mm" → total minutes
 *   - minutesToTime: total minutes → "HH:mm"
 *   - rangesOverlap: half-open interval overlap detection
 *   - getDayOfWeek: Date → DayOfWeek enum string
 *   - canCancelForFree: >24h before appointment check
 *   - getCancellationDeadline: appointment time minus 24 hours
 *   - generateAvailableSlots: single-provider slot generation algorithm
 *   - generateStaffAwareSlots: multi-provider slot generation (any + specific)
 *   - selectStaffRoundRobin: round-robin assignment with mocked DB
 *
 * Note: generateAvailableSlots and generateStaffAwareSlots filter past slots
 * when isToday is true. These tests use fake timers to pin the clock so
 * results are deterministic regardless of when the tests run.
 *
 * Pure input/output — selectStaffRoundRobin receives a mock db object,
 * no real database is used.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  timeToMinutes,
  minutesToTime,
  rangesOverlap,
  getDayOfWeek,
  canCancelForFree,
  getCancellationDeadline,
  generateAvailableSlots,
  generateStaffAwareSlots,
  selectStaffRoundRobin,
  type StaffAvailabilityInput,
} from "@/lib/booking-utils";

// ─────────────────────────────────────────────────────────────────────────────
// timeToMinutes
// ─────────────────────────────────────────────────────────────────────────────

describe("timeToMinutes", () => {
  it("converts midnight to 0", () => {
    expect(timeToMinutes("00:00")).toBe(0);
  });

  it("converts 09:00 to 540", () => {
    expect(timeToMinutes("09:00")).toBe(540);
  });

  it("converts 14:30 to 870", () => {
    expect(timeToMinutes("14:30")).toBe(870);
  });

  it("converts 23:59 to 1439", () => {
    expect(timeToMinutes("23:59")).toBe(1439);
  });

  it("converts 12:00 to 720", () => {
    expect(timeToMinutes("12:00")).toBe(720);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// minutesToTime
// ─────────────────────────────────────────────────────────────────────────────

describe("minutesToTime", () => {
  it("converts 0 to '00:00'", () => {
    expect(minutesToTime(0)).toBe("00:00");
  });

  it("converts 540 to '09:00'", () => {
    expect(minutesToTime(540)).toBe("09:00");
  });

  it("converts 870 to '14:30'", () => {
    expect(minutesToTime(870)).toBe("14:30");
  });

  it("converts 1439 to '23:59'", () => {
    expect(minutesToTime(1439)).toBe("23:59");
  });

  it("pads single-digit hours with a zero", () => {
    expect(minutesToTime(60)).toBe("01:00");
  });

  it("pads single-digit minutes with a zero", () => {
    expect(minutesToTime(545)).toBe("09:05");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// roundtrip: timeToMinutes → minutesToTime
// ─────────────────────────────────────────────────────────────────────────────

describe("timeToMinutes / minutesToTime roundtrip", () => {
  const times = ["00:00", "09:00", "09:30", "12:00", "14:30", "23:59"];

  it.each(times)("roundtrips '%s' correctly", (time) => {
    expect(minutesToTime(timeToMinutes(time))).toBe(time);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// rangesOverlap
// ─────────────────────────────────────────────────────────────────────────────

describe("rangesOverlap", () => {
  // Using minutes directly: 09:00=540, 10:00=600, 10:30=630, 11:00=660

  it("returns true for ranges that fully overlap", () => {
    expect(rangesOverlap(540, 660, 540, 660)).toBe(true);
  });

  it("returns true for ranges that partially overlap", () => {
    // A: 09:00-10:30, B: 10:00-11:00 → overlap 10:00-10:30
    expect(rangesOverlap(540, 630, 600, 660)).toBe(true);
  });

  it("returns true when A is fully inside B", () => {
    // A: 09:30-10:00, B: 09:00-11:00
    expect(rangesOverlap(570, 600, 540, 660)).toBe(true);
  });

  it("returns true when B is fully inside A", () => {
    // A: 09:00-11:00, B: 09:30-10:00
    expect(rangesOverlap(540, 660, 570, 600)).toBe(true);
  });

  it("returns false for adjacent ranges (A end equals B start — half-open)", () => {
    // A: 09:00-10:00, B: 10:00-11:00 → no overlap (half-open interval)
    expect(rangesOverlap(540, 600, 600, 660)).toBe(false);
  });

  it("returns false when A is entirely before B", () => {
    // A: 09:00-09:30, B: 10:00-11:00
    expect(rangesOverlap(540, 570, 600, 660)).toBe(false);
  });

  it("returns false when B is entirely before A", () => {
    // A: 10:00-11:00, B: 09:00-09:30
    expect(rangesOverlap(600, 660, 540, 570)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getDayOfWeek
// ─────────────────────────────────────────────────────────────────────────────

describe("getDayOfWeek", () => {
  it("returns MONDAY for a known Monday", () => {
    expect(getDayOfWeek(new Date("2027-06-14"))).toBe("MONDAY");
  });

  it("returns TUESDAY for a known Tuesday", () => {
    expect(getDayOfWeek(new Date("2027-06-15"))).toBe("TUESDAY");
  });

  it("returns WEDNESDAY for a known Wednesday", () => {
    expect(getDayOfWeek(new Date("2027-06-16"))).toBe("WEDNESDAY");
  });

  it("returns THURSDAY for a known Thursday", () => {
    expect(getDayOfWeek(new Date("2027-06-17"))).toBe("THURSDAY");
  });

  it("returns FRIDAY for a known Friday", () => {
    expect(getDayOfWeek(new Date("2027-06-18"))).toBe("FRIDAY");
  });

  it("returns SATURDAY for a known Saturday", () => {
    expect(getDayOfWeek(new Date("2027-06-19"))).toBe("SATURDAY");
  });

  it("returns SUNDAY for a known Sunday", () => {
    expect(getDayOfWeek(new Date("2027-06-20"))).toBe("SUNDAY");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// canCancelForFree
// ─────────────────────────────────────────────────────────────────────────────

describe("canCancelForFree", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Pin clock to 2027-06-15 at 10:00 AM
    vi.setSystemTime(new Date("2027-06-15T10:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns true when appointment is more than 24h away", () => {
    // Appointment is 2027-06-17 at 10:00 — 48h from now
    const bookingDate = new Date("2027-06-17");
    expect(canCancelForFree(bookingDate, "10:00")).toBe(true);
  });

  it("returns false when appointment is less than 24h away", () => {
    // Appointment is 2027-06-15 at 22:00 — 12h from now
    const bookingDate = new Date("2027-06-15");
    expect(canCancelForFree(bookingDate, "22:00")).toBe(false);
  });

  it("returns false when appointment is exactly 24h away", () => {
    // Appointment is 2027-06-16 at 10:00 — exactly 24h (not > 24h)
    const bookingDate = new Date("2027-06-16");
    expect(canCancelForFree(bookingDate, "10:00")).toBe(false);
  });

  it("returns false for an appointment in the past", () => {
    const bookingDate = new Date("2027-06-14");
    expect(canCancelForFree(bookingDate, "09:00")).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getCancellationDeadline
// ─────────────────────────────────────────────────────────────────────────────

describe("getCancellationDeadline", () => {
  it("returns exactly 24 hours before the appointment", () => {
    const bookingDate = new Date("2027-06-15");
    const deadline = getCancellationDeadline(bookingDate, "10:00");

    // Appointment is 2027-06-15 10:00 → deadline is 2027-06-14 10:00
    const expected = new Date("2027-06-14T10:00:00.000");
    expect(deadline.getHours()).toBe(expected.getHours());
    expect(deadline.getMinutes()).toBe(expected.getMinutes());
    expect(deadline.getDate()).toBe(expected.getDate());
  });

  it("calculates deadline correctly for a late evening appointment", () => {
    const bookingDate = new Date("2027-06-15");
    const deadline = getCancellationDeadline(bookingDate, "23:30");

    const appointmentMs = new Date("2027-06-15").setHours(23, 30, 0, 0);
    const expectedDeadlineMs = appointmentMs - 24 * 60 * 60 * 1000;
    expect(deadline.getTime()).toBe(expectedDeadlineMs);
  });

  it("deadline is always before the appointment", () => {
    const bookingDate = new Date("2027-06-15");
    const deadline = getCancellationDeadline(bookingDate, "14:00");

    const appointmentMs = new Date("2027-06-15").setHours(14, 0, 0, 0);
    expect(deadline.getTime()).toBeLessThan(appointmentMs);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateAvailableSlots (single-provider)
// ─────────────────────────────────────────────────────────────────────────────

describe("generateAvailableSlots", () => {
  // Pin clock to 2027-06-15 at 08:00 AM so all morning slots are available
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-06-15T08:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const baseParams = {
    openTime: "09:00",
    closeTime: "11:00",
    serviceDuration: 30,
    existingBookings: [],
    isToday: false,
  };

  // ── Slot generation ─────────────────────────────────────────────────────

  it("generates slots at 30-minute intervals", () => {
    const slots = generateAvailableSlots(baseParams);
    // 09:00-11:00 with 30-min service: 09:00, 09:30, 10:00, 10:30
    expect(slots).toHaveLength(4);
    expect(slots[0].startTime).toBe("09:00");
    expect(slots[0].endTime).toBe("09:30");
    expect(slots[1].startTime).toBe("09:30");
    expect(slots[1].endTime).toBe("10:00");
  });

  it("does not generate a slot that would extend past closing time", () => {
    // 09:00-10:00 with 60-min service: only one slot 09:00-10:00
    const slots = generateAvailableSlots({
      ...baseParams,
      closeTime: "10:00",
      serviceDuration: 60,
    });
    expect(slots).toHaveLength(1);
    expect(slots[0].startTime).toBe("09:00");
    expect(slots[0].endTime).toBe("10:00");
  });

  it("returns empty array when window is too small for the service", () => {
    // 09:00-09:20 window with 30-min service → no slots fit
    const slots = generateAvailableSlots({
      ...baseParams,
      closeTime: "09:20",
      serviceDuration: 30,
    });
    expect(slots).toHaveLength(0);
  });

  // ── Conflict filtering ──────────────────────────────────────────────────

  it("removes slots that overlap with an existing booking", () => {
    const slots = generateAvailableSlots({
      ...baseParams,
      existingBookings: [{ startTime: "09:00", endTime: "09:30" }],
    });
    const startTimes = slots.map((s) => s.startTime);
    expect(startTimes).not.toContain("09:00");
  });

  it("keeps slots that are adjacent to (not overlapping) an existing booking", () => {
    // Booking is 09:00-09:30, slot 09:30-10:00 should still be available
    const slots = generateAvailableSlots({
      ...baseParams,
      existingBookings: [{ startTime: "09:00", endTime: "09:30" }],
    });
    const startTimes = slots.map((s) => s.startTime);
    expect(startTimes).toContain("09:30");
  });

  it("removes multiple conflicting slots for a long booking", () => {
    // Booking 09:00-10:30 blocks 09:00, 09:30, and 10:00 slots
    const slots = generateAvailableSlots({
      ...baseParams,
      closeTime: "12:00",
      existingBookings: [{ startTime: "09:00", endTime: "10:30" }],
    });
    const startTimes = slots.map((s) => s.startTime);
    expect(startTimes).not.toContain("09:00");
    expect(startTimes).not.toContain("09:30");
    expect(startTimes).not.toContain("10:00");
    expect(startTimes).toContain("10:30");
  });

  // ── isToday filtering ───────────────────────────────────────────────────

  it("filters out past slots when isToday is true", () => {
    // Clock is at 08:00 — 09:00 slot is more than 30 min away so it passes
    // but if clock were at 09:00 the 09:00 slot would be filtered
    vi.setSystemTime(new Date("2027-06-15T09:30:00.000Z")); // now is 09:30
    const slots = generateAvailableSlots({ ...baseParams, isToday: true });
    // 09:00 and 09:30 slots are within 30 min of now (09:30), so filtered out
    const startTimes = slots.map((s) => s.startTime);
    expect(startTimes).not.toContain("09:00");
    expect(startTimes).not.toContain("09:30");
  });

  it("does NOT filter past slots when isToday is false", () => {
    vi.setSystemTime(new Date("2027-06-15T09:30:00.000Z"));
    const slots = generateAvailableSlots({ ...baseParams, isToday: false });
    const startTimes = slots.map((s) => s.startTime);
    expect(startTimes).toContain("09:00");
  });

  // ── Slot shape ──────────────────────────────────────────────────────────

  it("each slot has startTime, endTime, and label", () => {
    const slots = generateAvailableSlots(baseParams);
    expect(slots.length).toBeGreaterThan(0);
    slots.forEach((slot) => {
      expect(slot).toHaveProperty("startTime");
      expect(slot).toHaveProperty("endTime");
      expect(slot).toHaveProperty("label");
    });
  });

  it("slot label uses 12-hour AM/PM format", () => {
    const slots = generateAvailableSlots(baseParams);
    // 09:00 → "9:00 AM"
    expect(slots[0].label).toBe("9:00 AM");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateStaffAwareSlots (multi-provider)
// ─────────────────────────────────────────────────────────────────────────────

describe("generateStaffAwareSlots", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Pin to 08:00 so all 09:00+ slots are in the future
    vi.setSystemTime(new Date("2027-06-15T08:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** Builds a staff member who works 09:00-17:00 with no bookings */
  function buildStaff(
    id: string,
    overrides: Partial<StaffAvailabilityInput> = {}
  ): StaffAvailabilityInput {
    return {
      id,
      name: `Staff ${id}`,
      hours: {
        openTime: "09:00",
        closeTime: "17:00",
        isClosed: false,
      },
      existingBookings: [],
      ...overrides,
    };
  }

  const baseParams = {
    businessOpenTime: "09:00",
    businessCloseTime: "11:00",
    serviceDuration: 30,
    isToday: false,
  };

  // ── Any available mode ──────────────────────────────────────────────────

  it("returns slots when at least one staff member is free", () => {
    const slots = generateStaffAwareSlots({
      ...baseParams,
      staffMembers: [buildStaff("s1"), buildStaff("s2")],
    });
    expect(slots.length).toBeGreaterThan(0);
  });

  it("includes all available staff IDs in each slot", () => {
    const slots = generateStaffAwareSlots({
      ...baseParams,
      staffMembers: [buildStaff("s1"), buildStaff("s2")],
    });
    expect(slots[0].availableStaffIds).toContain("s1");
    expect(slots[0].availableStaffIds).toContain("s2");
  });

  it("slot is available when only one of two staff is free", () => {
    const staffWithBooking = buildStaff("s1", {
      existingBookings: [{ startTime: "09:00", endTime: "09:30" }],
    });
    const freeStaff = buildStaff("s2");

    const slots = generateStaffAwareSlots({
      ...baseParams,
      staffMembers: [staffWithBooking, freeStaff],
    });

    const nineAmSlot = slots.find((s) => s.startTime === "09:00");
    expect(nineAmSlot).toBeDefined();
    expect(nineAmSlot?.availableStaffIds).not.toContain("s1");
    expect(nineAmSlot?.availableStaffIds).toContain("s2");
  });

  it("excludes slot when ALL staff are booked for that time", () => {
    const params = {
      ...baseParams,
      staffMembers: [
        buildStaff("s1", {
          existingBookings: [{ startTime: "09:00", endTime: "09:30" }],
        }),
        buildStaff("s2", {
          existingBookings: [{ startTime: "09:00", endTime: "09:30" }],
        }),
      ],
    };
    const slots = generateStaffAwareSlots(params);
    const startTimes = slots.map((s) => s.startTime);
    expect(startTimes).not.toContain("09:00");
  });

  it("excludes staff who are closed for the day", () => {
    const closedStaff = buildStaff("s1", {
      hours: { openTime: "09:00", closeTime: "17:00", isClosed: true },
    });
    const openStaff = buildStaff("s2");

    const slots = generateStaffAwareSlots({
      ...baseParams,
      staffMembers: [closedStaff, openStaff],
    });

    slots.forEach((slot) => {
      expect(slot.availableStaffIds).not.toContain("s1");
    });
  });

  it("excludes staff who have no hours configured for this day", () => {
    const noHoursStaff = buildStaff("s1", { hours: null });
    const normalStaff = buildStaff("s2");

    const slots = generateStaffAwareSlots({
      ...baseParams,
      staffMembers: [noHoursStaff, normalStaff],
    });

    slots.forEach((slot) => {
      expect(slot.availableStaffIds).not.toContain("s1");
    });
  });

  it("returns empty array when no staff members provided", () => {
    const slots = generateStaffAwareSlots({
      ...baseParams,
      staffMembers: [],
    });
    expect(slots).toHaveLength(0);
  });

  // ── Specific staff mode ─────────────────────────────────────────────────

  it("only considers the selected staff member when selectedStaffId is set", () => {
    const busyStaff = buildStaff("s1", {
      existingBookings: [{ startTime: "09:00", endTime: "09:30" }],
    });
    const freeStaff = buildStaff("s2");

    const slots = generateStaffAwareSlots({
      ...baseParams,
      staffMembers: [busyStaff, freeStaff],
      selectedStaffId: "s1",
    });

    // s1 is busy at 09:00 so that slot should not appear
    const startTimes = slots.map((s) => s.startTime);
    expect(startTimes).not.toContain("09:00");
  });

  it("returns empty when selected staff id does not match any member", () => {
    const slots = generateStaffAwareSlots({
      ...baseParams,
      staffMembers: [buildStaff("s1")],
      selectedStaffId: "nonexistent",
    });
    expect(slots).toHaveLength(0);
  });

  // ── Business hours as outer boundary ───────────────────────────────────

  it("does not generate slots outside business hours even if staff is available", () => {
    const staffWithWideHours = buildStaff("s1", {
      hours: { openTime: "07:00", closeTime: "22:00", isClosed: false },
    });

    const slots = generateStaffAwareSlots({
      ...baseParams,
      businessOpenTime: "09:00",
      businessCloseTime: "11:00",
      staffMembers: [staffWithWideHours],
    });

    slots.forEach((slot) => {
      expect(timeToMinutes(slot.startTime)).toBeGreaterThanOrEqual(
        timeToMinutes("09:00")
      );
      expect(timeToMinutes(slot.endTime)).toBeLessThanOrEqual(
        timeToMinutes("11:00")
      );
    });
  });

  // ── Slot shape ──────────────────────────────────────────────────────────

  it("each slot has startTime, endTime, label, and availableStaffIds", () => {
    const slots = generateStaffAwareSlots({
      ...baseParams,
      staffMembers: [buildStaff("s1")],
    });
    expect(slots.length).toBeGreaterThan(0);
    slots.forEach((slot) => {
      expect(slot).toHaveProperty("startTime");
      expect(slot).toHaveProperty("endTime");
      expect(slot).toHaveProperty("label");
      expect(slot).toHaveProperty("availableStaffIds");
      expect(Array.isArray(slot.availableStaffIds)).toBe(true);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// selectStaffRoundRobin
// ─────────────────────────────────────────────────────────────────────────────

describe("selectStaffRoundRobin", () => {
  const bookingDate = new Date("2027-06-15");

  /** Builds a mock db that returns the count you specify per staffId */
  function buildMockDb(counts: Record<string, number>) {
    return {
      booking: {
        count: vi.fn(async ({ where }: { where: { staffId: string } }) => {
          return counts[where.staffId] ?? 0;
        }),
      },
    };
  }

  it("returns null when no staff IDs provided", async () => {
    const db = buildMockDb({});
    const result = await selectStaffRoundRobin([], bookingDate, db);
    expect(result).toBeNull();
  });

  it("returns the only staff ID without querying when only one is provided", async () => {
    const db = buildMockDb({});
    const result = await selectStaffRoundRobin(["s1"], bookingDate, db);
    expect(result).toBe("s1");
    expect(db.booking.count).not.toHaveBeenCalled();
  });

  it("selects the staff member with the fewest bookings", async () => {
    const db = buildMockDb({ s1: 3, s2: 1, s3: 2 });
    const result = await selectStaffRoundRobin(
      ["s1", "s2", "s3"],
      bookingDate,
      db
    );
    expect(result).toBe("s2");
  });

  it("selects the first staff member in case of a tie", async () => {
    // s1 and s2 both have 2 bookings — s1 comes first in the input array
    const db = buildMockDb({ s1: 2, s2: 2 });
    const result = await selectStaffRoundRobin(["s1", "s2"], bookingDate, db);
    expect(result).toBe("s1");
  });

  it("selects staff with 0 bookings over staff with any bookings", async () => {
    const db = buildMockDb({ s1: 5, s2: 0 });
    const result = await selectStaffRoundRobin(["s1", "s2"], bookingDate, db);
    expect(result).toBe("s2");
  });

  it("queries the database for each provided staff ID", async () => {
    const db = buildMockDb({ s1: 1, s2: 2 });
    await selectStaffRoundRobin(["s1", "s2"], bookingDate, db);
    expect(db.booking.count).toHaveBeenCalledTimes(2);
  });
});
