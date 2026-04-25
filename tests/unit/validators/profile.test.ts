/**
 * @file Profile Validator Unit Tests
 * @description Tests for updateProfileSchema and changePasswordSchema.
 *
 * Covers:
 *   - updateProfileSchema: name (required, 2-50), email (required, valid),
 *     phone (optional, max 20)
 *   - changePasswordSchema: currentPassword (required), newPassword (8-100),
 *     confirmPassword (must match newPassword via refinement)
 *
 * Pure input/output — no database, no network.
 */

import { describe, it, expect } from "vitest";
import {
  updateProfileSchema,
  changePasswordSchema,
} from "@/lib/validators/profile";

// ─────────────────────────────────────────────────────────────────────────────
// updateProfileSchema
// ─────────────────────────────────────────────────────────────────────────────

describe("updateProfileSchema", () => {
  const validPayload = {
    name: "John Doe",
    email: "john@example.com",
    phone: "+251911223344",
  };

  // ── Happy path ──────────────────────────────────────────────────────────

  it("accepts valid profile data", () => {
    const result = updateProfileSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("accepts profile without optional phone", () => {
    const { phone: _phone, ...rest } = validPayload;
    const result = updateProfileSchema.safeParse(rest);
    expect(result.success).toBe(true);
  });

  it("accepts profile with empty string phone", () => {
    const result = updateProfileSchema.safeParse({
      ...validPayload,
      phone: "",
    });
    expect(result.success).toBe(true);
  });

  it("trims and lowercases email", () => {
    const result = updateProfileSchema.safeParse({
      ...validPayload,
      email: "  JOHN@Example.COM  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("john@example.com");
    }
  });

  it("trims name whitespace", () => {
    const result = updateProfileSchema.safeParse({
      ...validPayload,
      name: "  John Doe  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("John Doe");
    }
  });

  // ── Name validation ─────────────────────────────────────────────────────

  it("rejects name shorter than 2 characters", () => {
    const result = updateProfileSchema.safeParse({
      ...validPayload,
      name: "J",
    });
    expect(result.success).toBe(false);
  });

  it("accepts name at exactly 2 characters", () => {
    const result = updateProfileSchema.safeParse({
      ...validPayload,
      name: "Jo",
    });
    expect(result.success).toBe(true);
  });

  it("rejects name longer than 50 characters", () => {
    const result = updateProfileSchema.safeParse({
      ...validPayload,
      name: "A".repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it("accepts name at exactly 50 characters", () => {
    const result = updateProfileSchema.safeParse({
      ...validPayload,
      name: "A".repeat(50),
    });
    expect(result.success).toBe(true);
  });

  // ── Email validation ────────────────────────────────────────────────────

  it("rejects invalid email format", () => {
    const result = updateProfileSchema.safeParse({
      ...validPayload,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing email", () => {
    const { email: _email, ...rest } = validPayload;
    const result = updateProfileSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  // ── Phone validation ────────────────────────────────────────────────────

  it("rejects phone longer than 20 characters", () => {
    const result = updateProfileSchema.safeParse({
      ...validPayload,
      phone: "1".repeat(21),
    });
    expect(result.success).toBe(false);
  });

  it("accepts phone at exactly 20 characters", () => {
    const result = updateProfileSchema.safeParse({
      ...validPayload,
      phone: "1".repeat(20),
    });
    expect(result.success).toBe(true);
  });

  // ── Missing required ────────────────────────────────────────────────────

  it("rejects completely empty object", () => {
    const result = updateProfileSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects missing name", () => {
    const { name: _name, ...rest } = validPayload;
    const result = updateProfileSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// changePasswordSchema
// ─────────────────────────────────────────────────────────────────────────────

describe("changePasswordSchema", () => {
  const validPayload = {
    currentPassword: "OldPassword1",
    newPassword: "NewSecure1!",
    confirmPassword: "NewSecure1!",
  };

  // ── Happy path ──────────────────────────────────────────────────────────

  it("accepts valid password change data", () => {
    const result = changePasswordSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  // ── currentPassword validation ──────────────────────────────────────────

  it("rejects empty currentPassword", () => {
    const result = changePasswordSchema.safeParse({
      ...validPayload,
      currentPassword: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing currentPassword", () => {
    const { currentPassword: _currentPassword, ...rest } = validPayload;
    const result = changePasswordSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  // ── newPassword validation ──────────────────────────────────────────────

  it("rejects newPassword shorter than 8 characters", () => {
    const result = changePasswordSchema.safeParse({
      ...validPayload,
      newPassword: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
  });

  it("accepts newPassword at exactly 8 characters", () => {
    const result = changePasswordSchema.safeParse({
      ...validPayload,
      newPassword: "12345678",
      confirmPassword: "12345678",
    });
    expect(result.success).toBe(true);
  });

  it("rejects newPassword longer than 100 characters", () => {
    const longPass = "A".repeat(101);
    const result = changePasswordSchema.safeParse({
      ...validPayload,
      newPassword: longPass,
      confirmPassword: longPass,
    });
    expect(result.success).toBe(false);
  });

  it("accepts newPassword at exactly 100 characters", () => {
    const pass = "A".repeat(100);
    const result = changePasswordSchema.safeParse({
      ...validPayload,
      newPassword: pass,
      confirmPassword: pass,
    });
    expect(result.success).toBe(true);
  });

  // ── confirmPassword refinement ──────────────────────────────────────────

  it("rejects mismatched passwords", () => {
    const result = changePasswordSchema.safeParse({
      ...validPayload,
      confirmPassword: "DifferentPass1!",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("confirmPassword");
    }
  });

  it("rejects missing confirmPassword", () => {
    const { confirmPassword: _confirmPassword, ...rest } = validPayload;
    const result = changePasswordSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  // ── Missing everything ──────────────────────────────────────────────────

  it("rejects completely empty object", () => {
    const result = changePasswordSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
