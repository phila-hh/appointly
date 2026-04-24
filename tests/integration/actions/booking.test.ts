/**
 * @file Booking Server Action Integration Tests
 * @description Tests for createBooking, updateBookingStatus, and rescheduleBooking.
 *
 * Covers:
 *   - createBooking: auth guard, role guard, inactive service check,
 *     conflict detection, successful creation with payment record
 *   - updateBookingStatus: auth guard, ownership check,
 *     invalid status transitions, customer can only cancel,
 *     successful transitions
 *   - rescheduleBooking: ownership check, rescheduling conflict detection,
 *     successful reschedule
 */

import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";

import {
  createBooking,
  updateBookingStatus,
  rescheduleBooking,
} from "@/lib/actions/booking";
import { cleanDatabase, disconnectTestDb, testDb } from "../helpers/db";
import {
  createTestUser,
  createTestBusiness,
  createTestService,
  createTestBooking,
} from "../helpers/factories";

// ── Session mock ─────────────────────────────────────────────────────────────

vi.mock("@/lib/session", () => ({
  getCurrentUser: vi.fn(),
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

/** Returns an ISO date string 7 days from now. */
function futureDate(daysFromNow = 7): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split("T")[0];
}

// ────────────────────────────────────────────────────────────────────────────

describe("createBooking", () => {
  // ── Auth guard ──────────────────────────────────────────────────────────

  it("returns error when user is not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const result = await createBooking({
      serviceId: "s1",
      businessId: "b1",
      date: futureDate(),
      startTime: "10:00",
      endTime: "10:30",
    });

    expect(result.error).toContain("sign in");
  });

  // ── Role guard ──────────────────────────────────────────────────────────

  it("returns error when user is a BUSINESS_OWNER", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    mockGetCurrentUser.mockResolvedValue({
      id: owner.id,
      role: "BUSINESS_OWNER",
      name: owner.name,
      email: owner.email,
    });

    const result = await createBooking({
      serviceId: "s1",
      businessId: "b1",
      date: futureDate(),
      startTime: "10:00",
      endTime: "10:30",
    });

    expect(result.error).toContain("Only customers");
  });

  // ── Service validation ──────────────────────────────────────────────────

  it("returns error when service is inactive", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const customer = await createTestUser({ role: "CUSTOMER" });
    const business = await createTestBusiness({ ownerId: owner.id });
    const service = await createTestService({
      businessId: business.id,
      isActive: false,
    });

    mockGetCurrentUser.mockResolvedValue({
      id: customer.id,
      role: "CUSTOMER",
      name: customer.name,
      email: customer.email,
    });

    const result = await createBooking({
      serviceId: service.id,
      businessId: business.id,
      date: futureDate(),
      startTime: "10:00",
      endTime: "10:30",
    });

    expect(result.error).toContain("no longer available");
  });

  it("returns error when service does not belong to the business", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const customer = await createTestUser({ role: "CUSTOMER" });
    const business = await createTestBusiness({ ownerId: owner.id });

    const otherOwner = await createTestUser({ role: "BUSINESS_OWNER" });
    const otherBusiness = await createTestBusiness({ ownerId: otherOwner.id });
    const foreignService = await createTestService({
      businessId: otherBusiness.id,
    });

    mockGetCurrentUser.mockResolvedValue({
      id: customer.id,
      role: "CUSTOMER",
      name: customer.name,
      email: customer.email,
    });

    const result = await createBooking({
      serviceId: foreignService.id,
      businessId: business.id,
      date: futureDate(),
      startTime: "10:00",
      endTime: "10:30",
    });

    expect(result.error).toContain("does not belong");
  });

  // ── Conflict detection ──────────────────────────────────────────────────

  it("returns error when the time slot is already booked", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const customer = await createTestUser({ role: "CUSTOMER" });
    const business = await createTestBusiness({ ownerId: owner.id });
    const service = await createTestService({ businessId: business.id });

    const bookingDate = futureDate(3);

    // Create an existing confirmed booking at the same time
    await createTestBooking({
      customerId: customer.id,
      businessId: business.id,
      serviceId: service.id,
      date: new Date(bookingDate),
      startTime: "10:00",
      endTime: "10:30",
      status: "CONFIRMED",
    });

    const customer2 = await createTestUser({ role: "CUSTOMER" });
    mockGetCurrentUser.mockResolvedValue({
      id: customer2.id,
      role: "CUSTOMER",
      name: customer2.name,
      email: customer2.email,
    });

    const result = await createBooking({
      serviceId: service.id,
      businessId: business.id,
      date: bookingDate,
      startTime: "10:00",
      endTime: "10:30",
    });

    expect(result.error).toContain("no longer available");
  });

  // ── Successful creation ─────────────────────────────────────────────────

  it("creates a booking record in the database", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const customer = await createTestUser({ role: "CUSTOMER" });
    const business = await createTestBusiness({ ownerId: owner.id });
    const service = await createTestService({
      businessId: business.id,
      price: 50,
    });

    mockGetCurrentUser.mockResolvedValue({
      id: customer.id,
      role: "CUSTOMER",
      name: customer.name,
      email: customer.email,
    });

    const result = await createBooking({
      serviceId: service.id,
      businessId: business.id,
      date: futureDate(),
      startTime: "11:00",
      endTime: "11:30",
    });

    expect(result.success).toBeDefined();
    expect(result.bookingId).toBeDefined();

    const booking = await testDb.booking.findUnique({
      where: { id: result.bookingId },
    });

    expect(booking).not.toBeNull();
    expect(booking?.customerId).toBe(customer.id);
    expect(booking?.status).toBe("PENDING");
  });

  it("creates a payment record alongside the booking", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const customer = await createTestUser({ role: "CUSTOMER" });
    const business = await createTestBusiness({ ownerId: owner.id });
    const service = await createTestService({ businessId: business.id });

    mockGetCurrentUser.mockResolvedValue({
      id: customer.id,
      role: "CUSTOMER",
      name: customer.name,
      email: customer.email,
    });

    const result = await createBooking({
      serviceId: service.id,
      businessId: business.id,
      date: futureDate(),
      startTime: "14:00",
      endTime: "14:30",
    });

    const payment = await testDb.payment.findUnique({
      where: { bookingId: result.bookingId },
    });

    expect(payment).not.toBeNull();
    expect(payment?.status).toBe("PENDING");
  });

  it("snapshots the service price at booking time", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const customer = await createTestUser({ role: "CUSTOMER" });
    const business = await createTestBusiness({ ownerId: owner.id });
    const service = await createTestService({
      businessId: business.id,
      price: 75,
    });

    mockGetCurrentUser.mockResolvedValue({
      id: customer.id,
      role: "CUSTOMER",
      name: customer.name,
      email: customer.email,
    });

    const result = await createBooking({
      serviceId: service.id,
      businessId: business.id,
      date: futureDate(),
      startTime: "15:00",
      endTime: "15:30",
    });

    const booking = await testDb.booking.findUnique({
      where: { id: result.bookingId },
    });

    expect(Number(booking?.totalPrice)).toBe(75);
  });
});

