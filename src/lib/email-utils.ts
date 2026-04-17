/**
 * @file Email Utility Functions
 * @description Token generation for email verification and unsubscribe links,
 * email preference checks, and shared email constants.
 *
 * Security:
 *   - Verification tokens use HMAC-SHA256 signed with AUTH_SECRET
 *   - Tokens include expiry timestamps to prevent indefinite validity
 *   - Unsubscribe tokens are signed to prevent unauthorized preference changes
 *
 * @example
 * ```ts
 * const token = generateVerificationToken("user@example.com");
 * const isValid = verifyToken(token, "user@example.com", "verify");
 * ```
 */

import { createHmac } from "crypto";

// =============================================================================
// Constants
// =============================================================================

/** Verification token expiry in milliseconds (24 hours). */
const VERIFICATION_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

/** Unsubscribe token expiry in milliseconds (30 days). */
const UNSUBSCRIBE_TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

/** Default email preferences for new users. */
export const DEFAULT_EMAIL_PREFERENCES = {
  bookingReminders: true,
  reviewRequests: true,
  marketingEmails: true,
};

/** Email preference keys that users CAN toggle (non-transactional). */
export const OPTIONAL_EMAIL_TYPES = [
  "bookingReminders",
  "reviewRequests",
  "marketingEmails",
] as const;

/** Email types that CANNOT be disabled (transactional). */
export const REQUIRED_EMAIL_TYPES = [
  "bookingConfirmation",
  "paymentReceipt",
  "bookingCancelled",
  "emailVerification",
  "welcome",
] as const;

export type OptionalEmailType = (typeof OPTIONAL_EMAIL_TYPES)[number];

// =============================================================================
// Types
// =============================================================================

/** Email preferences stored as JSON on the User model. */
export interface EmailPreferences {
  bookingReminders: boolean;
  reviewRequests: boolean;
  marketingEmails: boolean;
}

// =============================================================================
// Token Generation & Verification
// =============================================================================

/**
 * Gets the signing secret from environment.
 * Falls back to a development-only secret if AUTH_SECRET is not set.
 */
function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    console.warn(
      "⚠️ AUTH_SECRET not set — using insecure fallback for email tokens."
    );
    return "dev-fallback-secret-not-for-production";
  }
  return secret;
}

/**
 * Creates an HMAC-SHA256 signature for a payload.
 *
 * @param payload - The string to sign
 * @returns Hex-encoded signature
 */
function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

/**
 * Generates a signed email verification token.
 *
 * Token format: `base64(email):timestamp:signature`
 * The signature covers both the email and timestamp to prevent tampering.
 *
 * @param email - The email address to verify
 * @returns Signed token string (URL-safe)
 */
export function generateVerificationToken(email: string): string {
  const timestamp = Date.now().toString();
  const emailEncoded = Buffer.from(email).toString("base64url");
  const payload = `${emailEncoded}:${timestamp}:verify`;
  const signature = sign(payload);

  return `${emailEncoded}.${timestamp}.${signature}`;
}

/**
 * Validates a verification token and extracts the email.
 *
 * Checks:
 *   1. Token format is valid (3 parts)
 *   2. Signature matches (not tampered)
 *   3. Token has not expired (24 hours)
 *
 * @param token - The token to validate
 * @returns The email address if valid, or null if invalid/expired
 */
export function validateVerificationToken(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [emailEncoded, timestamp, providedSignature] = parts;

    // Reconstruct the expected signature
    const payload = `${emailEncoded}:${timestamp}:verify`;
    const expectedSignature = sign(payload);

    // Constant-time comparison to prevent timing attacks
    if (providedSignature !== expectedSignature) return null;

    // Check expiry
    const tokenTime = parseInt(timestamp, 10);
    if (isNaN(tokenTime)) return null;
    if (Date.now() - tokenTime > VERIFICATION_TOKEN_EXPIRY_MS) return null;

    // Decode email
    const email = Buffer.from(emailEncoded, "base64url").toString("utf-8");
    if (!email || !email.includes("@")) return null;

    return email;
  } catch {
    return null;
  }
}

