/**
 * @file Prisma Configuration
 */
import "dotenv/config";
// import { defineConfig } from "prisma/config";
import { PrismaConfig } from "prisma";

export default {
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env["DATABASE_URL"],
  },
  migrations: {
    // path: "prisma/migrations",
    seed: "tsx ./prisma/seed.ts",
  },
} satisfies PrismaConfig;

// export default defineConfig({
//   schema: "prisma/schema.prisma",
//   migrations: {
//     path: "prisma/migrations",
//     seed: "tsx ./prisma/seed.ts",
//   },
//   datasource: {
//     url: process.env["DATABASE_URL"],
//   },
// });
