/**
 * @file Business Server Action Integration Tests
 * @description Tests for createBusiness and updateBusiness actions.
 *
 * Covers:
 *   - createBusiness: auth guard, already-has-business guard,
 *     validation errors, successful creation, slug generation
 *   - updateBusiness: auth guard, ownership check,
 *     successful update, slug regeneration on name change
 */

import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";

import { createBusiness, updateBusiness } from "@/lib/actions/business";
import { cleanDatabase, disconnectTestDb, testDb } from "../helpers/db";
import { createTestUser, createTestBusiness } from "../helpers/factories";

// ── Session mock ─────────────────────────────────────────────────────────────

vi.mock("@/lib/session", () => ({
  getCurrentUser: vi.fn(),
}));

import { getCurrentUser } from "@/lib/session";
const mockGetCurrentUser = vi.mocked(getCurrentUser);

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Valid business form data for use in tests. */
const validBusinessData = {
  name: "Fresh Cuts Barbershop",
  category: "BARBERSHOP" as const,
  description: "A great barbershop",
  phone: "+251911234567",
  email: "freshcuts@example.com",
  website: "",
  address: "123 Main St",
  city: "Addis Ababa",
  state: "Addis Ababa",
  zipCode: "",
};

// ── Setup ────────────────────────────────────────────────────────────────────

beforeEach(async () => {
  await cleanDatabase();
  vi.clearAllMocks();
});

afterAll(async () => {
  await disconnectTestDb();
});

// ────────────────────────────────────────────────────────────────────────────

describe("createBusiness", () => {
  // ── Auth guard ──────────────────────────────────────────────────────────

  it("returns error when user is not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const result = await createBusiness(validBusinessData);
    expect(result.error).toContain("Unauthorized");
  });

  it("returns error when user is a CUSTOMER (not BUSINESS_OWNER)", async () => {
    const customer = await createTestUser({ role: "CUSTOMER" });
    mockGetCurrentUser.mockResolvedValue({
      id: customer.id,
      role: "CUSTOMER",
      name: customer.name,
      email: customer.email,
    });

    const result = await createBusiness(validBusinessData);
    expect(result.error).toContain("Unauthorized");
  });

  // ── Already has a business ──────────────────────────────────────────────

  it("returns error when owner already has a business", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    await createTestBusiness({ ownerId: owner.id });

    mockGetCurrentUser.mockResolvedValue({
      id: owner.id,
      role: "BUSINESS_OWNER",
      name: owner.name,
      email: owner.email,
    });

    const result = await createBusiness(validBusinessData);
    expect(result.error).toContain("already have a business");
  });

  // ── Validation ──────────────────────────────────────────────────────────

  it("returns error when business name is too short", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    mockGetCurrentUser.mockResolvedValue({
      id: owner.id,
      role: "BUSINESS_OWNER",
      name: owner.name,
      email: owner.email,
    });

    const result = await createBusiness({
      ...validBusinessData,
      name: "A", // Too short
    });

    expect(result.error).toBeDefined();
  });

  // ── Successful creation ─────────────────────────────────────────────────

  it("creates a business record in the database", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    mockGetCurrentUser.mockResolvedValue({
      id: owner.id,
      role: "BUSINESS_OWNER",
      name: owner.name,
      email: owner.email,
    });

    const result = await createBusiness(validBusinessData);
    expect(result.success).toBeDefined();
    expect(result.error).toBeUndefined();

    const business = await testDb.business.findFirst({
      where: { ownerId: owner.id },
    });
    expect(business).not.toBeNull();
    expect(business?.name).toBe("Fresh Cuts Barbershop");
  });

  it("generates a URL-friendly slug from the business name", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    mockGetCurrentUser.mockResolvedValue({
      id: owner.id,
      role: "BUSINESS_OWNER",
      name: owner.name,
      email: owner.email,
    });

    await createBusiness(validBusinessData);

    const business = await testDb.business.findFirst({
      where: { ownerId: owner.id },
    });

    expect(business?.slug).toMatch(/^fresh-cuts-barbershop/);
    expect(business?.slug).not.toContain(" ");
  });

  it("generates a unique slug when the base slug is taken", async () => {
    // Create a first owner with the same business name
    const owner1 = await createTestUser({ role: "BUSINESS_OWNER" });
    mockGetCurrentUser.mockResolvedValue({
      id: owner1.id,
      role: "BUSINESS_OWNER",
      name: owner1.name,
      email: owner1.email,
    });
    await createBusiness(validBusinessData);

    // Create a second owner with the same business name
    const owner2 = await createTestUser({ role: "BUSINESS_OWNER" });
    mockGetCurrentUser.mockResolvedValue({
      id: owner2.id,
      role: "BUSINESS_OWNER",
      name: owner2.name,
      email: owner2.email,
    });
    await createBusiness(validBusinessData);

    const businesses = await testDb.business.findMany({
      orderBy: { createdAt: "asc" },
    });

    expect(businesses[0].slug).not.toBe(businesses[1].slug);
    expect(businesses[1].slug).toMatch(/fresh-cuts-barbershop-2/);
  });
});

// ────────────────────────────────────────────────────────────────────────────

describe("updateBusiness", () => {
  // ── Auth guard ──────────────────────────────────────────────────────────

  it("returns error when user is not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const result = await updateBusiness("some-id", validBusinessData);
    expect(result.error).toContain("Unauthorized");
  });

  // ── Ownership check ─────────────────────────────────────────────────────

  it("returns error when business does not belong to the current user", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const business = await createTestBusiness({ ownerId: owner.id });

    const otherOwner = await createTestUser({ role: "BUSINESS_OWNER" });
    mockGetCurrentUser.mockResolvedValue({
      id: otherOwner.id,
      role: "BUSINESS_OWNER",
      name: otherOwner.name,
      email: otherOwner.email,
    });

    const result = await updateBusiness(business.id, validBusinessData);
    expect(result.error).toContain("not found or you do not own");
  });

  // ── Successful update ───────────────────────────────────────────────────

  it("updates the business record in the database", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const business = await createTestBusiness({
      ownerId: owner.id,
      name: "Old Name",
    });

    mockGetCurrentUser.mockResolvedValue({
      id: owner.id,
      role: "BUSINESS_OWNER",
      name: owner.name,
      email: owner.email,
    });

    const result = await updateBusiness(business.id, {
      ...validBusinessData,
      name: "New Business Name",
    });

    expect(result.success).toBeDefined();

    const updated = await testDb.business.findUnique({
      where: { id: business.id },
    });
    expect(updated?.name).toBe("New Business Name");
  });

  it("updates the slug when business name changes", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const business = await createTestBusiness({
      ownerId: owner.id,
      name: "Old Name",
      slug: "old-name",
    });

    mockGetCurrentUser.mockResolvedValue({
      id: owner.id,
      role: "BUSINESS_OWNER",
      name: owner.name,
      email: owner.email,
    });

    await updateBusiness(business.id, {
      ...validBusinessData,
      name: "Brand New Name",
    });

    const updated = await testDb.business.findUnique({
      where: { id: business.id },
    });

    expect(updated?.slug).toContain("brand-new-name");
  });
});
