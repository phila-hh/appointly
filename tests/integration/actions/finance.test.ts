/**
 * @file Finance Server Action Integration Tests
 * @description Tests for generatePayoutsForPeriod, setPayoutProcessing,
 * markPayoutPaid, and markPayoutFailed.
 *
 * Covers:
 *   - generatePayoutsForPeriod: admin guard, period validation,
 *     no pending commissions, successful batch creation,
 *     commissions linked and status updated
 *   - setPayoutProcessing: payout not found, wrong status, successful
 *   - markPayoutPaid: reference required, already paid guard, successful,
 *     commissions marked PAID_OUT
 *   - markPayoutFailed: already paid guard, successful,
 *     commissions returned to PENDING
 */

import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";

import {
  generatePayoutsForPeriod,
  setPayoutProcessing,
  markPayoutPaid,
  markPayoutFailed,
} from "@/lib/actions/finance";
import { cleanDatabase, disconnectTestDb, testDb } from "../helpers/db";
import {
  createTestUser,
  createTestBusiness,
  createTestService,
  createTestBooking,
  createTestCommission,
} from "../helpers/factories";

// ── Session mock via guards ──────────────────────────────────────────────────
// requireAdmin() calls getCurrentUser() internally via the guards module.
// We mock the session to return an admin user.

vi.mock("@/lib/session", () => ({
  getCurrentUser: vi.fn(),
}));

// We also need to prevent redirect() from throwing in requireRole
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

import { getCurrentUser } from "@/lib/session";
const mockGetCurrentUser = vi.mocked(getCurrentUser);

// ── Setup ────────────────────────────────────────────────────────────────────

beforeEach(async () => {
  await cleanDatabase();
  vi.clearAllMocks();
});

afterAll(async () => {
  await disconnectTestDb();
});

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Sets up an ADMIN user as the current session user.
 */
async function loginAsAdmin() {
  const admin = await createTestUser({ role: "ADMIN" });
  mockGetCurrentUser.mockResolvedValue({
    id: admin.id,
    role: "ADMIN",
    name: admin.name,
    email: admin.email,
  });
  return admin;
}

/**
 * Creates the minimum setup needed for a commission:
 * owner → business → service → booking → commission
 */
async function createCommissionSetup() {
  const owner = await createTestUser({ role: "BUSINESS_OWNER" });
  const customer = await createTestUser({ role: "CUSTOMER" });
  const business = await createTestBusiness({ ownerId: owner.id });
  const service = await createTestService({ businessId: business.id });
  const booking = await createTestBooking({
    customerId: customer.id,
    businessId: business.id,
    serviceId: service.id,
    status: "COMPLETED",
  });
  const commission = await createTestCommission({
    bookingId: booking.id,
    businessId: business.id,
    grossAmount: 100,
    commissionRate: 0.1,
    status: "PENDING",
  });

  return { business, commission };
}

// ────────────────────────────────────────────────────────────────────────────

describe("generatePayoutsForPeriod", () => {
  // ── Admin guard ─────────────────────────────────────────────────────────

  it("throws redirect when user is not an ADMIN", async () => {
    const customer = await createTestUser({ role: "CUSTOMER" });
    mockGetCurrentUser.mockResolvedValue({
      id: customer.id,
      role: "CUSTOMER",
      name: customer.name,
      email: customer.email,
    });

    await expect(generatePayoutsForPeriod("2025-06")).rejects.toThrow(
      "NEXT_REDIRECT"
    );
  });

  // ── Period validation ───────────────────────────────────────────────────

  it("returns error for empty period string", async () => {
    await loginAsAdmin();

    const result = await generatePayoutsForPeriod("");
    expect(result.error).toContain("required");
  });

  it("returns error for invalid period format", async () => {
    await loginAsAdmin();

    const result = await generatePayoutsForPeriod("June 2025");
    expect(result.error).toContain("Invalid period format");
  });

  // ── No pending commissions ──────────────────────────────────────────────

  it("returns error when there are no pending commissions", async () => {
    await loginAsAdmin();

    const result = await generatePayoutsForPeriod("2025-06");
    expect(result.error).toContain("No pending commissions");
  });

  // ── Successful generation ───────────────────────────────────────────────

  it("creates a payout record for each business with pending commissions", async () => {
    await loginAsAdmin();
    const { business } = await createCommissionSetup();

    const result = await generatePayoutsForPeriod("2025-06");
    expect(result.success).toBeDefined();

    const payouts = await testDb.payout.findMany({
      where: { businessId: business.id, period: "2025-06" },
    });
    expect(payouts).toHaveLength(1);
    expect(payouts[0].status).toBe("PENDING");
  });

  it("links commissions to the payout and sets status to INCLUDED_IN_PAYOUT", async () => {
    await loginAsAdmin();
    const { commission } = await createCommissionSetup();

    await generatePayoutsForPeriod("2025-06");

    const updated = await testDb.commission.findUnique({
      where: { id: commission.id },
    });

    expect(updated?.status).toBe("INCLUDED_IN_PAYOUT");
    expect(updated?.payoutId).not.toBeNull();
  });

  it("groups multiple commissions from the same business into one payout", async () => {
    await loginAsAdmin();

    // Two commissions for the same business
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const customer = await createTestUser({ role: "CUSTOMER" });
    const business = await createTestBusiness({ ownerId: owner.id });
    const service = await createTestService({ businessId: business.id });

    const booking1 = await createTestBooking({
      customerId: customer.id,
      businessId: business.id,
      serviceId: service.id,
      status: "COMPLETED",
      startTime: "10:00",
      endTime: "10:30",
    });
    const booking2 = await createTestBooking({
      customerId: customer.id,
      businessId: business.id,
      serviceId: service.id,
      status: "COMPLETED",
      startTime: "11:00",
      endTime: "11:30",
    });

    await createTestCommission({
      bookingId: booking1.id,
      businessId: business.id,
      grossAmount: 100,
    });
    await createTestCommission({
      bookingId: booking2.id,
      businessId: business.id,
      grossAmount: 150,
    });

    await generatePayoutsForPeriod("2025-07");

    const payouts = await testDb.payout.findMany({
      where: { businessId: business.id },
    });

    // Both commissions should be in a single payout
    expect(payouts).toHaveLength(1);
    expect(Number(payouts[0].grossTotal)).toBe(250);
  });
});

