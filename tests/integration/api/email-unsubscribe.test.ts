/**
 * @file Email Unsubscribe API Route Integration Tests
 * @description Tests for GET /api/email/unsubscribe
 *
 * Covers:
 *   - Missing token → redirects with error
 *   - Invalid token → redirects with error
 *   - Valid token for unknown user → redirects with error
 *   - Valid token → updates the specific email preference to false
 *   - Each unsubscribable email type (bookingReminders, reviewRequests,
 *     marketingEmails) is handled correctly
 */

import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { NextRequest } from "next/server";

import { GET } from "@/app/api/email/unsubscribe/route";
import { generateUnsubscribeToken } from "@/lib/email-utils";
import { cleanDatabase, disconnectTestDb, testDb } from "../helpers/db";
import { createTestUser } from "../helpers/factories";

// ── Helpers ──────────────────────────────────────────────────────────────────

const BASE_URL = "http://localhost:3000";

function buildRequest(token?: string): NextRequest {
  const url = token
    ? `${BASE_URL}/api/email/unsubscribe?token=${token}`
    : `${BASE_URL}/api/email/unsubscribe`;
  return new NextRequest(url);
}

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

describe("GET /api/email/unsubscribe", () => {
  // ── Missing token ───────────────────────────────────────────────────────

  it("redirects with error when token is missing", async () => {
    const response = await GET(buildRequest());

    expect(response.status).toBe(307);
    const location = getRedirectUrl(response);
    const decoded = decodeURIComponent(location);

    expect(decoded).toContain("status=error");
    expect(decoded).toContain("Missing unsubscribe token");
  });

  // ── Invalid token ───────────────────────────────────────────────────────

  it("redirects with error when token is invalid", async () => {
    const response = await GET(buildRequest("bad.token.here"));

    expect(response.status).toBe(307);
    const location = getRedirectUrl(response);
    const decoded = decodeURIComponent(location);

    expect(decoded).toContain("status=error");
    expect(decoded).toContain("Invalid or expired");
  });

  // ── User not found ──────────────────────────────────────────────────────

  it("redirects with error when userId from token has no matching user", async () => {
    const token = generateUnsubscribeToken(
      "nonexistent-user-id",
      "bookingReminders"
    );
    const response = await GET(buildRequest(token));

    expect(response.status).toBe(307);
    const location = getRedirectUrl(response);
    const decoded = decodeURIComponent(location);

    expect(decoded).toContain("status=error");
    expect(decoded).toContain("Account not found");
  });

  // ── Successful unsubscribe — bookingReminders ───────────────────────────

  it("sets bookingReminders to false in user emailPreferences", async () => {
    const user = await createTestUser({
      emailPreferences: {
        bookingReminders: true,
        reviewRequests: true,
        marketingEmails: true,
      },
    });

    const token = generateUnsubscribeToken(user.id, "bookingReminders");
    const response = await GET(buildRequest(token));

    expect(response.status).toBe(307);
    const location = getRedirectUrl(response);
    const decoded = decodeURIComponent(location);

    expect(decoded).toContain("status=success");

    const updated = await testDb.user.findUnique({
      where: { id: user.id },
      select: { emailPreferences: true },
    });

    const prefs = updated?.emailPreferences as Record<string, boolean>;
    expect(prefs.bookingReminders).toBe(false);
    // Other preferences should remain unchanged
    expect(prefs.reviewRequests).toBe(true);
    expect(prefs.marketingEmails).toBe(true);
  });

  // ── Successful unsubscribe — reviewRequests ─────────────────────────────

  it("sets reviewRequests to false without affecting other preferences", async () => {
    const user = await createTestUser({
      emailPreferences: {
        bookingReminders: true,
        reviewRequests: true,
        marketingEmails: true,
      },
    });

    const token = generateUnsubscribeToken(user.id, "reviewRequests");
    await GET(buildRequest(token));

    const updated = await testDb.user.findUnique({
      where: { id: user.id },
      select: { emailPreferences: true },
    });

    const prefs = updated?.emailPreferences as Record<string, boolean>;
    expect(prefs.reviewRequests).toBe(false);
    expect(prefs.bookingReminders).toBe(true);
  });

  // ── Successful unsubscribe — marketingEmails ────────────────────────────

  it("sets marketingEmails to false without affecting other preferences", async () => {
    const user = await createTestUser({
      emailPreferences: {
        bookingReminders: true,
        reviewRequests: true,
        marketingEmails: true,
      },
    });

    const token = generateUnsubscribeToken(user.id, "marketingEmails");
    await GET(buildRequest(token));

    const updated = await testDb.user.findUnique({
      where: { id: user.id },
      select: { emailPreferences: true },
    });

    const prefs = updated?.emailPreferences as Record<string, boolean>;
    expect(prefs.marketingEmails).toBe(false);
    expect(prefs.bookingReminders).toBe(true);
  });

  // ── Redirect contains human-readable type label ─────────────────────────

  it("includes the human-readable email type in the success redirect", async () => {
    const user = await createTestUser();
    const token = generateUnsubscribeToken(user.id, "bookingReminders");
    const response = await GET(buildRequest(token));

    const location = getRedirectUrl(response);
    const decoded = decodeURIComponent(location);

    expect(decoded).toContain("appointment reminders");
  });
});
