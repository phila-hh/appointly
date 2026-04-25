/**
 * @file Staff Validator Unit Tests
 * @description Tests for staffSchema, staffServiceSchema, and staffHoursSchema.
 *
 * Covers:
 *   - staffSchema: name (required), email/phone/title (optional)
 *   - staffServiceSchema: staffId + serviceIds array (min 1)
 *   - staffHoursSchema: staffId + 7-day schedule with time validation
 *     and open < close refinement
 *
 * Pure input/output — no database, no network.
 */

import { describe, it, expect } from "vitest";
import {
  staffSchema,
  staffServiceSchema,
  staffHoursSchema,
} from "@/lib/validators/staff";

// ─────────────────────────────────────────────────────────────────────────────
// staffSchema
// ─────────────────────────────────────────────────────────────────────────────

describe("staffSchema", () => {
  const validPayload = {
    name: "Jane Smith",
    email: "jane@example.com",
    phone: "+251911223344",
    title: "Senior Stylist",
  };

  // ── Happy path ──────────────────────────────────────────────────────────

  it("accepts a fully valid staff member", () => {
    const result = staffSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("accepts staff with only required name field", () => {
    const result = staffSchema.safeParse({ name: "Jane Smith" });
    expect(result.success).toBe(true);
  });

  it("accepts staff with empty string optional fields", () => {
    const result = staffSchema.safeParse({
      name: "Jane Smith",
      email: "",
      phone: "",
      title: "",
    });
    expect(result.success).toBe(true);
  });

  // ── Name validation ─────────────────────────────────────────────────────

  it("rejects name shorter than 2 characters", () => {
    const result = staffSchema.safeParse({ ...validPayload, name: "J" });
    expect(result.success).toBe(false);
  });

  it("accepts name at exactly 2 characters", () => {
    const result = staffSchema.safeParse({ ...validPayload, name: "Jo" });
    expect(result.success).toBe(true);
  });

  it("rejects name longer than 100 characters", () => {
    const result = staffSchema.safeParse({
      ...validPayload,
      name: "A".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("accepts name at exactly 100 characters", () => {
    const result = staffSchema.safeParse({
      ...validPayload,
      name: "A".repeat(100),
    });
    expect(result.success).toBe(true);
  });

  it("trims name whitespace", () => {
    const result = staffSchema.safeParse({
      ...validPayload,
      name: "  Jane Smith  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Jane Smith");
    }
  });

  // ── Email validation ────────────────────────────────────────────────────

  it("rejects invalid email format when provided", () => {
    const result = staffSchema.safeParse({
      ...validPayload,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  // ── Phone validation ────────────────────────────────────────────────────

  it("rejects phone longer than 20 characters", () => {
    const result = staffSchema.safeParse({
      ...validPayload,
      phone: "1".repeat(21),
    });
    expect(result.success).toBe(false);
  });

  it("accepts phone at exactly 20 characters", () => {
    const result = staffSchema.safeParse({
      ...validPayload,
      phone: "1".repeat(20),
    });
    expect(result.success).toBe(true);
  });

  // ── Title validation ────────────────────────────────────────────────────

  it("rejects title longer than 100 characters", () => {
    const result = staffSchema.safeParse({
      ...validPayload,
      title: "A".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("accepts title at exactly 100 characters", () => {
    const result = staffSchema.safeParse({
      ...validPayload,
      title: "A".repeat(100),
    });
    expect(result.success).toBe(true);
  });

  // ── Missing required ────────────────────────────────────────────────────

  it("rejects completely empty object", () => {
    const result = staffSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// staffServiceSchema
// ─────────────────────────────────────────────────────────────────────────────

describe("staffServiceSchema", () => {
  const validPayload = {
    staffId: "staff-1",
    serviceIds: ["service-1", "service-2"],
  };

  // ── Happy path ──────────────────────────────────────────────────────────

  it("accepts valid staff service assignment", () => {
    const result = staffServiceSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("accepts assignment with a single service", () => {
    const result = staffServiceSchema.safeParse({
      ...validPayload,
      serviceIds: ["service-1"],
    });
    expect(result.success).toBe(true);
  });

  // ── staffId validation ──────────────────────────────────────────────────

  it("rejects empty staffId", () => {
    const result = staffServiceSchema.safeParse({
      ...validPayload,
      staffId: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing staffId", () => {
    const { staffId: _, ...rest } = validPayload;
    const result = staffServiceSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  // ── serviceIds validation ───────────────────────────────────────────────

  it("rejects empty serviceIds array", () => {
    const result = staffServiceSchema.safeParse({
      ...validPayload,
      serviceIds: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects serviceIds containing empty strings", () => {
    const result = staffServiceSchema.safeParse({
      ...validPayload,
      serviceIds: [""],
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing serviceIds", () => {
    const { serviceIds: _, ...rest } = validPayload;
    const result = staffServiceSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// staffHoursSchema
// ─────────────────────────────────────────────────────────────────────────────

describe("staffHoursSchema", () => {
  const ALL_DAYS = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ] as const;

  /** Helper: builds a valid 7-day schedule with all days open 09:00–17:00 */
  function buildValidSchedule() {
    return ALL_DAYS.map((day) => ({
      dayOfWeek: day,
      openTime: "09:00",
      closeTime: "17:00",
      isClosed: false,
    }));
  }

  const validPayload = {
    staffId: "staff-1",
    schedule: buildValidSchedule(),
  };

  // ── Happy path ──────────────────────────────────────────────────────────

  it("accepts a valid 7-day schedule", () => {
    const result = staffHoursSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("accepts schedule with some days closed", () => {
    const schedule = buildValidSchedule();
    schedule[5] = { ...schedule[5], isClosed: true }; // Saturday closed
    schedule[6] = { ...schedule[6], isClosed: true }; // Sunday closed

    const result = staffHoursSchema.safeParse({
      staffId: "staff-1",
      schedule,
    });
    expect(result.success).toBe(true);
  });

  it("ignores time values when day is closed", () => {
    const schedule = buildValidSchedule();
    // Close Sunday with reversed times — should still pass because isClosed skips validation
    schedule[6] = {
      dayOfWeek: "SUNDAY",
      openTime: "23:00",
      closeTime: "01:00",
      isClosed: true,
    };

    const result = staffHoursSchema.safeParse({
      staffId: "staff-1",
      schedule,
    });
    expect(result.success).toBe(true);
  });

  // ── staffId validation ──────────────────────────────────────────────────

  it("rejects empty staffId", () => {
    const result = staffHoursSchema.safeParse({
      staffId: "",
      schedule: buildValidSchedule(),
    });
    expect(result.success).toBe(false);
  });

  // ── Schedule length validation ──────────────────────────────────────────

  it("rejects schedule with fewer than 7 days", () => {
    const result = staffHoursSchema.safeParse({
      staffId: "staff-1",
      schedule: buildValidSchedule().slice(0, 5),
    });
    expect(result.success).toBe(false);
  });

  it("rejects schedule with more than 7 days", () => {
    const schedule = [
      ...buildValidSchedule(),
      {
        dayOfWeek: "MONDAY",
        openTime: "09:00",
        closeTime: "17:00",
        isClosed: false,
      },
    ];
    const result = staffHoursSchema.safeParse({
      staffId: "staff-1",
      schedule,
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty schedule array", () => {
    const result = staffHoursSchema.safeParse({
      staffId: "staff-1",
      schedule: [],
    });
    expect(result.success).toBe(false);
  });

  // ── Time format validation ──────────────────────────────────────────────

  it("rejects invalid openTime format", () => {
    const schedule = buildValidSchedule();
    schedule[0] = { ...schedule[0], openTime: "9:00" }; // missing leading zero

    const result = staffHoursSchema.safeParse({
      staffId: "staff-1",
      schedule,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid closeTime format", () => {
    const schedule = buildValidSchedule();
    schedule[0] = { ...schedule[0], closeTime: "25:00" }; // hour out of range

    const result = staffHoursSchema.safeParse({
      staffId: "staff-1",
      schedule,
    });
    expect(result.success).toBe(false);
  });

  // ── Time ordering refinement ────────────────────────────────────────────

  it("rejects openTime equal to closeTime when not closed", () => {
    const schedule = buildValidSchedule();
    schedule[0] = {
      ...schedule[0],
      openTime: "09:00",
      closeTime: "09:00",
      isClosed: false,
    };

    const result = staffHoursSchema.safeParse({
      staffId: "staff-1",
      schedule,
    });
    expect(result.success).toBe(false);
  });

  it("rejects openTime after closeTime when not closed", () => {
    const schedule = buildValidSchedule();
    schedule[0] = {
      ...schedule[0],
      openTime: "17:00",
      closeTime: "09:00",
      isClosed: false,
    };

    const result = staffHoursSchema.safeParse({
      staffId: "staff-1",
      schedule,
    });
    expect(result.success).toBe(false);
  });

  // ── Invalid day of week ─────────────────────────────────────────────────

  it("rejects invalid dayOfWeek value", () => {
    const schedule = buildValidSchedule();
    (schedule[0] as unknown as Record<string, unknown>).dayOfWeek = "HOLIDAY";

    const result = staffHoursSchema.safeParse({
      staffId: "staff-1",
      schedule,
    });
    expect(result.success).toBe(false);
  });
});
