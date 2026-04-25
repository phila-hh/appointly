/**
 * @file Staff Server Action Integration Tests
 * @description Tests for createStaff, updateStaff, toggleStaffActive,
 * deleteStaff, updateStaffServices, and saveStaffHours.
 *
 * Covers:
 *   - createStaff: auth guard, validation, successful creation
 *   - updateStaff: ownership check, successful update
 *   - toggleStaffActive: toggles isActive flag
 *   - deleteStaff: blocks deletion when bookings exist, deletes otherwise
 *   - updateStaffServices: validates service ownership, replaces assignments
 *   - saveStaffHours: validates against business hours, saves all 7 days
 */

import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";

import {
  createStaff,
  updateStaff,
  toggleStaffActive,
  deleteStaff,
  updateStaffServices,
  saveStaffHours,
} from "@/lib/actions/staff";
import { cleanDatabase, disconnectTestDb, testDb } from "../helpers/db";
import {
  createTestUser,
  createTestBusiness,
  createTestService,
  createTestStaff,
  createTestBooking,
  createTestBusinessHours,
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

const validStaffData = {
  name: "Tigist Haile",
  email: "tigist@salon.com",
  phone: "+251922334455",
  title: "Senior Stylist",
};

/** Full 7-day schedule where Mon–Fri is open and Sat–Sun is closed. */
function makeSchedule() {
  return [
    {
      dayOfWeek: "MONDAY" as const,
      openTime: "09:00",
      closeTime: "17:00",
      isClosed: false,
    },
    {
      dayOfWeek: "TUESDAY" as const,
      openTime: "09:00",
      closeTime: "17:00",
      isClosed: false,
    },
    {
      dayOfWeek: "WEDNESDAY" as const,
      openTime: "09:00",
      closeTime: "17:00",
      isClosed: false,
    },
    {
      dayOfWeek: "THURSDAY" as const,
      openTime: "09:00",
      closeTime: "17:00",
      isClosed: false,
    },
    {
      dayOfWeek: "FRIDAY" as const,
      openTime: "09:00",
      closeTime: "17:00",
      isClosed: false,
    },
    {
      dayOfWeek: "SATURDAY" as const,
      openTime: "00:00",
      closeTime: "00:00",
      isClosed: true,
    },
    {
      dayOfWeek: "SUNDAY" as const,
      openTime: "00:00",
      closeTime: "00:00",
      isClosed: true,
    },
  ];
}

// ────────────────────────────────────────────────────────────────────────────

describe("createStaff", () => {
  it("returns error when user has no business", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    mockGetCurrentUser.mockResolvedValue({
      id: owner.id,
      role: "BUSINESS_OWNER",
      name: owner.name,
      email: owner.email,
    });

    const result = await createStaff(validStaffData);
    expect(result.error).toContain("Business not found");
  });

  it("returns error when name is too short", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    await createTestBusiness({ ownerId: owner.id });
    mockGetCurrentUser.mockResolvedValue({
      id: owner.id,
      role: "BUSINESS_OWNER",
      name: owner.name,
      email: owner.email,
    });

    const result = await createStaff({ ...validStaffData, name: "A" });
    expect(result.error).toBeDefined();
  });

  it("creates a staff member in the database", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const business = await createTestBusiness({ ownerId: owner.id });
    mockGetCurrentUser.mockResolvedValue({
      id: owner.id,
      role: "BUSINESS_OWNER",
      name: owner.name,
      email: owner.email,
    });

    const result = await createStaff(validStaffData);
    expect(result.success).toBeDefined();

    const staff = await testDb.staff.findFirst({
      where: { businessId: business.id },
    });
    expect(staff).not.toBeNull();
    expect(staff?.name).toBe("Tigist Haile");
    expect(staff?.isActive).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────────────────

describe("updateStaff", () => {
  it("returns error when staff belongs to a different business", async () => {
    const owner1 = await createTestUser({ role: "BUSINESS_OWNER" });
    const business1 = await createTestBusiness({ ownerId: owner1.id });
    const staff = await createTestStaff({ businessId: business1.id });

    const owner2 = await createTestUser({ role: "BUSINESS_OWNER" });
    await createTestBusiness({ ownerId: owner2.id });
    mockGetCurrentUser.mockResolvedValue({
      id: owner2.id,
      role: "BUSINESS_OWNER",
      name: owner2.name,
      email: owner2.email,
    });

    const result = await updateStaff(staff.id, validStaffData);
    expect(result.error).toContain("not found or you do not own");
  });

  it("updates staff name and title", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const business = await createTestBusiness({ ownerId: owner.id });
    const staff = await createTestStaff({ businessId: business.id });

    mockGetCurrentUser.mockResolvedValue({
      id: owner.id,
      role: "BUSINESS_OWNER",
      name: owner.name,
      email: owner.email,
    });

    await updateStaff(staff.id, {
      ...validStaffData,
      name: "Abebe Girma",
      title: "Lead Barber",
    });

    const updated = await testDb.staff.findUnique({ where: { id: staff.id } });
    expect(updated?.name).toBe("Abebe Girma");
    expect(updated?.title).toBe("Lead Barber");
  });
});

// ────────────────────────────────────────────────────────────────────────────

describe("toggleStaffActive", () => {
  it("deactivates an active staff member", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const business = await createTestBusiness({ ownerId: owner.id });
    const staff = await createTestStaff({
      businessId: business.id,
      isActive: true,
    });

    mockGetCurrentUser.mockResolvedValue({
      id: owner.id,
      role: "BUSINESS_OWNER",
      name: owner.name,
      email: owner.email,
    });

    await toggleStaffActive(staff.id);

    const updated = await testDb.staff.findUnique({ where: { id: staff.id } });
    expect(updated?.isActive).toBe(false);
  });

  it("reactivates an inactive staff member", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const business = await createTestBusiness({ ownerId: owner.id });
    const staff = await createTestStaff({
      businessId: business.id,
      isActive: false,
    });

    mockGetCurrentUser.mockResolvedValue({
      id: owner.id,
      role: "BUSINESS_OWNER",
      name: owner.name,
      email: owner.email,
    });

    await toggleStaffActive(staff.id);

    const updated = await testDb.staff.findUnique({ where: { id: staff.id } });
    expect(updated?.isActive).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────────────────

describe("deleteStaff", () => {
  it("blocks deletion when the staff member has bookings", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const customer = await createTestUser({ role: "CUSTOMER" });
    const business = await createTestBusiness({ ownerId: owner.id });
    const service = await createTestService({ businessId: business.id });
    const staff = await createTestStaff({ businessId: business.id });

    await createTestBooking({
      customerId: customer.id,
      businessId: business.id,
      serviceId: service.id,
      staffId: staff.id,
    });

    mockGetCurrentUser.mockResolvedValue({
      id: owner.id,
      role: "BUSINESS_OWNER",
      name: owner.name,
      email: owner.email,
    });

    const result = await deleteStaff(staff.id);
    expect(result.error).toContain("cannot be deleted");
  });

  it("deletes staff member when no bookings exist", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const business = await createTestBusiness({ ownerId: owner.id });
    const staff = await createTestStaff({ businessId: business.id });

    mockGetCurrentUser.mockResolvedValue({
      id: owner.id,
      role: "BUSINESS_OWNER",
      name: owner.name,
      email: owner.email,
    });

    const result = await deleteStaff(staff.id);
    expect(result.success).toBeDefined();

    const deleted = await testDb.staff.findUnique({ where: { id: staff.id } });
    expect(deleted).toBeNull();
  });
});

// ────────────────────────────────────────────────────────────────────────────

describe("updateStaffServices", () => {
  it("returns error when service IDs do not belong to the business", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const business = await createTestBusiness({ ownerId: owner.id });
    const staff = await createTestStaff({ businessId: business.id });

    // Create a service for a different business
    const otherOwner = await createTestUser({ role: "BUSINESS_OWNER" });
    const otherBusiness = await createTestBusiness({ ownerId: otherOwner.id });
    const foreignService = await createTestService({
      businessId: otherBusiness.id,
    });

    mockGetCurrentUser.mockResolvedValue({
      id: owner.id,
      role: "BUSINESS_OWNER",
      name: owner.name,
      email: owner.email,
    });

    const result = await updateStaffServices({
      staffId: staff.id,
      serviceIds: [foreignService.id],
    });

    expect(result.error).toContain("invalid");
  });

  it("assigns services to staff and reports correct count", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const business = await createTestBusiness({ ownerId: owner.id });
    const staff = await createTestStaff({ businessId: business.id });
    const service1 = await createTestService({
      businessId: business.id,
      name: "Cut",
    });
    const service2 = await createTestService({
      businessId: business.id,
      name: "Shave",
    });

    mockGetCurrentUser.mockResolvedValue({
      id: owner.id,
      role: "BUSINESS_OWNER",
      name: owner.name,
      email: owner.email,
    });

    const result = await updateStaffServices({
      staffId: staff.id,
      serviceIds: [service1.id, service2.id],
    });

    expect(result.success).toBeDefined();

    const assignments = await testDb.staffService.findMany({
      where: { staffId: staff.id },
    });
    expect(assignments).toHaveLength(2);
  });

  it("replaces existing service assignments atomically", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const business = await createTestBusiness({ ownerId: owner.id });
    const staff = await createTestStaff({ businessId: business.id });
    const service1 = await createTestService({ businessId: business.id });
    const service2 = await createTestService({ businessId: business.id });

    mockGetCurrentUser.mockResolvedValue({
      id: owner.id,
      role: "BUSINESS_OWNER",
      name: owner.name,
      email: owner.email,
    });

    // First assignment
    await updateStaffServices({ staffId: staff.id, serviceIds: [service1.id] });

    // Replace with service2 only
    await updateStaffServices({ staffId: staff.id, serviceIds: [service2.id] });

    const assignments = await testDb.staffService.findMany({
      where: { staffId: staff.id },
    });

    expect(assignments).toHaveLength(1);
    expect(assignments[0].serviceId).toBe(service2.id);
  });
});

