/**
 * @file Cron Reminders API Route Integration Tests
 * @description Tests for GET /api/cron/reminders
 *
 * Covers:
 *   - Unauthorized request (wrong secret) → 401
 *   - Authorized request with no upcoming bookings → 200, 0 sent
 *   - Authorized request with confirmed bookings in the 23–25h window →
 *     sends reminders and returns correct summary
 *   - Bookings outside the time window are not included
 *   - Bookings with PENDING status (not CONFIRMED) are not included
 */

import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { NextRequest } from "next/server";
import { addHours } from "date-fns";

import { GET } from "@/app/api/cron/reminders/route";
import { sendBookingReminderEmail } from "@/lib/email-service";
import { cleanDatabase, disconnectTestDb } from "../helpers/db";
import {
  createTestUser,
  createTestBusiness,
  createTestService,
  createTestBooking,
} from "../helpers/factories";

// ── Helpers ──────────────────────────────────────────────────────────────────

const BASE_URL = "http://localhost:3000";
const CRON_SECRET = "test-cron-secret"; // matches .env.test

/**
 * Builds a NextRequest for the cron reminders route.
 */
function buildRequest(secret?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (secret) {
    headers["authorization"] = `Bearer ${secret}`;
  }
  return new NextRequest(`${BASE_URL}/api/cron/reminders`, { headers });
}

/**
 * Returns a Date object set to exactly `hours` hours from now,
 * with the time portion set so it falls within the cron window.
 */
function hoursFromNow(hours: number): Date {
  return addHours(new Date(), hours);
}

/**
 * Converts a Date to "HH:mm" string.
 */
function toTimeString(date: Date): string {
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

// ── Setup ────────────────────────────────────────────────────────────────────

beforeEach(async () => {
  await cleanDatabase();
  vi.clearAllMocks();
});

afterAll(async () => {
  await disconnectTestDb();
});

// ────────────────────────────────────────────────────────────────────────────

describe("GET /api/cron/reminders", () => {
  // ── Authorization ───────────────────────────────────────────────────────

  it("returns 401 when authorization header is missing", async () => {
    const response = await GET(buildRequest());
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error).toBe("Unauthorized.");
  });

  it("returns 401 when authorization secret is wrong", async () => {
    const response = await GET(buildRequest("wrong-secret"));
    expect(response.status).toBe(401);
  });

  // ── No upcoming bookings ────────────────────────────────────────────────

  it("returns 200 with zero sent when no bookings are in the window", async () => {
    const response = await GET(buildRequest(CRON_SECRET));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.results.total).toBe(0);
    expect(body.results.sent).toBe(0);
    expect(sendBookingReminderEmail).not.toHaveBeenCalled();
  });

  // ── Bookings in window ──────────────────────────────────────────────────

  it("sends reminders for CONFIRMED bookings in the 23–25h window", async () => {
    // Set up a confirmed booking exactly 24 hours from now
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const customer = await createTestUser({ role: "CUSTOMER" });
    const business = await createTestBusiness({ ownerId: owner.id });
    const service = await createTestService({ businessId: business.id });

    const appointmentTime = hoursFromNow(24);
    const startTime = toTimeString(appointmentTime);
    // endTime is 30 minutes after startTime
    const endTime = toTimeString(
      new Date(appointmentTime.getTime() + 30 * 60 * 1000)
    );

    await createTestBooking({
      customerId: customer.id,
      businessId: business.id,
      serviceId: service.id,
      date: appointmentTime,
      startTime,
      endTime,
      status: "CONFIRMED",
    });

    const response = await GET(buildRequest(CRON_SECRET));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.results.total).toBeGreaterThanOrEqual(1);
    expect(body.results.sent).toBeGreaterThanOrEqual(1);
    expect(sendBookingReminderEmail).toHaveBeenCalled();
  });

  // ── Bookings outside window ─────────────────────────────────────────────

  it("does not send reminders for bookings outside the 23–25h window", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const customer = await createTestUser({ role: "CUSTOMER" });
    const business = await createTestBusiness({ ownerId: owner.id });
    const service = await createTestService({ businessId: business.id });

    // Booking only 1 hour away — outside the 23–25h window
    const tooSoon = hoursFromNow(1);
    const startTime = toTimeString(tooSoon);
    const endTime = toTimeString(new Date(tooSoon.getTime() + 30 * 60 * 1000));

    await createTestBooking({
      customerId: customer.id,
      businessId: business.id,
      serviceId: service.id,
      date: tooSoon,
      startTime,
      endTime,
      status: "CONFIRMED",
    });

    const response = await GET(buildRequest(CRON_SECRET));
    const body = await response.json();

    expect(body.results.total).toBe(0);
    expect(sendBookingReminderEmail).not.toHaveBeenCalled();
  });

  // ── Only CONFIRMED status ───────────────────────────────────────────────

  it("does not send reminders for PENDING bookings even if in the window", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const customer = await createTestUser({ role: "CUSTOMER" });
    const business = await createTestBusiness({ ownerId: owner.id });
    const service = await createTestService({ businessId: business.id });

    const appointmentTime = hoursFromNow(24);
    const startTime = toTimeString(appointmentTime);
    const endTime = toTimeString(
      new Date(appointmentTime.getTime() + 30 * 60 * 1000)
    );

    await createTestBooking({
      customerId: customer.id,
      businessId: business.id,
      serviceId: service.id,
      date: appointmentTime,
      startTime,
      endTime,
      status: "PENDING", // Not CONFIRMED — should be excluded
    });

    const response = await GET(buildRequest(CRON_SECRET));
    const body = await response.json();

    expect(body.results.total).toBe(0);
    expect(sendBookingReminderEmail).not.toHaveBeenCalled();
  });

  // ── Response shape ──────────────────────────────────────────────────────

  it("returns the expected response shape", async () => {
    const response = await GET(buildRequest(CRON_SECRET));
    const body = await response.json();

    expect(body).toMatchObject({
      runAt: expect.any(String),
      window: {
        start: expect.any(String),
        end: expect.any(String),
      },
      results: {
        total: expect.any(Number),
        sent: expect.any(Number),
        skipped: expect.any(Number),
        failed: expect.any(Number),
      },
    });
  });
});
