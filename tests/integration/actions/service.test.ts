/**
 * @file Service Server Action Integration Tests
 * @description Tests for createService, updateService, and toggleServiceActive.
 *
 * Covers:
 *   - createService: auth guard, no-business guard, validation, successful creation
 *   - updateService: ownership check, successful update
 *   - toggleServiceActive: toggles isActive correctly
 */

import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";

import {
  createService,
  updateService,
  toggleServiceActive,
} from "@/lib/actions/service";
import { cleanDatabase, disconnectTestDb, testDb } from "../helpers/db";
import {
  createTestUser,
  createTestBusiness,
  createTestService,
} from "../helpers/factories";

// ── Session mock ─────────────────────────────────────────────────────────────

vi.mock("@/lib/session", () => ({
  getCurrentUser: vi.fn(),
}));

import { getCurrentUser } from "@/lib/session";
const mockGetCurrentUser = vi.mocked(getCurrentUser);

// ── Helpers ──────────────────────────────────────────────────────────────────

const validServiceData = {
  name: "Classic Haircut",
  description: "A clean, classic cut",
  price: 25,
  duration: 30,
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

describe("createService", () => {
  // ── Auth / business guard ───────────────────────────────────────────────

  it("returns error when user is not a business owner", async () => {
    const customer = await createTestUser({ role: "CUSTOMER" });
    mockGetCurrentUser.mockResolvedValue({
      id: customer.id,
      role: "CUSTOMER",
      name: customer.name,
      email: customer.email,
    });

    const result = await createService(validServiceData);
    expect(result.error).toContain("Business not found");
  });

  it("returns error when owner has no business yet", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    mockGetCurrentUser.mockResolvedValue({
      id: owner.id,
      role: "BUSINESS_OWNER",
      name: owner.name,
      email: owner.email,
    });
    // No business created for this owner

    const result = await createService(validServiceData);
    expect(result.error).toContain("Business not found");
  });

  // ── Validation ──────────────────────────────────────────────────────────

  it("returns error when service name is too short", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    await createTestBusiness({ ownerId: owner.id });
    mockGetCurrentUser.mockResolvedValue({
      id: owner.id,
      role: "BUSINESS_OWNER",
      name: owner.name,
      email: owner.email,
    });

    const result = await createService({ ...validServiceData, name: "A" });
    expect(result.error).toBeDefined();
  });

  it("returns error when price is zero or negative", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    await createTestBusiness({ ownerId: owner.id });
    mockGetCurrentUser.mockResolvedValue({
      id: owner.id,
      role: "BUSINESS_OWNER",
      name: owner.name,
      email: owner.email,
    });

    const result = await createService({ ...validServiceData, price: 0 });
    expect(result.error).toBeDefined();
  });

  // ── Successful creation ─────────────────────────────────────────────────

  it("creates a service record in the database", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const business = await createTestBusiness({ ownerId: owner.id });
    mockGetCurrentUser.mockResolvedValue({
      id: owner.id,
      role: "BUSINESS_OWNER",
      name: owner.name,
      email: owner.email,
    });

    const result = await createService(validServiceData);
    expect(result.success).toBeDefined();

    const service = await testDb.service.findFirst({
      where: { businessId: business.id },
    });

    expect(service).not.toBeNull();
    expect(service?.name).toBe("Classic Haircut");
    expect(Number(service?.price)).toBe(25);
    expect(service?.duration).toBe(30);
  });

  it("creates the service as active by default", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const business = await createTestBusiness({ ownerId: owner.id });
    mockGetCurrentUser.mockResolvedValue({
      id: owner.id,
      role: "BUSINESS_OWNER",
      name: owner.name,
      email: owner.email,
    });

    await createService(validServiceData);

    const service = await testDb.service.findFirst({
      where: { businessId: business.id },
    });
    expect(service?.isActive).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────────────────

describe("updateService", () => {
  // ── Ownership check ─────────────────────────────────────────────────────

  it("returns error when service belongs to a different business", async () => {
    const owner1 = await createTestUser({ role: "BUSINESS_OWNER" });
    const business1 = await createTestBusiness({ ownerId: owner1.id });
    const service = await createTestService({ businessId: business1.id });

    const owner2 = await createTestUser({ role: "BUSINESS_OWNER" });
    await createTestBusiness({ ownerId: owner2.id });
    mockGetCurrentUser.mockResolvedValue({
      id: owner2.id,
      role: "BUSINESS_OWNER",
      name: owner2.name,
      email: owner2.email,
    });

    const result = await updateService(service.id, validServiceData);
    expect(result.error).toContain("not found or you do not own");
  });

  // ── Successful update ───────────────────────────────────────────────────

  it("updates the service record in the database", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const business = await createTestBusiness({ ownerId: owner.id });
    const service = await createTestService({ businessId: business.id });

    mockGetCurrentUser.mockResolvedValue({
      id: owner.id,
      role: "BUSINESS_OWNER",
      name: owner.name,
      email: owner.email,
    });

    const result = await updateService(service.id, {
      name: "Premium Haircut",
      description: "An upgraded cut",
      price: 45,
      duration: 45,
    });

    expect(result.success).toBeDefined();

    const updated = await testDb.service.findUnique({
      where: { id: service.id },
    });
    expect(updated?.name).toBe("Premium Haircut");
    expect(Number(updated?.price)).toBe(45);
    expect(updated?.duration).toBe(45);
  });
});

// ────────────────────────────────────────────────────────────────────────────

describe("toggleServiceActive", () => {
  it("sets isActive to false for an active service", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const business = await createTestBusiness({ ownerId: owner.id });
    const service = await createTestService({
      businessId: business.id,
      isActive: true,
    });

    mockGetCurrentUser.mockResolvedValue({
      id: owner.id,
      role: "BUSINESS_OWNER",
      name: owner.name,
      email: owner.email,
    });

    await toggleServiceActive(service.id);

    const updated = await testDb.service.findUnique({
      where: { id: service.id },
    });
    expect(updated?.isActive).toBe(false);
  });

  it("sets isActive to true for an inactive service", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const business = await createTestBusiness({ ownerId: owner.id });
    const service = await createTestService({
      businessId: business.id,
      isActive: false,
    });

    mockGetCurrentUser.mockResolvedValue({
      id: owner.id,
      role: "BUSINESS_OWNER",
      name: owner.name,
      email: owner.email,
    });

    await toggleServiceActive(service.id);

    const updated = await testDb.service.findUnique({
      where: { id: service.id },
    });
    expect(updated?.isActive).toBe(true);
  });

  it("includes the service name in the success message", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const business = await createTestBusiness({ ownerId: owner.id });
    const service = await createTestService({
      businessId: business.id,
      name: "My Service",
    });

    mockGetCurrentUser.mockResolvedValue({
      id: owner.id,
      role: "BUSINESS_OWNER",
      name: owner.name,
      email: owner.email,
    });

    const result = await toggleServiceActive(service.id);
    expect(result.success).toContain("My Service");
  });
});
