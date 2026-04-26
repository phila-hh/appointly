/**
 * @file Prisma Database Client
 * @Description Singleton Prisma Client instance for the application.
 *
 * Uses PrismaPg adapter with the DATABASE_URL (pooled via Neon PgBouncer).
 * The directUrl in schema.prisma handles migrations.
 *
 * Production: DATABASE_URL points to Neon pooled endpoint
 * Development: DATABASE_URL points to local Docker PostgreSql
 *
 * @see https://www.prisma.io/docs/guides/database/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
 */

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Create a new PrismaClient instance with environment-specific logging.
 *
 * - Development: Logs queries, errors, and warnings for debugging.
 * - Production: Logs only errors to keep output clean.
 *
 * @returns A configured PrismaClient instance
 */
const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set.");
  }

  const adapter = new PrismaPg({
    connectionString,
  });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
};

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
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaGlobal = db;
}