// ────────────────────────────────────────────────────────────────────────────

describe("setPayoutProcessing", () => {
  it("returns error when payout is not found", async () => {
    await loginAsAdmin();

    const result = await setPayoutProcessing("nonexistent-id");
    expect(result.error).toContain("not found");
  });

  it("returns error when payout is not in PENDING status", async () => {
    await loginAsAdmin();
    const { business } = await createCommissionSetup();
    await generatePayoutsForPeriod("2025-06");

    const payout = await testDb.payout.findFirst({
      where: { businessId: business.id },
    });

    // Move it to PROCESSING first
    await testDb.payout.update({
      where: { id: payout!.id },
      data: { status: "PROCESSING" },
    });

    const result = await setPayoutProcessing(payout!.id);
    expect(result.error).toContain("PROCESSING");
  });

  it("moves payout to PROCESSING status", async () => {
    await loginAsAdmin();
    const { business } = await createCommissionSetup();
    await generatePayoutsForPeriod("2025-06");

    const payout = await testDb.payout.findFirst({
      where: { businessId: business.id },
    });

    const result = await setPayoutProcessing(payout!.id);
    expect(result.success).toBeDefined();

    const updated = await testDb.payout.findUnique({
      where: { id: payout!.id },
    });
    expect(updated?.status).toBe("PROCESSING");
  });
});

// ────────────────────────────────────────────────────────────────────────────

describe("markPayoutPaid", () => {
  it("returns error when reference is empty", async () => {
    await loginAsAdmin();

    const result = await markPayoutPaid("any-id", "");
    expect(result.error).toContain("Reference is required");
  });

  it("marks payout as PAID with reference and paidAt timestamp", async () => {
    await loginAsAdmin();
    const { business } = await createCommissionSetup();
    await generatePayoutsForPeriod("2025-06");

    const payout = await testDb.payout.findFirst({
      where: { businessId: business.id },
    });

    const result = await markPayoutPaid(payout!.id, "TXN-REF-12345");
    expect(result.success).toBeDefined();

    const updated = await testDb.payout.findUnique({
      where: { id: payout!.id },
    });
    expect(updated?.status).toBe("PAID");
    expect(updated?.reference).toBe("TXN-REF-12345");
    expect(updated?.paidAt).not.toBeNull();
  });

  it("marks all linked commissions as PAID_OUT", async () => {
    await loginAsAdmin();
    const { business, commission } = await createCommissionSetup();
    await generatePayoutsForPeriod("2025-06");

    const payout = await testDb.payout.findFirst({
      where: { businessId: business.id },
    });

    await markPayoutPaid(payout!.id, "TXN-REF-PAID");

    const updatedCommission = await testDb.commission.findUnique({
      where: { id: commission.id },
    });

    expect(updatedCommission?.status).toBe("PAID_OUT");
  });

  it("returns error when payout is already PAID", async () => {
    await loginAsAdmin();
    const { business } = await createCommissionSetup();
    await generatePayoutsForPeriod("2025-06");

    const payout = await testDb.payout.findFirst({
      where: { businessId: business.id },
    });

    await markPayoutPaid(payout!.id, "FIRST-REF");

    // Try to mark as paid again
    const result = await markPayoutPaid(payout!.id, "SECOND-REF");
    expect(result.error).toContain("already been marked as paid");
  });
});

// ────────────────────────────────────────────────────────────────────────────

describe("markPayoutFailed", () => {
  it("returns error when trying to fail a PAID payout", async () => {
    await loginAsAdmin();
    const { business } = await createCommissionSetup();
    await generatePayoutsForPeriod("2025-06");

    const payout = await testDb.payout.findFirst({
      where: { businessId: business.id },
    });

    await markPayoutPaid(payout!.id, "TXN-REF");

    const result = await markPayoutFailed(payout!.id);
    expect(result.error).toContain("completed payout");
  });

  it("marks payout as FAILED", async () => {
    await loginAsAdmin();
    const { business } = await createCommissionSetup();
    await generatePayoutsForPeriod("2025-06");

    const payout = await testDb.payout.findFirst({
      where: { businessId: business.id },
    });

    const result = await markPayoutFailed(payout!.id);
    expect(result.success).toBeDefined();

    const updated = await testDb.payout.findUnique({
      where: { id: payout!.id },
    });
    expect(updated?.status).toBe("FAILED");
  });

  it("returns linked commissions to PENDING status", async () => {
    await loginAsAdmin();
    const { business, commission } = await createCommissionSetup();
    await generatePayoutsForPeriod("2025-06");

    const payout = await testDb.payout.findFirst({
      where: { businessId: business.id },
    });

    await markPayoutFailed(payout!.id);

    const updated = await testDb.commission.findUnique({
      where: { id: commission.id },
    });

    expect(updated?.status).toBe("PENDING");
    expect(updated?.payoutId).toBeNull();
  });
});