/**
 * Generates a signed unsubscribe token for one-click unsubscribe.
 *
 * Token format: `base64(userId):base64(emailType):timestamp:signature`
 *
 * @param userId - The user's ID
 * @param emailType - The email category to unsubscribe from
 * @returns Signed token string (URL-safe)
 */
export function generateUnsubscribeToken(
  userId: string,
  emailType: OptionalEmailType
): string {
  const timestamp = Date.now().toString();
  const userEncoded = Buffer.from(userId).toString("base64url");
  const typeEncoded = Buffer.from(emailType).toString("base64url");
  const payload = `${userEncoded}:${typeEncoded}:${timestamp}:unsubscribe`;
  const signature = sign(payload);

  return `${userEncoded}.${typeEncoded}.${timestamp}.${signature}`;
}

/**
 * Validates an unsubscribe token and extracts the user ID and email type.
 *
 * @param token - The token to validate
 * @returns Object with userId and emailType if valid, or null
 */
export function validateUnsubscribeToken(
  token: string
): { userId: string; emailType: OptionalEmailType } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 4) return null;

    const [userEncoded, typeEncoded, timestamp, providedSignature] = parts;

    // Reconstruct the expected signature
    const payload = `${userEncoded}:${typeEncoded}:${timestamp}:unsubscribe`;
    const expectedSignature = sign(payload);

    if (providedSignature !== expectedSignature) return null;

    // Check expiry
    const tokenTime = parseInt(timestamp, 10);
    if (isNaN(tokenTime)) return null;
    if (Date.now() - tokenTime > UNSUBSCRIBE_TOKEN_EXPIRY_MS) return null;

    // Decode values
    const userId = Buffer.from(userEncoded, "base64url").toString("utf-8");
    const emailType = Buffer.from(typeEncoded, "base64url").toString(
      "utf-8"
    ) as OptionalEmailType;

    if (!userId || !OPTIONAL_EMAIL_TYPES.includes(emailType)) return null;

    return { userId, emailType };
  } catch {
    return null;
  }
}

// =============================================================================
// Email Preference Helpers
// =============================================================================

/**
 * Parses email preferences from the User model's JSON field.
 * Returns defaults for any missing keys.
 *
 * @param rawPreferences - The raw JSON value from the database
 * @returns Fully populated EmailPreferences object
 */
export function parseEmailPreferences(
  rawPreferences: unknown
): EmailPreferences {
  const defaults = { ...DEFAULT_EMAIL_PREFERENCES };

  if (!rawPreferences || typeof rawPreferences !== "object") {
    return defaults;
  }

  const prefs = rawPreferences as Record<string, unknown>;

  return {
    bookingReminders:
      typeof prefs.bookingReminders === "boolean"
        ? prefs.bookingReminders
        : defaults.bookingReminders,
    reviewRequests:
      typeof prefs.reviewRequests === "boolean"
        ? prefs.reviewRequests
        : defaults.reviewRequests,
    marketingEmails:
      typeof prefs.marketingEmails === "boolean"
        ? prefs.marketingEmails
        : defaults.marketingEmails,
  };
}

/**
 * Checks if a user has a specific optional email type enabled.
 *
 * @param rawPreferences - The raw JSON value from the database
 * @param emailType - The email type to check
 * @returns true if the email type is enabled (defaults to true)
 */
export function isEmailTypeEnabled(
  rawPreferences: unknown,
  emailType: OptionalEmailType
): boolean {
  const prefs = parseEmailPreferences(rawPreferences);
  return prefs[emailType];
}

/**
 * Builds the full verification URL for an email.
 *
 * @param token - The signed verification token
 * @returns Complete URL (e.g., "https://appointly.com/api/auth/verify-email?token=...")
 */
export function buildVerificationUrl(token: string): string {
  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";
  return `${baseUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
}

/**
 * Builds the full unsubscribe URL for an email.
 *
 * @param token - The signed unsubscribe token
 * @returns Complete URL
 */
export function buildUnsubscribeUrl(token: string): string {
  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";
  return `${baseUrl}/api/email/unsubscribe?token=${encodeURIComponent(token)}`;
}
