/**
 * @file Auth Validator Unit Tests
 * @description Tests for signUpSchema and signInSchema Zod validation.
 *
 * Covers:
 *   - signUpSchema: name, email, password, confirmPassword, role, refinement
 *   - signInSchema: email, password
 *
 * These are pure input/output tests — no database, no network.
 */

import { describe, it, expect } from "vitest";
import { signUpSchema, signInSchema } from "@/lib/validators/auth";

// ─────────────────────────────────────────────────────────────────────────────
// signUpSchema
// ─────────────────────────────────────────────────────────────────────────────

describe("signUpSchema", () => {
  const validPayload = {
    name: "John Doe",
    email: "john@example.com",
    password: "SecurePass1",
    confirmPassword: "SecurePass1",
    role: "CUSTOMER" as const,
  };

  // ── Happy path ──────────────────────────────────────────────────────────

  it("accepts valid CUSTOMER sign-up data", () => {
    const result = signUpSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("accepts valid BUSINESS_OWNER sign-up data", () => {
    const result = signUpSchema.safeParse({
      ...validPayload,
      role: "BUSINESS_OWNER",
    });
    expect(result.success).toBe(true);
  });

  it("trims and lowercases email", () => {
    const result = signUpSchema.safeParse({
      ...validPayload,
      email: "  John@Example.COM  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("john@example.com");
    }
  });

  it("trims name whitespace", () => {
    const result = signUpSchema.safeParse({
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
    const result = signUpSchema.safeParse({ ...validPayload, name: "J" });
    expect(result.success).toBe(false);
  });

  it("rejects name longer than 50 characters", () => {
    const result = signUpSchema.safeParse({
      ...validPayload,
      name: "A".repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it("accepts name at exactly 2 characters", () => {
    const result = signUpSchema.safeParse({ ...validPayload, name: "Jo" });
    expect(result.success).toBe(true);
  });

  it("accepts name at exactly 50 characters", () => {
    const result = signUpSchema.safeParse({
      ...validPayload,
      name: "A".repeat(50),
    });
    expect(result.success).toBe(true);
  });

  // ── Email validation ────────────────────────────────────────────────────

  it("rejects invalid email format", () => {
    const result = signUpSchema.safeParse({
      ...validPayload,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects email without domain", () => {
    const result = signUpSchema.safeParse({
      ...validPayload,
      email: "user@",
    });
    expect(result.success).toBe(false);
  });

  it("rejects email without @ symbol", () => {
    const result = signUpSchema.safeParse({
      ...validPayload,
      email: "userexample.com",
    });
    expect(result.success).toBe(false);
  });

  // ── Password validation ─────────────────────────────────────────────────

  it("rejects password shorter than 8 characters", () => {
    const result = signUpSchema.safeParse({
      ...validPayload,
      password: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password longer than 100 characters", () => {
    const longPass = "A".repeat(101);
    const result = signUpSchema.safeParse({
      ...validPayload,
      password: longPass,
      confirmPassword: longPass,
    });
    expect(result.success).toBe(false);
  });

  it("accepts password at exactly 8 characters", () => {
    const result = signUpSchema.safeParse({
      ...validPayload,
      password: "12345678",
      confirmPassword: "12345678",
    });
    expect(result.success).toBe(true);
  });

  // ── Confirm password refinement ─────────────────────────────────────────

  it("rejects mismatched passwords", () => {
    const result = signUpSchema.safeParse({
      ...validPayload,
      confirmPassword: "DifferentPass1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("confirmPassword");
    }
  });

  // ── Role validation ─────────────────────────────────────────────────────

  it("rejects invalid role value", () => {
    const result = signUpSchema.safeParse({
      ...validPayload,
      role: "ADMIN",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing role", () => {
    const { role: _role, ...noRole } = validPayload;
    const result = signUpSchema.safeParse(noRole);
    expect(result.success).toBe(false);
  });

  // ── Missing fields ──────────────────────────────────────────────────────

  it("rejects completely empty object", () => {
    const result = signUpSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// signInSchema
// ─────────────────────────────────────────────────────────────────────────────

describe("signInSchema", () => {
  const validPayload = {
    email: "user@example.com",
    password: "mypassword",
  };

  // ── Happy path ──────────────────────────────────────────────────────────

  it("accepts valid sign-in credentials", () => {
    const result = signInSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("trims and lowercases email", () => {
    const result = signInSchema.safeParse({
      ...validPayload,
      email: "  USER@Example.COM  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
    }
  });

  // ── Email validation ────────────────────────────────────────────────────

  it("rejects invalid email format", () => {
    const result = signInSchema.safeParse({
      ...validPayload,
      email: "bad-email",
    });
    expect(result.success).toBe(false);
  });

  // ── Password validation ─────────────────────────────────────────────────

  it("rejects empty password", () => {
    const result = signInSchema.safeParse({
      ...validPayload,
      password: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts any non-empty password (no min length enforced)", () => {
    const result = signInSchema.safeParse({
      ...validPayload,
      password: "x",
    });
    expect(result.success).toBe(true);
  });

  // ── Missing fields ──────────────────────────────────────────────────────

  it("rejects missing email", () => {
    const result = signInSchema.safeParse({ password: "mypassword" });
    expect(result.success).toBe(false);
  });

  it("rejects missing password", () => {
    const result = signInSchema.safeParse({ email: "user@example.com" });
    expect(result.success).toBe(false);
  });

  it("rejects completely empty object", () => {
    const result = signInSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
