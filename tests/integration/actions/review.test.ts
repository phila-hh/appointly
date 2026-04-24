/**
 * @file Review Server Action Integration Tests
 * @description Tests for createReview, updateReview, and deleteReview.
 *
 * Covers:
 *   - createReview: auth guard, role guard, booking ownership check,
 *     COMPLETED status requirement, duplicate review prevention,
 *     successful creation
 *   - updateReview: ownership check, successful update
 *   - deleteReview: ownership check, successful deletion
 */

import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";

import { createReview, updateReview, deleteReview } from "@/lib/actions/review";
import { cleanDatabase, disconnectTestDb, testDb } from "../helpers/db";
import {
  createTestUser,
  createTestBusiness,
  createTestService,
  createTestBooking,
  createTestReview,
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

// ────────────────────────────────────────────────────────────────────────────

describe("createReview", () => {
  // ── Auth guard ──────────────────────────────────────────────────────────

  it("returns error when user is not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const result = await createReview({
      bookingId: "any",
      rating: 5,
      comment: "Great!",
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

    const result = await createReview({
      bookingId: "any",
      rating: 5,
    });

    expect(result.error).toContain("Only customers");
  });

  // ── Booking ownership ───────────────────────────────────────────────────

  it("returns error when booking belongs to a different customer", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const customer = await createTestUser({ role: "CUSTOMER" });
    const stranger = await createTestUser({ role: "CUSTOMER" });
    const business = await createTestBusiness({ ownerId: owner.id });
    const service = await createTestService({ businessId: business.id });

    const booking = await createTestBooking({
      customerId: customer.id,
      businessId: business.id,
      serviceId: service.id,
      status: "COMPLETED",
    });

    mockGetCurrentUser.mockResolvedValue({
      id: stranger.id,
      role: "CUSTOMER",
      name: stranger.name,
      email: stranger.email,
    });

    const result = await createReview({ bookingId: booking.id, rating: 5 });
    expect(result.error).toContain("own bookings");
  });

  // ── COMPLETED status required ───────────────────────────────────────────

  it("returns error when booking is not yet COMPLETED", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const customer = await createTestUser({ role: "CUSTOMER" });
    const business = await createTestBusiness({ ownerId: owner.id });
    const service = await createTestService({ businessId: business.id });

    const booking = await createTestBooking({
      customerId: customer.id,
      businessId: business.id,
      serviceId: service.id,
      status: "CONFIRMED", // Not COMPLETED
    });

    mockGetCurrentUser.mockResolvedValue({
      id: customer.id,
      role: "CUSTOMER",
      name: customer.name,
      email: customer.email,
    });

    const result = await createReview({ bookingId: booking.id, rating: 4 });
    expect(result.error).toContain("completed appointments");
  });

  // ── Duplicate review prevention ─────────────────────────────────────────

  it("returns error when booking already has a review", async () => {
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

    await createTestReview({
      customerId: customer.id,
      businessId: business.id,
      bookingId: booking.id,
    });

    mockGetCurrentUser.mockResolvedValue({
      id: customer.id,
      role: "CUSTOMER",
      name: customer.name,
      email: customer.email,
    });

    const result = await createReview({ bookingId: booking.id, rating: 3 });
    expect(result.error).toContain("already reviewed");
  });

  // ── Successful creation ─────────────────────────────────────────────────

  it("creates a review record in the database", async () => {
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
      id: customer.id,
      role: "CUSTOMER",
      name: customer.name,
      email: customer.email,
    });

    const result = await createReview({
      bookingId: booking.id,
      rating: 5,
      comment: "Excellent service!",
    });

    expect(result.success).toBeDefined();

    const review = await testDb.review.findUnique({
      where: { bookingId: booking.id },
    });

    expect(review).not.toBeNull();
    expect(review?.rating).toBe(5);
    expect(review?.comment).toBe("Excellent service!");
    expect(review?.customerId).toBe(customer.id);
    expect(review?.businessId).toBe(business.id);
  });
});

// ────────────────────────────────────────────────────────────────────────────

describe("updateReview", () => {
  it("returns error when review belongs to a different customer", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const customer = await createTestUser({ role: "CUSTOMER" });
    const stranger = await createTestUser({ role: "CUSTOMER" });
    const business = await createTestBusiness({ ownerId: owner.id });
    const service = await createTestService({ businessId: business.id });
    const booking = await createTestBooking({
      customerId: customer.id,
      businessId: business.id,
      serviceId: service.id,
      status: "COMPLETED",
    });
    const review = await createTestReview({
      customerId: customer.id,
      businessId: business.id,
      bookingId: booking.id,
    });

    mockGetCurrentUser.mockResolvedValue({
      id: stranger.id,
      role: "CUSTOMER",
      name: stranger.name,
      email: stranger.email,
    });

    const result = await updateReview(review.id, { rating: 1, comment: "Bad" });
    expect(result.error).toContain("own reviews");
  });

  it("updates the review rating and comment", async () => {
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
    const review = await createTestReview({
      customerId: customer.id,
      businessId: business.id,
      bookingId: booking.id,
      rating: 3,
      comment: "Okay",
    });

    mockGetCurrentUser.mockResolvedValue({
      id: customer.id,
      role: "CUSTOMER",
      name: customer.name,
      email: customer.email,
    });

    await updateReview(review.id, {
      rating: 5,
      comment: "Changed my mind — great!",
    });

    const updated = await testDb.review.findUnique({
      where: { id: review.id },
    });
    expect(updated?.rating).toBe(5);
    expect(updated?.comment).toBe("Changed my mind — great!");
  });
});

// ────────────────────────────────────────────────────────────────────────────

describe("deleteReview", () => {
  it("returns error when review belongs to a different customer", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const customer = await createTestUser({ role: "CUSTOMER" });
    const stranger = await createTestUser({ role: "CUSTOMER" });
    const business = await createTestBusiness({ ownerId: owner.id });
    const service = await createTestService({ businessId: business.id });
    const booking = await createTestBooking({
      customerId: customer.id,
      businessId: business.id,
      serviceId: service.id,
      status: "COMPLETED",
    });
    const review = await createTestReview({
      customerId: customer.id,
      businessId: business.id,
      bookingId: booking.id,
    });

    mockGetCurrentUser.mockResolvedValue({
      id: stranger.id,
      role: "CUSTOMER",
      name: stranger.name,
      email: stranger.email,
    });

    const result = await deleteReview(review.id);
    expect(result.error).toContain("own reviews");
  });

  it("deletes the review from the database", async () => {
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
    const review = await createTestReview({
      customerId: customer.id,
      businessId: business.id,
      bookingId: booking.id,
    });

    mockGetCurrentUser.mockResolvedValue({
      id: customer.id,
      role: "CUSTOMER",
      name: customer.name,
      email: customer.email,
    });

    const result = await deleteReview(review.id);
    expect(result.success).toBeDefined();

    const deleted = await testDb.review.findUnique({
      where: { id: review.id },
    });
    expect(deleted).toBeNull();
  });
});