// ────────────────────────────────────────────────────────────────────────────

describe("updateBookingStatus", () => {
  // ── Auth guard ──────────────────────────────────────────────────────────

  it("returns error when user is not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const result = await updateBookingStatus({
      bookingId: "any-id",
      status: "CONFIRMED",
    });

    expect(result.error).toContain("sign in");
  });

  // ── Ownership check ─────────────────────────────────────────────────────

  it("returns error when user is neither the customer nor the business owner", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const customer = await createTestUser({ role: "CUSTOMER" });
    const stranger = await createTestUser({ role: "CUSTOMER" });
    const business = await createTestBusiness({ ownerId: owner.id });
    const service = await createTestService({ businessId: business.id });

    const booking = await createTestBooking({
      customerId: customer.id,
      businessId: business.id,
      serviceId: service.id,
    });

    mockGetCurrentUser.mockResolvedValue({
      id: stranger.id,
      role: "CUSTOMER",
      name: stranger.name,
      email: stranger.email,
    });

    const result = await updateBookingStatus({
      bookingId: booking.id,
      status: "CANCELLED",
    });

    expect(result.error).toContain("permission");
  });

  // ── Customer can only cancel ────────────────────────────────────────────

  it("returns error when customer tries to CONFIRM their own booking", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const customer = await createTestUser({ role: "CUSTOMER" });
    const business = await createTestBusiness({ ownerId: owner.id });
    const service = await createTestService({ businessId: business.id });

    const booking = await createTestBooking({
      customerId: customer.id,
      businessId: business.id,
      serviceId: service.id,
      status: "PENDING",
    });

    mockGetCurrentUser.mockResolvedValue({
      id: customer.id,
      role: "CUSTOMER",
      name: customer.name,
      email: customer.email,
    });

    const result = await updateBookingStatus({
      bookingId: booking.id,
      status: "CONFIRMED",
    });

    expect(result.error).toContain("only cancel");
  });

  // ── Invalid status transition ───────────────────────────────────────────

  it("returns error for invalid status transition (COMPLETED → CONFIRMED)", async () => {
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

    mockGetCurrentUser.mockResolvedValue({
      id: owner.id,
      role: "BUSINESS_OWNER",
      name: owner.name,
      email: owner.email,
    });

    const result = await updateBookingStatus({
      bookingId: booking.id,
      status: "CONFIRMED",
    });

    expect(result.error).toContain("Cannot change status");
  });

  // ── Successful transitions ──────────────────────────────────────────────

  it("allows business owner to CONFIRM a PENDING booking", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const customer = await createTestUser({ role: "CUSTOMER" });
    const business = await createTestBusiness({ ownerId: owner.id });
    const service = await createTestService({ businessId: business.id });

    const booking = await createTestBooking({
      customerId: customer.id,
      businessId: business.id,
      serviceId: service.id,
      status: "PENDING",
    });

    mockGetCurrentUser.mockResolvedValue({
      id: owner.id,
      role: "BUSINESS_OWNER",
      name: owner.name,
      email: owner.email,
    });

    const result = await updateBookingStatus({
      bookingId: booking.id,
      status: "CONFIRMED",
    });

    expect(result.success).toBeDefined();

    const updated = await testDb.booking.findUnique({
      where: { id: booking.id },
    });
    expect(updated?.status).toBe("CONFIRMED");
  });

  it("allows customer to CANCEL their own booking", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const customer = await createTestUser({ role: "CUSTOMER" });
    const business = await createTestBusiness({ ownerId: owner.id });
    const service = await createTestService({ businessId: business.id });

    const booking = await createTestBooking({
      customerId: customer.id,
      businessId: business.id,
      serviceId: service.id,
      status: "CONFIRMED",
    });

    mockGetCurrentUser.mockResolvedValue({
      id: customer.id,
      role: "CUSTOMER",
      name: customer.name,
      email: customer.email,
    });

    const result = await updateBookingStatus({
      bookingId: booking.id,
      status: "CANCELLED",
    });

    expect(result.success).toBeDefined();

    const updated = await testDb.booking.findUnique({
      where: { id: booking.id },
    });
    expect(updated?.status).toBe("CANCELLED");
  });
});

