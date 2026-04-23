/**
 * @file Service Validator Unit Tests
 * @description Tests for serviceSchema Zod validation.
 *
 * Covers:
 *   - name: required, 2-100 characters, trimmed
 *   - description: optional, max 500 characters, empty string allowed
 *   - price: coerced number, positive, max 99999.99
 *   - duration: coerced integer, 5-480 minutes
 *
 * Note: price and duration use z.coerce so string inputs from HTML forms
 * are automatically converted to numbers before validation.
 *
 * Pure input/output — no database, no network.
 */

import { describe, it, expect } from "vitest";
import { serviceSchema } from "@/lib/validators/service";

describe("serviceSchema", () => {
  const validPayload = {
    name: "Haircut",
    description: "A classic haircut",
    price: 25.0,
    duration: 30,
  };

  // ── Happy path ──────────────────────────────────────────────────────────

  it("accepts a fully valid service", () => {
    const result = serviceSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("accepts service without optional description", () => {
    const { description, ...rest } = validPayload;
    const result = serviceSchema.safeParse(rest);
    expect(result.success).toBe(true);
  });

  it("accepts service with empty string description", () => {
    const result = serviceSchema.safeParse({
      ...validPayload,
      description: "",
    });
    expect(result.success).toBe(true);
  });

  // ── Name validation ─────────────────────────────────────────────────────

  it("rejects name shorter than 2 characters", () => {
    const result = serviceSchema.safeParse({ ...validPayload, name: "H" });
    expect(result.success).toBe(false);
  });

  it("accepts name at exactly 2 characters", () => {
    const result = serviceSchema.safeParse({ ...validPayload, name: "Ha" });
    expect(result.success).toBe(true);
  });

  it("rejects name longer than 100 characters", () => {
    const result = serviceSchema.safeParse({
      ...validPayload,
      name: "A".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("accepts name at exactly 100 characters", () => {
    const result = serviceSchema.safeParse({
      ...validPayload,
      name: "A".repeat(100),
    });
    expect(result.success).toBe(true);
  });

  it("trims name whitespace", () => {
    const result = serviceSchema.safeParse({
      ...validPayload,
      name: "  Haircut  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Haircut");
    }
  });

  it("rejects name that is only whitespace (under 2 chars after trim)", () => {
    const result = serviceSchema.safeParse({ ...validPayload, name: "   " });
    expect(result.success).toBe(false);
  });

  // ── Description validation ──────────────────────────────────────────────

  it("rejects description exceeding 500 characters", () => {
    const result = serviceSchema.safeParse({
      ...validPayload,
      description: "A".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("accepts description at exactly 500 characters", () => {
    const result = serviceSchema.safeParse({
      ...validPayload,
      description: "A".repeat(500),
    });
    expect(result.success).toBe(true);
  });

  // ── Price validation ────────────────────────────────────────────────────

  it("rejects zero price", () => {
    const result = serviceSchema.safeParse({ ...validPayload, price: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects negative price", () => {
    const result = serviceSchema.safeParse({ ...validPayload, price: -10 });
    expect(result.success).toBe(false);
  });

  it("accepts a small positive price", () => {
    const result = serviceSchema.safeParse({ ...validPayload, price: 0.01 });
    expect(result.success).toBe(true);
  });

  it("rejects price exceeding 99999.99", () => {
    const result = serviceSchema.safeParse({ ...validPayload, price: 100000 });
    expect(result.success).toBe(false);
  });

  it("accepts price at exactly 99999.99", () => {
    const result = serviceSchema.safeParse({
      ...validPayload,
      price: 99999.99,
    });
    expect(result.success).toBe(true);
  });

  it("coerces string price to number", () => {
    const result = serviceSchema.safeParse({ ...validPayload, price: "25" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.price).toBe(25);
      expect(typeof result.data.price).toBe("number");
    }
  });

  it("rejects non-numeric price string", () => {
    const result = serviceSchema.safeParse({ ...validPayload, price: "abc" });
    expect(result.success).toBe(false);
  });

  // ── Duration validation ─────────────────────────────────────────────────

  it("rejects duration below 5 minutes", () => {
    const result = serviceSchema.safeParse({ ...validPayload, duration: 4 });
    expect(result.success).toBe(false);
  });

  it("accepts duration at exactly 5 minutes", () => {
    const result = serviceSchema.safeParse({ ...validPayload, duration: 5 });
    expect(result.success).toBe(true);
  });

  it("rejects duration exceeding 480 minutes", () => {
    const result = serviceSchema.safeParse({ ...validPayload, duration: 481 });
    expect(result.success).toBe(false);
  });

  it("accepts duration at exactly 480 minutes", () => {
    const result = serviceSchema.safeParse({ ...validPayload, duration: 480 });
    expect(result.success).toBe(true);
  });

  it("rejects decimal duration", () => {
    const result = serviceSchema.safeParse({
      ...validPayload,
      duration: 30.5,
    });
    expect(result.success).toBe(false);
  });

  it("coerces string duration to number", () => {
    const result = serviceSchema.safeParse({
      ...validPayload,
      duration: "60",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.duration).toBe(60);
      expect(typeof result.data.duration).toBe("number");
    }
  });

  it("rejects non-numeric duration string", () => {
    const result = serviceSchema.safeParse({
      ...validPayload,
      duration: "thirty",
    });
    expect(result.success).toBe(false);
  });

  // ── Missing fields ──────────────────────────────────────────────────────

  it("rejects completely empty object", () => {
    const result = serviceSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects missing name", () => {
    const { name, ...rest } = validPayload;
    const result = serviceSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects missing price", () => {
    const { price, ...rest } = validPayload;
    const result = serviceSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects missing duration", () => {
    const { duration, ...rest } = validPayload;
    const result = serviceSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});
