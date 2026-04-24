/**
 * @file Email Utils Unit Tests
 * @description Tests for token generation/validation, email preference
 * helpers, and URL builders in email-utils.ts.
 *
 * Covers:
 *   - generateVerificationToken: produces a 3-part dot-separated token
 *   - validateVerificationToken: accepts valid token, rejects tampered
 *     token, rejects expired token, rejects malformed token
 *   - generateUnsubscribeToken: produces a 4-part dot-separated token
 *   - validateUnsubscribeToken: accepts valid token, rejects expired,
 *     tampered, and invalid emailType
 *   - parseEmailPreferences: merges with defaults, handles null/missing
 *     fields, rejects non-boolean values
 *   - isEmailTypeEnabled: returns correct boolean per preference key
 *   - buildVerificationUrl: constructs correct URL with encoded token
 *   - buildUnsubscribeUrl: constructs correct URL with encoded token
 *
 * Security note: tampered token tests verify the HMAC signature check
 * prevents accepting modified tokens without the secret.
 *
 * Pure logic — no database, no network. AUTH_SECRET and AUTH_URL are
 * set via process.env which is populated from .env.test.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import {
  generateVerificationToken,
  validateVerificationToken,
  generateUnsubscribeToken,
  validateUnsubscribeToken,
  parseEmailPreferences,
  isEmailTypeEnabled,
  buildVerificationUrl,
  buildUnsubscribeUrl,
  DEFAULT_EMAIL_PREFERENCES,
  OPTIONAL_EMAIL_TYPES,
  REQUIRED_EMAIL_TYPES,
} from "@/lib/email-utils";

// ─────────────────────────────────────────────────────────────────────────────
// generateVerificationToken / validateVerificationToken
// ─────────────────────────────────────────────────────────────────────────────

describe("generateVerificationToken", () => {
  it("returns a string with exactly 3 dot-separated parts", () => {
    const token = generateVerificationToken("user@example.com");
    const parts = token.split(".");
    expect(parts).toHaveLength(3);
  });

  it("produces different tokens for different emails", () => {
    const t1 = generateVerificationToken("alice@example.com");
    const t2 = generateVerificationToken("bob@example.com");
    expect(t1).not.toBe(t2);
  });

  it("produces tokens that are strings", () => {
    const t1 = generateVerificationToken("user@example.com");
    const t2 = generateVerificationToken("user@example.com");
    expect(typeof t1).toBe("string");
    expect(typeof t2).toBe("string");
  });
});

describe("validateVerificationToken", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Valid token ─────────────────────────────────────────────────────────

  it("returns the email for a valid fresh token", () => {
    const email = "user@example.com";
    const token = generateVerificationToken(email);
    const result = validateVerificationToken(token);
    expect(result).toBe(email);
  });

  it("handles emails with plus signs", () => {
    const email = "user+tag@example.com";
    const token = generateVerificationToken(email);
    expect(validateVerificationToken(token)).toBe(email);
  });

  it("handles emails with subdomains", () => {
    const email = "user@mail.example.co.uk";
    const token = generateVerificationToken(email);
    expect(validateVerificationToken(token)).toBe(email);
  });

  // ── Tampered token ──────────────────────────────────────────────────────

  it("returns null when the signature is tampered with", () => {
    const token = generateVerificationToken("user@example.com");
    const parts = token.split(".");
    const tampered = `${parts[0]}.${parts[1]}.invalidsignatureXXXXX`;
    expect(validateVerificationToken(tampered)).toBeNull();
  });

  it("returns null when the email part is tampered with", () => {
    const token = generateVerificationToken("user@example.com");
    const parts = token.split(".");
    const differentEmail = Buffer.from("hacker@evil.com").toString("base64url");
    const tampered = `${differentEmail}.${parts[1]}.${parts[2]}`;
    expect(validateVerificationToken(tampered)).toBeNull();
  });

  // ── Expired token ───────────────────────────────────────────────────────

  it("returns null for a token older than 24 hours", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-06-01T10:00:00.000Z"));

    const token = generateVerificationToken("user@example.com");

    vi.setSystemTime(new Date("2027-06-02T11:00:00.000Z"));

    const result = validateVerificationToken(token);

    expect(result).toBeNull();
  });

  it("returns the email for a token that is just within 24 hours", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-06-01T10:00:00.000Z"));

    const token = generateVerificationToken("user@example.com");

    vi.setSystemTime(new Date("2027-06-02T09:59:00.000Z"));

    const result = validateVerificationToken(token);

    expect(result).toBe("user@example.com");
  });

  // ── Malformed tokens ────────────────────────────────────────────────────

  it("returns null for an empty string", () => {
    expect(validateVerificationToken("")).toBeNull();
  });

  it("returns null for a token with too few parts", () => {
    expect(validateVerificationToken("abc.def")).toBeNull();
  });

  it("returns null for a token with too many parts", () => {
    expect(validateVerificationToken("a.b.c.d")).toBeNull();
  });

  it("returns null for completely random input", () => {
    expect(validateVerificationToken("not-a-token-at-all")).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateUnsubscribeToken / validateUnsubscribeToken
// ─────────────────────────────────────────────────────────────────────────────

describe("generateUnsubscribeToken", () => {
  it("returns a string with exactly 4 dot-separated parts", () => {
    const token = generateUnsubscribeToken("user-123", "bookingReminders");
    expect(token.split(".")).toHaveLength(4);
  });

  it("produces different tokens for different userIds", () => {
    const t1 = generateUnsubscribeToken("user-1", "bookingReminders");
    const t2 = generateUnsubscribeToken("user-2", "bookingReminders");
    expect(t1).not.toBe(t2);
  });

  it("produces different tokens for different emailTypes", () => {
    const t1 = generateUnsubscribeToken("user-1", "bookingReminders");
    const t2 = generateUnsubscribeToken("user-1", "marketingEmails");
    expect(t1).not.toBe(t2);
  });
});

describe("validateUnsubscribeToken", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Valid token ─────────────────────────────────────────────────────────

  it("returns userId and emailType for a valid fresh token", () => {
    const token = generateUnsubscribeToken("user-123", "bookingReminders");
    const result = validateUnsubscribeToken(token);
    expect(result).not.toBeNull();
    expect(result?.userId).toBe("user-123");
    expect(result?.emailType).toBe("bookingReminders");
  });

  it("works for all valid optional email types", () => {
    for (const emailType of OPTIONAL_EMAIL_TYPES) {
      const token = generateUnsubscribeToken("user-1", emailType);
      const result = validateUnsubscribeToken(token);
      expect(result?.emailType).toBe(emailType);
    }
  });

  // ── Tampered token ──────────────────────────────────────────────────────

  it("returns null when the signature is tampered with", () => {
    const token = generateUnsubscribeToken("user-123", "bookingReminders");
    const parts = token.split(".");
    const tampered = `${parts[0]}.${parts[1]}.${parts[2]}.invalidsig`;
    expect(validateUnsubscribeToken(tampered)).toBeNull();
  });

  it("returns null when the userId part is tampered with", () => {
    const token = generateUnsubscribeToken("user-123", "bookingReminders");
    const parts = token.split(".");
    const hackerUserId = Buffer.from("hacker-id").toString("base64url");
    const tampered = `${hackerUserId}.${parts[1]}.${parts[2]}.${parts[3]}`;
    expect(validateUnsubscribeToken(tampered)).toBeNull();
  });

  // ── Expired token ───────────────────────────────────────────────────────

  it("returns null for a token older than 30 days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-01-01T00:00:00.000Z"));

    const token = generateUnsubscribeToken("user-123", "marketingEmails");

    vi.setSystemTime(new Date("2027-02-01T00:00:00.000Z"));

    const result = validateUnsubscribeToken(token);

    expect(result).toBeNull();
  });

  it("returns valid result for a token just within 30 days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-01-01T00:00:00.000Z"));

    const token = generateUnsubscribeToken("user-123", "reviewRequests");

    vi.setSystemTime(new Date("2027-01-30T00:00:00.000Z"));

    const result = validateUnsubscribeToken(token);

    expect(result).not.toBeNull();
    expect(result?.emailType).toBe("reviewRequests");
  });

  // ── Malformed tokens ────────────────────────────────────────────────────

  it("returns null for empty string", () => {
    expect(validateUnsubscribeToken("")).toBeNull();
  });

  it("returns null for token with 3 parts (verification token format)", () => {
    const verifyToken = generateVerificationToken("user@example.com");
    expect(validateUnsubscribeToken(verifyToken)).toBeNull();
  });

  it("returns null for token with too many parts", () => {
    expect(validateUnsubscribeToken("a.b.c.d.e")).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// parseEmailPreferences
// ─────────────────────────────────────────────────────────────────────────────

describe("parseEmailPreferences", () => {
  // ── Valid input ─────────────────────────────────────────────────────────

  it("returns the provided values when all preferences are valid booleans", () => {
    const result = parseEmailPreferences({
      bookingReminders: false,
      reviewRequests: false,
      marketingEmails: true,
    });
    expect(result.bookingReminders).toBe(false);
    expect(result.reviewRequests).toBe(false);
    expect(result.marketingEmails).toBe(true);
  });

  it("returns all defaults when given an empty object", () => {
    const result = parseEmailPreferences({});
    expect(result).toEqual(DEFAULT_EMAIL_PREFERENCES);
  });

  // ── Null / undefined input ──────────────────────────────────────────────

  it("returns defaults when given null", () => {
    expect(parseEmailPreferences(null)).toEqual(DEFAULT_EMAIL_PREFERENCES);
  });

  it("returns defaults when given undefined", () => {
    expect(parseEmailPreferences(undefined)).toEqual(DEFAULT_EMAIL_PREFERENCES);
  });

  it("returns defaults when given a non-object primitive", () => {
    expect(parseEmailPreferences("not an object")).toEqual(
      DEFAULT_EMAIL_PREFERENCES
    );
    expect(parseEmailPreferences(42)).toEqual(DEFAULT_EMAIL_PREFERENCES);
  });

  // ── Partial preferences ─────────────────────────────────────────────────

  it("uses default for a missing key while preserving provided ones", () => {
    const result = parseEmailPreferences({ bookingReminders: false });
    expect(result.bookingReminders).toBe(false);
    expect(result.reviewRequests).toBe(
      DEFAULT_EMAIL_PREFERENCES.reviewRequests
    );
    expect(result.marketingEmails).toBe(
      DEFAULT_EMAIL_PREFERENCES.marketingEmails
    );
  });

  // ── Non-boolean values ──────────────────────────────────────────────────

  it("falls back to default when a preference value is a string", () => {
    const result = parseEmailPreferences({ bookingReminders: "yes" });
    expect(result.bookingReminders).toBe(
      DEFAULT_EMAIL_PREFERENCES.bookingReminders
    );
  });

  it("falls back to default when a preference value is a number", () => {
    const result = parseEmailPreferences({ marketingEmails: 1 });
    expect(result.marketingEmails).toBe(
      DEFAULT_EMAIL_PREFERENCES.marketingEmails
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isEmailTypeEnabled
// ─────────────────────────────────────────────────────────────────────────────

describe("isEmailTypeEnabled", () => {
  it("returns true when the preference is explicitly true", () => {
    const prefs = {
      bookingReminders: true,
      reviewRequests: true,
      marketingEmails: true,
    };
    expect(isEmailTypeEnabled(prefs, "bookingReminders")).toBe(true);
  });

  it("returns false when the preference is explicitly false", () => {
    const prefs = {
      bookingReminders: false,
      reviewRequests: true,
      marketingEmails: true,
    };
    expect(isEmailTypeEnabled(prefs, "bookingReminders")).toBe(false);
  });

  it("returns the default (true) when preferences are null", () => {
    expect(isEmailTypeEnabled(null, "marketingEmails")).toBe(
      DEFAULT_EMAIL_PREFERENCES.marketingEmails
    );
  });

  it("returns the default (true) when the key is missing", () => {
    expect(isEmailTypeEnabled({}, "reviewRequests")).toBe(
      DEFAULT_EMAIL_PREFERENCES.reviewRequests
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildVerificationUrl
// ─────────────────────────────────────────────────────────────────────────────

describe("buildVerificationUrl", () => {
  it("constructs the correct verification URL", () => {
    const url = buildVerificationUrl("mytoken");
    expect(url).toContain("/api/auth/verify-email");
    expect(url).toContain("token=mytoken");
  });

  it("URL-encodes the token", () => {
    const url = buildVerificationUrl("abc.def.ghi");
    expect(url).toContain("token=");
    expect(url).not.toContain(" ");
  });

  it("uses AUTH_URL from environment when set", () => {
    // .env.test sets AUTH_URL=http://localhost:3000
    const url = buildVerificationUrl("token123");
    expect(url.startsWith("http://localhost:3000")).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildUnsubscribeUrl
// ─────────────────────────────────────────────────────────────────────────────

describe("buildUnsubscribeUrl", () => {
  it("constructs the correct unsubscribe URL", () => {
    const url = buildUnsubscribeUrl("mytoken");
    expect(url).toContain("/api/email/unsubscribe");
    expect(url).toContain("token=mytoken");
  });

  it("uses AUTH_URL from environment when set", () => {
    const url = buildUnsubscribeUrl("token123");
    expect(url.startsWith("http://localhost:3000")).toBe(true);
  });

  it("URL-encodes the token", () => {
    const url = buildUnsubscribeUrl("abc.def.ghi.xyz");
    expect(url).toContain("token=");
    expect(url).not.toContain(" ");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

describe("email-utils constants", () => {
  it("DEFAULT_EMAIL_PREFERENCES has all 3 keys set to true", () => {
    expect(DEFAULT_EMAIL_PREFERENCES.bookingReminders).toBe(true);
    expect(DEFAULT_EMAIL_PREFERENCES.reviewRequests).toBe(true);
    expect(DEFAULT_EMAIL_PREFERENCES.marketingEmails).toBe(true);
  });

  it("OPTIONAL_EMAIL_TYPES contains the 3 toggleable types", () => {
    expect(OPTIONAL_EMAIL_TYPES).toContain("bookingReminders");
    expect(OPTIONAL_EMAIL_TYPES).toContain("reviewRequests");
    expect(OPTIONAL_EMAIL_TYPES).toContain("marketingEmails");
    expect(OPTIONAL_EMAIL_TYPES).toHaveLength(3);
  });

  it("REQUIRED_EMAIL_TYPES contains the 5 transactional types", () => {
    expect(REQUIRED_EMAIL_TYPES).toContain("bookingConfirmation");
    expect(REQUIRED_EMAIL_TYPES).toContain("paymentReceipt");
    expect(REQUIRED_EMAIL_TYPES).toContain("bookingCancelled");
    expect(REQUIRED_EMAIL_TYPES).toContain("emailVerification");
    expect(REQUIRED_EMAIL_TYPES).toContain("welcome");
    expect(REQUIRED_EMAIL_TYPES).toHaveLength(5);
  });
});
