/**
 * @file Business Validator Unit Tests
 * @description Tests for businessSchema Zod validation.
 *
 * Covers:
 *   - name: required, 2-100 characters, trimmed
 *   - description: optional, max 1000 characters
 *   - category: required, must be one of 13 valid enum values
 *   - phone: optional, max 20 characters
 *   - email: optional, valid email format
 *   - website: optional, valid URL format
 *   - address: optional, max 200 characters
 *   - city: optional, max 100 characters
 *   - state: optional, max 50 characters
 *   - zipCode: optional, max 20 characters
 *
 * Pure input/output — no database, no network.
 */

import { describe, it, expect } from "vitest";
import { businessSchema } from "@/lib/validators/business";

describe("businessSchema", () => {
  const validPayload = {
    name: "Bella's Hair Studio",
    description: "A premium hair salon in Addis Ababa.",
    category: "SALON" as const,
    phone: "+251911223344",
    email: "info@bellas.com",
    website: "https://bellas.com",
    address: "123 Bole Road",
    city: "Addis Ababa",
    state: "Addis Ababa",
    zipCode: "1000",
  };

  // ── Happy path ──────────────────────────────────────────────────────────

  it("accepts a fully valid business profile", () => {
    const result = businessSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("accepts business with only required fields (name + category)", () => {
    const result = businessSchema.safeParse({
      name: "Quick Cuts",
      category: "BARBERSHOP",
    });
    expect(result.success).toBe(true);
  });

  it("accepts business with all optional fields as empty strings", () => {
    const result = businessSchema.safeParse({
      name: "Quick Cuts",
      category: "BARBERSHOP",
      description: "",
      phone: "",
      email: "",
      website: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
    });
    expect(result.success).toBe(true);
  });

  // ── Name validation ─────────────────────────────────────────────────────

  it("rejects name shorter than 2 characters", () => {
    const result = businessSchema.safeParse({ ...validPayload, name: "B" });
    expect(result.success).toBe(false);
  });

  it("accepts name at exactly 2 characters", () => {
    const result = businessSchema.safeParse({ ...validPayload, name: "BB" });
    expect(result.success).toBe(true);
  });

  it("rejects name longer than 100 characters", () => {
    const result = businessSchema.safeParse({
      ...validPayload,
      name: "A".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("accepts name at exactly 100 characters", () => {
    const result = businessSchema.safeParse({
      ...validPayload,
      name: "A".repeat(100),
    });
    expect(result.success).toBe(true);
  });

  it("trims name whitespace", () => {
    const result = businessSchema.safeParse({
      ...validPayload,
      name: "  Bella's  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Bella's");
    }
  });

  it("rejects missing name", () => {
    const { name: _name, ...rest } = validPayload;
    const result = businessSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  // ── Category validation ─────────────────────────────────────────────────

  it("accepts all valid category values", () => {
    const categories = [
      "BARBERSHOP",
      "SALON",
      "SPA",
      "FITNESS",
      "DENTAL",
      "MEDICAL",
      "TUTORING",
      "CONSULTING",
      "PHOTOGRAPHY",
      "AUTOMOTIVE",
      "HOME_SERVICES",
      "PET_SERVICES",
      "OTHER",
    ] as const;

    for (const category of categories) {
      const result = businessSchema.safeParse({
        ...validPayload,
        category,
      });
      expect(result.success, `Expected ${category} to be valid`).toBe(true);
    }
  });

  it("rejects invalid category value", () => {
    const result = businessSchema.safeParse({
      ...validPayload,
      category: "RESTAURANT",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing category", () => {
    const { category: _category, ...rest } = validPayload;
    const result = businessSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  // ── Description validation ──────────────────────────────────────────────

  it("rejects description exceeding 1000 characters", () => {
    const result = businessSchema.safeParse({
      ...validPayload,
      description: "A".repeat(1001),
    });
    expect(result.success).toBe(false);
  });

  it("accepts description at exactly 1000 characters", () => {
    const result = businessSchema.safeParse({
      ...validPayload,
      description: "A".repeat(1000),
    });
    expect(result.success).toBe(true);
  });

  // ── Phone validation ────────────────────────────────────────────────────

  it("rejects phone longer than 20 characters", () => {
    const result = businessSchema.safeParse({
      ...validPayload,
      phone: "1".repeat(21),
    });
    expect(result.success).toBe(false);
  });

  it("accepts phone at exactly 20 characters", () => {
    const result = businessSchema.safeParse({
      ...validPayload,
      phone: "1".repeat(20),
    });
    expect(result.success).toBe(true);
  });

  // ── Email validation ────────────────────────────────────────────────────

  it("rejects invalid email format when provided", () => {
    const result = businessSchema.safeParse({
      ...validPayload,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid email when provided", () => {
    const result = businessSchema.safeParse({
      ...validPayload,
      email: "contact@business.com",
    });
    expect(result.success).toBe(true);
  });

  // ── Website validation ──────────────────────────────────────────────────

  it("rejects invalid URL format when provided", () => {
    const result = businessSchema.safeParse({
      ...validPayload,
      website: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid https URL", () => {
    const result = businessSchema.safeParse({
      ...validPayload,
      website: "https://example.com",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid http URL", () => {
    const result = businessSchema.safeParse({
      ...validPayload,
      website: "http://example.com",
    });
    expect(result.success).toBe(true);
  });

  // ── Address field length limits ─────────────────────────────────────────

  it("rejects address longer than 200 characters", () => {
    const result = businessSchema.safeParse({
      ...validPayload,
      address: "A".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("rejects city longer than 100 characters", () => {
    const result = businessSchema.safeParse({
      ...validPayload,
      city: "A".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("rejects state longer than 50 characters", () => {
    const result = businessSchema.safeParse({
      ...validPayload,
      state: "A".repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it("rejects zipCode longer than 20 characters", () => {
    const result = businessSchema.safeParse({
      ...validPayload,
      zipCode: "1".repeat(21),
    });
    expect(result.success).toBe(false);
  });

  // ── Empty object ────────────────────────────────────────────────────────

  it("rejects completely empty object", () => {
    const result = businessSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
