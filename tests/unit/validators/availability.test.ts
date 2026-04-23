/**
 * @file Availability Validator Unit Tests
 * @description Tests for availabilitySchema Zod validation.
 *
 * Covers:
 *   - schedule: array of exactly 7 day entries
 *   - dayOfWeek: valid enum (MONDAY–SUNDAY)
 *   - openTime / closeTime: HH:mm regex format
 *   - isClosed: boolean flag that skips time ordering validation
 *   - Refinement: openTime must be strictly before closeTime when open
 *
 * Pure input/output — no database, no network.
 */

import { describe, it, expect } from "vitest";
import { availabilitySchema } from "@/lib/validators/availability";

describe("availabilitySchema", () => {
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

  // ── Happy path ──────────────────────────────────────────────────────────

  it("accepts a valid 7-day all-open schedule", () => {
    const result = availabilitySchema.safeParse({
      schedule: buildValidSchedule(),
    });
    expect(result.success).toBe(true);
  });

  it("accepts schedule with weekends closed", () => {
    const schedule = buildValidSchedule();
    schedule[5] = { ...schedule[5], isClosed: true }; // Saturday
    schedule[6] = { ...schedule[6], isClosed: true }; // Sunday

    const result = availabilitySchema.safeParse({ schedule });
    expect(result.success).toBe(true);
  });

  it("accepts schedule with all days closed", () => {
    const schedule = ALL_DAYS.map((day) => ({
      dayOfWeek: day,
      openTime: "09:00",
      closeTime: "17:00",
      isClosed: true,
    }));

    const result = availabilitySchema.safeParse({ schedule });
    expect(result.success).toBe(true);
  });

  it("accepts various valid time ranges", () => {
    const schedule = buildValidSchedule();
    schedule[0] = { ...schedule[0], openTime: "00:00", closeTime: "23:59" };
    schedule[1] = { ...schedule[1], openTime: "06:00", closeTime: "22:00" };
    schedule[2] = { ...schedule[2], openTime: "08:30", closeTime: "12:00" };

    const result = availabilitySchema.safeParse({ schedule });
    expect(result.success).toBe(true);
  });

  // ── Schedule length validation ──────────────────────────────────────────

  it("rejects schedule with fewer than 7 days", () => {
    const result = availabilitySchema.safeParse({
      schedule: buildValidSchedule().slice(0, 6),
    });
    expect(result.success).toBe(false);
  });

  it("rejects schedule with more than 7 days", () => {
    const schedule = [
      ...buildValidSchedule(),
      {
        dayOfWeek: "MONDAY" as const,
        openTime: "09:00",
        closeTime: "17:00",
        isClosed: false,
      },
    ];
    const result = availabilitySchema.safeParse({ schedule });
    expect(result.success).toBe(false);
  });

  it("rejects empty schedule array", () => {
    const result = availabilitySchema.safeParse({ schedule: [] });
    expect(result.success).toBe(false);
  });

  it("rejects missing schedule field", () => {
    const result = availabilitySchema.safeParse({});
    expect(result.success).toBe(false);
  });

  // ── Day of week validation ──────────────────────────────────────────────

  it("rejects invalid dayOfWeek value", () => {
    const schedule = buildValidSchedule();
    (schedule[0] as any).dayOfWeek = "FUNDAY";

    const result = availabilitySchema.safeParse({ schedule });
    expect(result.success).toBe(false);
  });

  // ── Time format validation ──────────────────────────────────────────────

  it("rejects openTime without leading zero", () => {
    const schedule = buildValidSchedule();
    schedule[0] = { ...schedule[0], openTime: "9:00" };

    const result = availabilitySchema.safeParse({ schedule });
    expect(result.success).toBe(false);
  });

  it("rejects closeTime with hour > 23", () => {
    const schedule = buildValidSchedule();
    schedule[0] = { ...schedule[0], closeTime: "24:00" };

    const result = availabilitySchema.safeParse({ schedule });
    expect(result.success).toBe(false);
  });

  it("rejects time with minutes > 59", () => {
    const schedule = buildValidSchedule();
    schedule[0] = { ...schedule[0], openTime: "09:60" };

    const result = availabilitySchema.safeParse({ schedule });
    expect(result.success).toBe(false);
  });

  it("rejects time in non-HH:mm format", () => {
    const schedule = buildValidSchedule();
    schedule[0] = { ...schedule[0], openTime: "morning" };

    const result = availabilitySchema.safeParse({ schedule });
    expect(result.success).toBe(false);
  });

  it("rejects time with only hour and no minutes", () => {
    const schedule = buildValidSchedule();
    schedule[0] = { ...schedule[0], openTime: "09" };

    const result = availabilitySchema.safeParse({ schedule });
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

    const result = availabilitySchema.safeParse({ schedule });
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

    const result = availabilitySchema.safeParse({ schedule });
    expect(result.success).toBe(false);
  });

  it("allows reversed times when day is closed", () => {
    const schedule = buildValidSchedule();
    schedule[0] = {
      dayOfWeek: "MONDAY",
      openTime: "20:00",
      closeTime: "08:00",
      isClosed: true,
    };

    const result = availabilitySchema.safeParse({ schedule });
    expect(result.success).toBe(true);
  });

  it("allows equal times when day is closed", () => {
    const schedule = buildValidSchedule();
    schedule[0] = {
      dayOfWeek: "MONDAY",
      openTime: "12:00",
      closeTime: "12:00",
      isClosed: true,
    };

    const result = availabilitySchema.safeParse({ schedule });
    expect(result.success).toBe(true);
  });

  // ── isClosed validation ─────────────────────────────────────────────────

  it("rejects non-boolean isClosed", () => {
    const schedule = buildValidSchedule();
    (schedule[0] as any).isClosed = "yes";

    const result = availabilitySchema.safeParse({ schedule });
    expect(result.success).toBe(false);
  });

  it("rejects missing isClosed", () => {
    const schedule = buildValidSchedule();
    const { isClosed, ...rest } = schedule[0];
    schedule[0] = rest as any;

    const result = availabilitySchema.safeParse({ schedule });
    expect(result.success).toBe(false);
  });
});
