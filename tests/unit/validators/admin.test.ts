/**
 * @file Admin Validator Unit Tests
 * @description Tests for suspendSchema and platformSettingsSchema.
 *
 * Covers:
 *   - suspendSchema: reason (required, 10-500 characters, trimmed)
 *   - platformSettingsSchema: defaultCommissionRate (coerced, 0-100, transformed
 *     to decimal), payoutSchedule (MONTHLY | WEEKLY | BIWEEKLY)
 *
 * Note: platformSettingsSchema transforms the commission rate from a percentage
 * (e.g. 15) to a decimal (e.g. 0.15) for storage. Tests verify this transform.
 *
 * Pure input/output — no database, no network.
 */

import { describe, it, expect } from "vitest";
import { suspendSchema, platformSettingsSchema } from "@/lib/validators/admin";

// ─────────────────────────────────────────────────────────────────────────────
// suspendSchema
// ─────────────────────────────────────────────────────────────────────────────

describe("suspendSchema", () => {
  // ── Happy path ──────────────────────────────────────────────────────────

  it("accepts a valid suspension reason", () => {
    const result = suspendSchema.safeParse({
      reason: "Repeated policy violations reported by multiple users.",
    });
    expect(result.success).toBe(true);
  });

  it("trims reason whitespace", () => {
    const result = suspendSchema.safeParse({
      reason: "   Violation of terms of service   ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.reason).toBe("Violation of terms of service");
    }
  });

  // ── Reason length validation ────────────────────────────────────────────

  it("rejects reason shorter than 10 characters", () => {
    const result = suspendSchema.safeParse({ reason: "Too short" });
    expect(result.success).toBe(false);
  });

  it("accepts reason at exactly 10 characters", () => {
    const result = suspendSchema.safeParse({ reason: "A".repeat(10) });
    expect(result.success).toBe(true);
  });

  it("rejects reason longer than 500 characters", () => {
    const result = suspendSchema.safeParse({ reason: "A".repeat(501) });
    expect(result.success).toBe(false);
  });

  it("accepts reason at exactly 500 characters", () => {
    const result = suspendSchema.safeParse({ reason: "A".repeat(500) });
    expect(result.success).toBe(true);
  });

  // ── Missing / empty ─────────────────────────────────────────────────────

  it("rejects empty reason", () => {
    const result = suspendSchema.safeParse({ reason: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing reason", () => {
    const result = suspendSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects reason that is only whitespace (under 10 chars after trim)", () => {
    const result = suspendSchema.safeParse({ reason: "         " });
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// platformSettingsSchema
// ─────────────────────────────────────────────────────────────────────────────

describe("platformSettingsSchema", () => {
  const validPayload = {
    defaultCommissionRate: 15,
    payoutSchedule: "MONTHLY" as const,
  };

  // ── Happy path ──────────────────────────────────────────────────────────

  it("accepts valid platform settings", () => {
    const result = platformSettingsSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("transforms commission rate from percentage to decimal", () => {
    const result = platformSettingsSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.defaultCommissionRate).toBe(0.15);
    }
  });

  it("transforms 0% to 0", () => {
    const result = platformSettingsSchema.safeParse({
      ...validPayload,
      defaultCommissionRate: 0,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.defaultCommissionRate).toBe(0);
    }
  });

  it("transforms 100% to 1", () => {
    const result = platformSettingsSchema.safeParse({
      ...validPayload,
      defaultCommissionRate: 100,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.defaultCommissionRate).toBe(1);
    }
  });

  it("transforms decimal percentage correctly (e.g. 7.5% → 0.075)", () => {
    const result = platformSettingsSchema.safeParse({
      ...validPayload,
      defaultCommissionRate: 7.5,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.defaultCommissionRate).toBeCloseTo(0.075);
    }
  });

  // ── Commission rate validation ──────────────────────────────────────────

  it("rejects negative commission rate", () => {
    const result = platformSettingsSchema.safeParse({
      ...validPayload,
      defaultCommissionRate: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects commission rate exceeding 100", () => {
    const result = platformSettingsSchema.safeParse({
      ...validPayload,
      defaultCommissionRate: 101,
    });
    expect(result.success).toBe(false);
  });

  it("coerces string commission rate to number", () => {
    const result = platformSettingsSchema.safeParse({
      ...validPayload,
      defaultCommissionRate: "10",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.defaultCommissionRate).toBe(0.1);
    }
  });

  it("rejects non-numeric commission rate string", () => {
    const result = platformSettingsSchema.safeParse({
      ...validPayload,
      defaultCommissionRate: "abc",
    });
    expect(result.success).toBe(false);
  });

  // ── Payout schedule validation ──────────────────────────────────────────

  it("accepts all valid payout schedule values", () => {
    const schedules = ["MONTHLY", "WEEKLY", "BIWEEKLY"] as const;
    for (const payoutSchedule of schedules) {
      const result = platformSettingsSchema.safeParse({
        ...validPayload,
        payoutSchedule,
      });
      expect(result.success, `Expected ${payoutSchedule} to be valid`).toBe(
        true
      );
    }
  });

  it("rejects invalid payout schedule value", () => {
    const result = platformSettingsSchema.safeParse({
      ...validPayload,
      payoutSchedule: "DAILY",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing payout schedule", () => {
    const { payoutSchedule, ...rest } = validPayload;
    const result = platformSettingsSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  // ── Missing fields ──────────────────────────────────────────────────────

  it("rejects completely empty object", () => {
    const result = platformSettingsSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects missing commission rate", () => {
    const { defaultCommissionRate, ...rest } = validPayload;
    const result = platformSettingsSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});
