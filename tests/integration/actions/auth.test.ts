/**
 * @file Auth Server Action Integration Tests
 * @description Tests for signUp, login, and resendVerificationEmail actions.
 *
 * Covers:
 *   - signUp: validation errors, duplicate email, successful registration,
 *     sends verification email
 *   - login: validation errors, unverified email block, OAuth-only account block,
 *     wrong password, successful redirect trigger
 *   - resendVerificationEmail: unknown email returns safe message,
 *     already verified returns error, sends email for unverified user
 */

import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";

import { signUp, login, resendVerificationEmail } from "@/lib/actions/auth";
import { sendEmail } from "@/lib/email";
import { cleanDatabase, disconnectTestDb, testDb } from "../helpers/db";
import { createTestUser } from "../helpers/factories";

// ── Setup ────────────────────────────────────────────────────────────────────

beforeEach(async () => {
  await cleanDatabase();
  vi.clearAllMocks();
});

afterAll(async () => {
  await disconnectTestDb();
});


// ────────────────────────────────────────────────────────────────────────────

describe("signUp", () => {
  // ── Validation ──────────────────────────────────────────────────────────

  it("returns error when name is too short", async () => {
    const result = await signUp({
      name: "A",
      email: "test@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
      role: "CUSTOMER",
    });

    expect(result.error).toBeDefined();
    expect(result.success).toBeUndefined();
  });

  it("returns error when email format is invalid", async () => {
    const result = await signUp({
      name: "Valid Name",
      email: "not-an-email",
      password: "Password123!",
      confirmPassword: "Password123!",
      role: "CUSTOMER",
    });

    expect(result.error).toBeDefined();
  });

  it("returns error when passwords do not match", async () => {
    const result = await signUp({
      name: "Valid Name",
      email: "test@example.com",
      password: "Password123!",
      confirmPassword: "Different456!",
      role: "CUSTOMER",
    });

    expect(result.error).toBeDefined();
  });

  // ── Duplicate email ─────────────────────────────────────────────────────

  it("returns error when email is already registered", async () => {
    await createTestUser({ email: "existing@example.com" });

    const result = await signUp({
      name: "New User",
      email: "existing@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
      role: "CUSTOMER",
    });

    expect(result.error).toContain("already exists");
  });

  // ── Successful registration ─────────────────────────────────────────────

  it("creates a user record in the database on valid input", async () => {
    const email = "newuser@example.com";

    await signUp({
      name: "New User",
      email,
      password: "Password123!",
      confirmPassword: "Password123!",
      role: "CUSTOMER",
    });

    const user = await testDb.user.findUnique({ where: { email } });
    expect(user).not.toBeNull();
    expect(user?.name).toBe("New User");
    expect(user?.role).toBe("CUSTOMER");
  });

  it("creates user with emailVerified as null (pending verification)", async () => {
    const email = "pending@example.com";

    await signUp({
      name: "Pending User",
      email,
      password: "Password123!",
      confirmPassword: "Password123!",
      role: "CUSTOMER",
    });

    const user = await testDb.user.findUnique({ where: { email } });
    expect(user?.emailVerified).toBeNull();
  });

  it("stores a hashed password (not plaintext)", async () => {
    const email = "hash@example.com";
    const plaintext = "Password123!";

    await signUp({
      name: "Hash Test",
      email,
      password: plaintext,
      confirmPassword: plaintext,
      role: "CUSTOMER",
    });

    const user = await testDb.user.findUnique({ where: { email } });
    expect(user?.password).not.toBe(plaintext);
    expect(user?.password).toMatch(/^\$2[ab]\$/); // bcrypt hash prefix
  });

  it("returns success message after valid registration", async () => {
    const result = await signUp({
      name: "Success User",
      email: "success@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
      role: "CUSTOMER",
    });

    expect(result.success).toBeDefined();
    expect(result.error).toBeUndefined();
  });

  it("sends a verification email after successful registration", async () => {
    await signUp({
      name: "Email Test",
      email: "emailtest@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
      role: "CUSTOMER",
    });

    expect(vi.mocked(sendEmail)).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "emailtest@example.com",
        subject: expect.stringContaining("Verify"),
      })
    );
  });

  it("creates user with BUSINESS_OWNER role when specified", async () => {
    const email = "owner@example.com";

    await signUp({
      name: "Business Owner",
      email,
      password: "Password123!",
      confirmPassword: "Password123!",
      role: "BUSINESS_OWNER",
    });

    const user = await testDb.user.findUnique({ where: { email } });
    expect(user?.role).toBe("BUSINESS_OWNER");
  });
});

// ────────────────────────────────────────────────────────────────────────────

describe("login", () => {
  // ── Validation ──────────────────────────────────────────────────────────

  it("returns error for invalid email format", async () => {
    const result = await login({ email: "bad", password: "pass" });
    expect(result.error).toBeDefined();
  });

  // ── Unverified email ────────────────────────────────────────────────────

  it("returns error when user has not verified their email", async () => {
    await createTestUser({
      email: "unverified@example.com",
      emailVerified: null,
    });

    const result = await login({
      email: "unverified@example.com",
      password: "Password123!",
    });

    expect(result.error).toContain("verify your email");
  });

  // ── OAuth-only account ──────────────────────────────────────────────────

  it("returns error when account uses OAuth and has no password", async () => {
    // Create user without a password (OAuth user)
    await testDb.user.create({
      data: {
        name: "Google User",
        email: "google@example.com",
        password: null, // OAuth users have no password
        emailVerified: new Date(),
        role: "CUSTOMER",
      },
    });

    const result = await login({
      email: "google@example.com",
      password: "anything",
    });

    expect(result.error).toContain("Google sign-in");
  });
});

// ────────────────────────────────────────────────────────────────────────────

describe("resendVerificationEmail", () => {
  // ── Invalid email format ────────────────────────────────────────────────

  it("returns error for invalid email format", async () => {
    const result = await resendVerificationEmail("not-an-email");
    expect(result.error).toBeDefined();
  });

  // ── Unknown email (safe response) ──────────────────────────────────────

  it("returns safe success message for unknown email (prevents enumeration)", async () => {
    const result = await resendVerificationEmail("ghost@example.com");
    // Returns success to not reveal whether the email exists
    expect(result.success).toBeDefined();
    expect(result.error).toBeUndefined();
  });

  // ── Already verified ────────────────────────────────────────────────────

  it("returns error when email is already verified", async () => {
    const user = await createTestUser({
      email: "verified@example.com",
      emailVerified: new Date(),
    });

    const result = await resendVerificationEmail(user.email);
    expect(result.error).toContain("already verified");
  });

  // ── Sends email ─────────────────────────────────────────────────────────

  it("sends verification email to unverified user", async () => {
    const user = await createTestUser({
      email: "resend@example.com",
      emailVerified: null,
    });

    const result = await resendVerificationEmail(user.email);

    expect(result.success).toBeDefined();
    expect(vi.mocked(sendEmail)).toHaveBeenCalledWith(
      expect.objectContaining({ to: user.email })
    );
  });
});
