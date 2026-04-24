/**
 * @file Test Data Factories
 * @description Factory functions for creating test database records.
 *
 * Each factory:
 *   - Creates a real database record via testDb
 *   - Has sensible defaults for all required fields
 *   - Accepts a Partial<> override for customization
 *   - Returns the created record (typed)
 *
 * Usage:
 * ```ts
 * const customer = await createTestUser({ role: "CUSTOMER" });
 * const owner = await createTestUser({ role: "BUSINESS_OWNER" });
 * const business = await createTestBusiness({ ownerId: owner.id });
 * ```
 */

import { hash } from "bcryptjs";
import { testDb } from "./db";

// ---------------------------------------------------------------------------
// User factory
// ---------------------------------------------------------------------------

interface CreateTestUserOptions {
  name?: string;
  email?: string;
  password?: string;
  role?: "CUSTOMER" | "BUSINESS_OWNER" | "ADMIN";
  emailVerified?: Date | null;
  emailPreferences?: Record<string, boolean>;
}

/**
 * Creates a user in the test database.
 * Password defaults to "Password123!" (pre-hashed).
 */
export async function createTestUser(options: CreateTestUserOptions = {}) {
  const {
    name = "Test User",
    email = `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    password = "Password123!",
    role = "CUSTOMER",
    emailVerified = new Date(),
    emailPreferences = {
      bookingReminders: true,
      reviewRequests: true,
      marketingEmails: true,
    },
  } = options;

  const hashedPassword = await hash(password, 10);

  return testDb.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      emailVerified,
      emailPreferences,
    },
  });
}

// ---------------------------------------------------------------------------
// Business factory
// ---------------------------------------------------------------------------

interface CreateTestBusinessOptions {
  ownerId: string;
  name?: string;
  slug?: string;
  category?: "BARBERSHOP" | "SALON" | "SPA" | "FITNESS" | "OTHER";
  isActive?: boolean;
  city?: string;
}

/**
 * Creates a business in the test database.
 * Requires an ownerId (must be a BUSINESS_OWNER user).
 */
export async function createTestBusiness(options: CreateTestBusinessOptions) {
  const {
    ownerId,
    name = "Test Business",
    slug = `test-business-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    category = "BARBERSHOP",
    isActive = true,
    city = "Addis Ababa",
  } = options;

  return testDb.business.create({
    data: {
      ownerId,
      name,
      slug,
      category,
      isActive,
      city,
    },
  });
}

// ---------------------------------------------------------------------------
// Service factory
// ---------------------------------------------------------------------------

interface CreateTestServiceOptions {
  businessId: string;
  name?: string;
  price?: number;
  duration?: number;
  isActive?: boolean;
  description?: string;
}

/**
 * Creates a service in the test database.
 * Requires a businessId.
 */
export async function createTestService(options: CreateTestServiceOptions) {
  const {
    businessId,
    name = "Test Service",
    price = 50,
    duration = 30,
    isActive = true,
    description = "A test service",
  } = options;

  return testDb.service.create({
    data: {
      businessId,
      name,
      description,
      price,
      duration,
      isActive,
    },
  });
}

// ---------------------------------------------------------------------------
// Booking factory
// ---------------------------------------------------------------------------

interface CreateTestBookingOptions {
  customerId: string;
  businessId: string;
  serviceId: string;
  staffId?: string;
  date?: Date;
  startTime?: string;
  endTime?: string;
  status?: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  totalPrice?: number;
  notes?: string;
}

/**
 * Creates a booking AND its associated payment record in the test database.
 * Returns only the booking (payment is created as a side effect).
 */
export async function createTestBooking(options: CreateTestBookingOptions) {
  const {
    customerId,
    businessId,
    serviceId,
    staffId,
    date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    startTime = "10:00",
    endTime = "10:30",
    status = "PENDING",
    totalPrice = 50,
    notes,
  } = options;

  const booking = await testDb.booking.create({
    data: {
      customerId,
      businessId,
      serviceId,
      staffId: staffId ?? null,
      date,
      startTime,
      endTime,
      status,
      totalPrice,
      notes: notes ?? null,
      isCancellable: true,
    },
  });

  // Always create a payment record alongside the booking
  await testDb.payment.create({
    data: {
      bookingId: booking.id,
      amount: totalPrice,
      status: "PENDING",
    },
  });

  return booking;
}

// ---------------------------------------------------------------------------
// Review factory
// ---------------------------------------------------------------------------

interface CreateTestReviewOptions {
  customerId: string;
  businessId: string;
  bookingId: string;
  rating?: number;
  comment?: string;
}

/**
 * Creates a review in the test database.
 */
export async function createTestReview(options: CreateTestReviewOptions) {
  const {
    customerId,
    businessId,
    bookingId,
    rating = 5,
    comment = "Great service!",
  } = options;

  return testDb.review.create({
    data: {
      customerId,
      businessId,
      bookingId,
      rating,
      comment,
    },
  });
}

// ---------------------------------------------------------------------------
// Staff factory
// ---------------------------------------------------------------------------

interface CreateTestStaffOptions {
  businessId: string;
  name?: string;
  email?: string;
  title?: string;
  isActive?: boolean;
}

/**
 * Creates a staff member in the test database.
 */
export async function createTestStaff(options: CreateTestStaffOptions) {
  const {
    businessId,
    name = "Test Staff",
    email,
    title = "Stylist",
    isActive = true,
  } = options;

  return testDb.staff.create({
    data: {
      businessId,
      name,
      email: email ?? null,
      title,
      isActive,
    },
  });
}

// ---------------------------------------------------------------------------
// Business hours factory
// ---------------------------------------------------------------------------

/**
 * Creates a full week of business hours (Mon–Fri open, Sat–Sun closed).
 * Used to satisfy the staff hours cross-validation in saveStaffHours.
 */
export async function createTestBusinessHours(businessId: string) {
  const days = [
    { day: "MONDAY", open: "09:00", close: "17:00", closed: false },
    { day: "TUESDAY", open: "09:00", close: "17:00", closed: false },
    { day: "WEDNESDAY", open: "09:00", close: "17:00", closed: false },
    { day: "THURSDAY", open: "09:00", close: "17:00", closed: false },
    { day: "FRIDAY", open: "09:00", close: "17:00", closed: false },
    { day: "SATURDAY", open: "00:00", close: "00:00", closed: true },
    { day: "SUNDAY", open: "00:00", close: "00:00", closed: true },
  ] as const;

  return testDb.$transaction(
    days.map((d) =>
      testDb.businessHours.create({
        data: {
          businessId,
          dayOfWeek: d.day,
          openTime: d.open,
          closeTime: d.close,
          isClosed: d.closed,
        },
      })
    )
  );
}

// ---------------------------------------------------------------------------
// Commission factory
// ---------------------------------------------------------------------------

interface CreateTestCommissionOptions {
  bookingId: string;
  businessId: string;
  grossAmount?: number;
  commissionRate?: number;
  status?: "PENDING" | "INCLUDED_IN_PAYOUT" | "PAID_OUT";
}

/**
 * Creates a commission record in the test database.
 */
export async function createTestCommission(
  options: CreateTestCommissionOptions
) {
  const {
    bookingId,
    businessId,
    grossAmount = 100,
    commissionRate = 0.1,
    status = "PENDING",
  } = options;

  const commissionAmount = Number((grossAmount * commissionRate).toFixed(2));
  const netAmount = Number((grossAmount - commissionAmount).toFixed(2));

  return testDb.commission.create({
    data: {
      bookingId,
      businessId,
      grossAmount,
      commissionRate,
      commissionAmount,
      netAmount,
      status,
    },
  });
}
