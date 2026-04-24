/**
 * @file Email Verification API Route Integration Tests
 * @description Tests for GET /api/auth/verify-email
 *
 * Covers:
 *   - Missing token → redirects with error
 *   - Invalid/expired token → redirects with error
 *   - Valid token for unknown email → redirects with error
 *   - Valid token for already-verified user → redirects with success
 *   - Valid token for unverified user → sets emailVerified, sends welcome email,
 *     redirects with success
 */

import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { NextRequest } from "next/server";

import { GET } from "@/app/api/auth/verify-email/route";
import { generateVerificationToken } from "@/lib/email-utils";
import { sendEmail } from "@/lib/email";
import { cleanDatabase, disconnectTestDb, testDb } from "../helpers/db";
import { createTestUser } from "../helpers/factories";

// ── Constants ────────────────────────────────────────────────────────────────

const BASE_URL = "http://localhost:3000";

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Builds a NextRequest for the verify-email route.
 * Mirrors how Next.js constructs the request in production.
 */
function buildRequest(token?: string): NextRequest {
  const url = token
    ? `${BASE_URL}/api/auth/verify-email?token=${token}`
    : `${BASE_URL}/api/auth/verify-email`;
  return new NextRequest(url);
}

/**
 * Extracts the redirect destination from a NextResponse.
 */
function getRedirectUrl(response: Response): string {
  return response.headers.get("location") ?? "";
}

// ── Setup ────────────────────────────────────────────────────────────────────

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await disconnectTestDb();
});

// ────────────────────────────────────────────────────────────────────────────

describe("GET /api/auth/verify-email", () => {
  // ── Missing token ───────────────────────────────────────────────────────

  it("redirects with error when token query param is missing", async () => {
    const request = buildRequest();
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = getRedirectUrl(response);
    const decoded = decodeURIComponent(location);

    expect(decoded).toContain("/verify-email");
    expect(decoded).toContain("status=error");
    expect(decoded).toContain("Missing verification token");
  });

  // ── Invalid token ───────────────────────────────────────────────────────

  it("redirects with error when token is invalid or tampered", async () => {
    const request = buildRequest("invalid.token.value");
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = getRedirectUrl(response);
    const decoded = decodeURIComponent(location);

    expect(location).toContain("status=error");
    expect(decoded).toContain("Invalid or expired");
  });

  // ── User not found ──────────────────────────────────────────────────────

  it("redirects with error when email from token has no matching user", async () => {
    // Generate a valid token for an email that has no user record
    const token = generateVerificationToken("ghost@example.com");
    const request = buildRequest(token);
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = getRedirectUrl(response);
    const decoded = decodeURIComponent(location);

    expect(decoded).toContain("status=error");
    expect(decoded).toContain("Account not found");
  });

  // ── Already verified ────────────────────────────────────────────────────

  it("redirects with success when user is already verified", async () => {
    const user = await createTestUser({
      email: "verified@example.com",
      emailVerified: new Date(), // Already verified
    });

    const token = generateVerificationToken(user.email);
    const request = buildRequest(token);
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = getRedirectUrl(response);
    const decoded = decodeURIComponent(location);

    expect(decoded).toContain("status=success");
    expect(decoded).toContain("already verified");
  });

  // ── Successful verification ─────────────────────────────────────────────

  it("sets emailVerified timestamp when token is valid", async () => {
    const user = await createTestUser({
      email: "unverified@example.com",
      emailVerified: null, // Not yet verified
    });

    const token = generateVerificationToken(user.email);
    const request = buildRequest(token);
    await GET(request);

    const updated = await testDb.user.findUnique({
      where: { id: user.id },
      select: { emailVerified: true },
    });

    expect(updated?.emailVerified).not.toBeNull();
    expect(updated?.emailVerified).toBeInstanceOf(Date);
  });

  it("redirects with success message after successful verification", async () => {
    const user = await createTestUser({
      email: "toverify@example.com",
      emailVerified: null,
    });

    const token = generateVerificationToken(user.email);
    const request = buildRequest(token);
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = getRedirectUrl(response);
    const decoded = decodeURIComponent(location);

    expect(decoded).toContain("status=success");
    expect(decoded).toContain("verified successfully");
  });

  it("sends welcome email after successful verification", async () => {
    const user = await createTestUser({
      email: "welcome@example.com",
      emailVerified: null,
    });

    const token = generateVerificationToken(user.email);
    const request = buildRequest(token);
    await GET(request);

    expect(vi.mocked(sendEmail)).toHaveBeenCalledWith(
      expect.objectContaining({
        to: user.email,
        subject: expect.stringContaining("Welcome"),
      })
    );
  });
});