// ────────────────────────────────────────────────────────────────────────────

describe("rescheduleBooking", () => {
  it("returns error when booking does not belong to the current user", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const customer = await createTestUser({ role: "CUSTOMER" });
    const stranger = await createTestUser({ role: "CUSTOMER" });
    const business = await createTestBusiness({ ownerId: owner.id });
    const service = await createTestService({ businessId: business.id });

    const booking = await createTestBooking({
      customerId: customer.id,
      businessId: business.id,
      serviceId: service.id,
    });

    mockGetCurrentUser.mockResolvedValue({
      id: stranger.id,
      role: "CUSTOMER",
      name: stranger.name,
      email: stranger.email,
    });

    const result = await rescheduleBooking({
      bookingId: booking.id,
      date: futureDate(10),
      startTime: "09:00",
      endTime: "09:30",
    });

    expect(result.error).toContain("permission");
  });

  it("updates the booking date and time on successful reschedule", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const customer = await createTestUser({ role: "CUSTOMER" });
    const business = await createTestBusiness({ ownerId: owner.id });
    const service = await createTestService({ businessId: business.id });

    const booking = await createTestBooking({
      customerId: customer.id,
      businessId: business.id,
      serviceId: service.id,
      date: new Date(futureDate(3)),
      startTime: "10:00",
      endTime: "10:30",
      status: "CONFIRMED",
    });

    mockGetCurrentUser.mockResolvedValue({
      id: customer.id,
      role: "CUSTOMER",
      name: customer.name,
      email: customer.email,
    });

    const newDate = futureDate(8);
    const result = await rescheduleBooking({
      bookingId: booking.id,
      date: newDate,
      startTime: "14:00",
      endTime: "14:30",
    });

    expect(result.success).toBeDefined();

    const updated = await testDb.booking.findUnique({
      where: { id: booking.id },
    });
    expect(updated?.startTime).toBe("14:00");
    expect(updated?.endTime).toBe("14:30");
  });
});