// ────────────────────────────────────────────────────────────────────────────

describe("saveStaffHours", () => {
  it("returns error when staff hours exceed business hours", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const business = await createTestBusiness({ ownerId: owner.id });
    await createTestBusinessHours(business.id); // Mon–Fri 09:00–17:00
    const staff = await createTestStaff({ businessId: business.id });

    mockGetCurrentUser.mockResolvedValue({
      id: owner.id,
      role: "BUSINESS_OWNER",
      name: owner.name,
      email: owner.email,
    });

    const schedule = makeSchedule();
    // Set Monday hours to exceed business hours (08:00–18:00)
    schedule[0] = { ...schedule[0], openTime: "08:00", closeTime: "18:00" };

    const result = await saveStaffHours({ staffId: staff.id, schedule });
    expect(result.error).toContain("exceed business hours");
  });

  it("returns error when staff is scheduled on a day the business is closed", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const business = await createTestBusiness({ ownerId: owner.id });
    await createTestBusinessHours(business.id); // Sat–Sun closed
    const staff = await createTestStaff({ businessId: business.id });

    mockGetCurrentUser.mockResolvedValue({
      id: owner.id,
      role: "BUSINESS_OWNER",
      name: owner.name,
      email: owner.email,
    });

    const schedule = makeSchedule();
    // Mark Saturday as open — but business is closed Saturday
    schedule[5] = {
      dayOfWeek: "SATURDAY",
      openTime: "09:00",
      closeTime: "14:00",
      isClosed: false,
    };

    const result = await saveStaffHours({ staffId: staff.id, schedule });
    expect(result.error).toContain("closed");
  });

  it("saves all 7 days of the schedule", async () => {
    const owner = await createTestUser({ role: "BUSINESS_OWNER" });
    const business = await createTestBusiness({ ownerId: owner.id });
    await createTestBusinessHours(business.id);
    const staff = await createTestStaff({ businessId: business.id });

    mockGetCurrentUser.mockResolvedValue({
      id: owner.id,
      role: "BUSINESS_OWNER",
      name: owner.name,
      email: owner.email,
    });

    const result = await saveStaffHours({
      staffId: staff.id,
      schedule: makeSchedule(),
    });

    expect(result.success).toBeDefined();

    const hours = await testDb.staffHours.findMany({
      where: { staffId: staff.id },
    });
    expect(hours).toHaveLength(7);
  });
});
