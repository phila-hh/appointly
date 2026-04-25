/**
 * @file Booking Validator Unit Tests
 * @description Tests for createBookingSchema, updateBookingStatusSchema,
 * and VALID_STATUS_TRANSITIONS map.
 *
 * Covers:
 *   - createBookingSchema: serviceId, businessId, date, startTime, endTime,
 *     notes, staffId
 *   - updateBookingStatusSchema: bookingId, status enum
 *   - VALID_STATUS_TRANSITIONS: allowed status change map
 *
 * Pure input/output — no database, no network.
 */

import { describe, it, expect } from "vitest";
import {
  createBookingSchema,
  updateBookingStatusSchema,
  VALID_STATUS_TRANSITIONS,
} from "@/lib/validators/booking";

// ─────────────────────────────────────────────────────────────────────────────
// createBookingSchema
// ─────────────────────────────────────────────────────────────────────────────

describe("createBookingSchema", () => {
  const validPayload = {
    serviceId: "clx123abc",
    businessId: "clx456def",
    date: "2027-06-15",
    startTime: "09:00",
    endTime: "10:00",
    notes: "Please be on time",
    staffId: "clx789ghi",
  };

  // ── Happy path ──────────────────────────────────────────────────────────

  it("accepts a fully valid booking", () => {
    const result = createBookingSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("accepts booking without optional notes", () => {
    const { notes: _notes, ...rest } = validPayload;
    const result = createBookingSchema.safeParse(rest);
    expect(result.success).toBe(true);
  });

  it("accepts booking with empty string notes", () => {
    const result = createBookingSchema.safeParse({
      ...validPayload,
      notes: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts booking without optional staffId", () => {
    const { staffId: _staffId, ...rest } = validPayload;
    const result = createBookingSchema.safeParse(rest);
    expect(result.success).toBe(true);
  });

  it("accepts booking with empty string staffId (any available)", () => {
    const result = createBookingSchema.safeParse({
      ...validPayload,
      staffId: "",
    });
    expect(result.success).toBe(true);
  });

  // ── serviceId validation ────────────────────────────────────────────────

  it("rejects empty serviceId", () => {
    const result = createBookingSchema.safeParse({
      ...validPayload,
      serviceId: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing serviceId", () => {
    const { serviceId: _serviceId, ...rest } = validPayload;
    const result = createBookingSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  // ── businessId validation ───────────────────────────────────────────────

  it("rejects empty businessId", () => {
    const result = createBookingSchema.safeParse({
      ...validPayload,
      businessId: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing businessId", () => {
    const { businessId: _businessId, ...rest } = validPayload;
    const result = createBookingSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  // ── date validation ─────────────────────────────────────────────────────

  it("rejects empty date", () => {
    const result = createBookingSchema.safeParse({
      ...validPayload,
      date: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing date", () => {
    const { date: _date, ...rest } = validPayload;
    const result = createBookingSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  // ── startTime validation (HH:mm regex) ──────────────────────────────────

  it("accepts valid start times", () => {
    const validTimes = ["00:00", "09:30", "12:00", "23:59"];
    for (const time of validTimes) {
      const result = createBookingSchema.safeParse({
        ...validPayload,
        startTime: time,
      });
      expect(result.success, `Expected ${time} to be valid`).toBe(true);
    }
  });

  it("rejects invalid start time formats", () => {
    const invalidTimes = ["9:00", "25:00", "12:60", "abc", "12:0", "1200"];
    for (const time of invalidTimes) {
      const result = createBookingSchema.safeParse({
        ...validPayload,
        startTime: time,
      });
      expect(result.success, `Expected ${time} to be invalid`).toBe(false);
    }
  });

  it("rejects empty startTime", () => {
    const result = createBookingSchema.safeParse({
      ...validPayload,
      startTime: "",
    });
    expect(result.success).toBe(false);
  });

  // ── endTime validation (HH:mm regex) ────────────────────────────────────

  it("accepts valid end times", () => {
    const validTimes = ["00:00", "10:30", "17:00", "23:59"];
    for (const time of validTimes) {
      const result = createBookingSchema.safeParse({
        ...validPayload,
        endTime: time,
      });
      expect(result.success, `Expected ${time} to be valid`).toBe(true);
    }
  });

  it("rejects invalid end time formats", () => {
    const invalidTimes = ["9:00", "24:01", "12:60", "xyz", ""];
    for (const time of invalidTimes) {
      const result = createBookingSchema.safeParse({
        ...validPayload,
        endTime: time,
      });
      expect(result.success, `Expected ${time} to be invalid`).toBe(false);
    }
  });

  // ── notes validation ────────────────────────────────────────────────────

  it("rejects notes exceeding 500 characters", () => {
    const result = createBookingSchema.safeParse({
      ...validPayload,
      notes: "A".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("accepts notes at exactly 500 characters", () => {
    const result = createBookingSchema.safeParse({
      ...validPayload,
      notes: "A".repeat(500),
    });
    expect(result.success).toBe(true);
  });

  // ── Missing everything ──────────────────────────────────────────────────

  it("rejects completely empty object", () => {
    const result = createBookingSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// updateBookingStatusSchema
// ─────────────────────────────────────────────────────────────────────────────

describe("updateBookingStatusSchema", () => {
  it("accepts valid status values", () => {
    const statuses = [
      "PENDING",
      "CONFIRMED",
      "CANCELLED",
      "COMPLETED",
      "NO_SHOW",
    ] as const;

    for (const status of statuses) {
      const result = updateBookingStatusSchema.safeParse({
        bookingId: "booking-1",
        status,
      });
      expect(result.success, `Expected ${status} to be valid`).toBe(true);
    }
  });

  it("rejects invalid status value", () => {
    const result = updateBookingStatusSchema.safeParse({
      bookingId: "booking-1",
      status: "INVALID_STATUS",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty bookingId", () => {
    const result = updateBookingStatusSchema.safeParse({
      bookingId: "",
      status: "CONFIRMED",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing bookingId", () => {
    const result = updateBookingStatusSchema.safeParse({
      status: "CONFIRMED",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing status", () => {
    const result = updateBookingStatusSchema.safeParse({
      bookingId: "booking-1",
    });
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// VALID_STATUS_TRANSITIONS
// ─────────────────────────────────────────────────────────────────────────────

describe("VALID_STATUS_TRANSITIONS", () => {
  it("allows PENDING → CONFIRMED", () => {
    expect(VALID_STATUS_TRANSITIONS["PENDING"]).toContain("CONFIRMED");
  });

  it("allows PENDING → CANCELLED", () => {
    expect(VALID_STATUS_TRANSITIONS["PENDING"]).toContain("CANCELLED");
  });

  it("does not allow PENDING → COMPLETED directly", () => {
    expect(VALID_STATUS_TRANSITIONS["PENDING"]).not.toContain("COMPLETED");
  });

  it("allows CONFIRMED → COMPLETED", () => {
    expect(VALID_STATUS_TRANSITIONS["CONFIRMED"]).toContain("COMPLETED");
  });

  it("allows CONFIRMED → CANCELLED", () => {
    expect(VALID_STATUS_TRANSITIONS["CONFIRMED"]).toContain("CANCELLED");
  });

  it("allows CONFIRMED → NO_SHOW", () => {
    expect(VALID_STATUS_TRANSITIONS["CONFIRMED"]).toContain("NO_SHOW");
  });

  it("does not allow COMPLETED → any transition", () => {
    expect(VALID_STATUS_TRANSITIONS["COMPLETED"]).toHaveLength(0);
  });

  it("does not allow CANCELLED → any transition", () => {
    expect(VALID_STATUS_TRANSITIONS["CANCELLED"]).toHaveLength(0);
  });

  it("does not allow NO_SHOW → any transition", () => {
    expect(VALID_STATUS_TRANSITIONS["NO_SHOW"]).toHaveLength(0);
  });

  it("has entries for all 5 statuses", () => {
    const expectedStatuses = [
      "PENDING",
      "CONFIRMED",
      "COMPLETED",
      "CANCELLED",
      "NO_SHOW",
    ];
    expect(Object.keys(VALID_STATUS_TRANSITIONS).sort()).toEqual(
      expectedStatuses.sort()
    );
  });
});
