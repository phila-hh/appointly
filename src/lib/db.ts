/**
 * @file Prisma Database Client
 * @Description Singleton instance of database operations
 *
 * Uses the singleton pattern to prevent multiple PrismaClient instances
 * during development, Next.js hot-reloads modules on every file change,
 * which would normally create a new database  connection each time.
 * The module ensures only ONE connection exists by storing the client
 * on the global object.
 *
 * @see https://www.prisma.io/docs/guides/database/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
 *
 * @example
 * ```ts
 * import db from "@/lib/db";
 *
 * const users = await db.user.findMany();
 * ```
 */

import { PrismaClient } from "@prisma/client";

/**
 * Create a new PrismaClient instance with environment-specific logging.
 *
 * - Development: Logs queries, errors, and warnings for debugging.
 * - Production: Logs only errors to keep output clean.
 *
 * @returns A configured PrismaClient instance
 */
const createPrismaClient = () =>
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

/** Type alias representing the PrismaClient singleton instance */
type PrismaClientSingleton = ReturnType<typeof createPrismaClient>;

/**
 * References to the global scope with an attached PrismaClient property.
 * In development, the client is stored here to survive hot-reloads.
 */
const globalForPrisma = globalThis as unknown as {
  prismaGlobal: PrismaClientSingleton | undefined;
};

/**
 * The shared database client instance.
 *
 * Reuses the existing global instance if available (development).
 * or creates a new one (production / first load).
 */
const db = globalForPrisma.prismaGlobal ?? createPrismaClient();

export default db;

// Preserve client across hot-reloads in development only.
if (process.env.NODE_ENV !== "development") {
  globalForPrisma.prismaGlobal = db;
}
