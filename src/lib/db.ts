import { PrismaClient } from "@prisma/client";

const createPrismaClient = () =>
  new PrismaClient({
    log:
      process.env.NODE_ENV == "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

type PrismaClientSingleton = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prismaGlobal: PrismaClientSingleton | undefined;
};

const db = globalForPrisma.prismaGlobal ?? createPrismaClient();

export default db;

if (process.env.NODE_ENV != "production") {
  globalForPrisma.prismaGlobal = db;
}
