/**
 * @file Favorite Server Action Integration Tests
 * @description Tests for toggleFavorite and isFavorited actions.
 *
 * Covers:
 *   - toggleFavorite: auth guard, role guard, add when not favorited,
 *     remove when already favorited
 *   - isFavorited: returns correct boolean state
 */

import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";

import { toggleFavorite, isFavorited } from "@/lib/actions/favorite";
import { cleanDatabase, disconnectTestDb, testDb } from "../helpers/db";
import { createTestUser, createTestBusiness } from "../helpers/factories";

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

describe("toggleFavorite", () => {
  // ── Auth guard ──────────────────────────────────────────────────────────

  it("returns error when user is not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const result = await toggleFavorite("some-business-id");
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

    const result = await toggleFavorite("some-business-id");
    expect(result.error).toContain("Only customers");
  });

  // ── Add to favorites ────────────────────────────────────────────────────

  it("creates a favorite record when business is not yet favorited", async () => {
    const customer = await createTestUser({ role: "CUSTOMER" });
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const business = await createTestBusiness({ ownerId: owner.id });

    mockGetCurrentUser.mockResolvedValue({
      id: customer.id,
      role: "CUSTOMER",
      name: customer.name,
      email: customer.email,
    });

    const result = await toggleFavorite(business.id);
    expect(result.success).toContain("Added to favorites");

    const favorite = await testDb.favorite.findUnique({
      where: {
        customerId_businessId: {
          customerId: customer.id,
          businessId: business.id,
        },
      },
    });
    expect(favorite).not.toBeNull();
  });

  // ── Remove from favorites ───────────────────────────────────────────────

  it("removes the favorite record when business is already favorited", async () => {
    const customer = await createTestUser({ role: "CUSTOMER" });
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const business = await createTestBusiness({ ownerId: owner.id });

    // Create existing favorite
    await testDb.favorite.create({
      data: { customerId: customer.id, businessId: business.id },
    });

    mockGetCurrentUser.mockResolvedValue({
      id: customer.id,
      role: "CUSTOMER",
      name: customer.name,
      email: customer.email,
    });

    const result = await toggleFavorite(business.id);
    expect(result.success).toContain("Removed from favorites");

    const favorite = await testDb.favorite.findUnique({
      where: {
        customerId_businessId: {
          customerId: customer.id,
          businessId: business.id,
        },
      },
    });
    expect(favorite).toBeNull();
  });

  // ── Toggle idempotency ──────────────────────────────────────────────────

  it("toggles back to favorited after being removed", async () => {
    const customer = await createTestUser({ role: "CUSTOMER" });
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const business = await createTestBusiness({ ownerId: owner.id });

    mockGetCurrentUser.mockResolvedValue({
      id: customer.id,
      role: "CUSTOMER",
      name: customer.name,
      email: customer.email,
    });

    // Add
    await toggleFavorite(business.id);
    // Remove
    await toggleFavorite(business.id);
    // Add again
    await toggleFavorite(business.id);

    const count = await testDb.favorite.count({
      where: { customerId: customer.id, businessId: business.id },
    });
    expect(count).toBe(1);
  });
});

// ────────────────────────────────────────────────────────────────────────────

describe("isFavorited", () => {
  it("returns false when user is not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const result = await isFavorited("any-business-id");
    expect(result).toBe(false);
  });

  it("returns false when business is not favorited", async () => {
    const customer = await createTestUser({ role: "CUSTOMER" });
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const business = await createTestBusiness({ ownerId: owner.id });

    mockGetCurrentUser.mockResolvedValue({
      id: customer.id,
      role: "CUSTOMER",
      name: customer.name,
      email: customer.email,
    });

    const result = await isFavorited(business.id);
    expect(result).toBe(false);
  });

  it("returns true when business is favorited", async () => {
    const customer = await createTestUser({ role: "CUSTOMER" });
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const business = await createTestBusiness({ ownerId: owner.id });

    await testDb.favorite.create({
      data: { customerId: customer.id, businessId: business.id },
    });

    mockGetCurrentUser.mockResolvedValue({
      id: customer.id,
      role: "CUSTOMER",
      name: customer.name,
      email: customer.email,
    });

    const result = await isFavorited(business.id);
    expect(result).toBe(true);
  });
});
