/**
 * @file Integration Test Database Client
 * @description Provides a dedicated Prisma client for integration tests,
 * connected to the test database (appointly_test).
 *
 * Also exports cleanup utilities to wipe tables between tests,
 * ensuring each test starts with a clean slate.
 *
 * The cleanup order respects foreign key constraints — child tables
 * are deleted before parent tables.
 */

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// ---------------------------------------------------------------------------
// Test database client
// ---------------------------------------------------------------------------

/**
 * Creates a PrismaClient connected to the test database.
 * DATABASE_URL must point to appointly_test (set via .env.test).
 */
function createTestClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Make sure .env.test is loaded.\n" +
        "Run tests with: dotenv -e .env.test -- vitest run"
    );
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log: [], // Suppress query logs in test output
  });
}

/** Shared test database client. Re-used across test files. */
export const testDb = createTestClient();

// ---------------------------------------------------------------------------
// Cleanup utilities
// ---------------------------------------------------------------------------

/**
 * Deletes all rows from all tables in dependency order.
 * Call this in beforeEach to guarantee a clean database state.
 *
 * Order matters — child records must be deleted before parents
 * to avoid foreign key constraint violations.
 */
export async function cleanDatabase() {
  // Level 4 — deepest children first
  await testDb.adminAuditLog.deleteMany();
  await testDb.staffService.deleteMany();
  await testDb.staffHours.deleteMany();
  await testDb.review.deleteMany();
  await testDb.commission.deleteMany();
  await testDb.payment.deleteMany();
  await testDb.favorite.deleteMany();

  // Level 3
  await testDb.booking.deleteMany();
  await testDb.staff.deleteMany();

  // Level 2
  await testDb.service.deleteMany();
  await testDb.businessHours.deleteMany();
  await testDb.payout.deleteMany();

  // Level 1
  await testDb.business.deleteMany();

  // Auth tables
  await testDb.verificationToken.deleteMany();
  await testDb.session.deleteMany();
  await testDb.account.deleteMany();

  // Level 0 — root
  await testDb.user.deleteMany();
  await testDb.platformSettings.deleteMany();
}

/**
 * Disconnects the test database client.
 * Call this in afterAll to release the connection pool.
 */
export async function disconnectTestDb() {
  await testDb.$disconnect();
}
