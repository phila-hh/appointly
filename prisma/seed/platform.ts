/**
 * @file Seed platform settings — single row of global config.
 */

import { getPrisma } from "./helpers";

export async function seedPlatformSettings(): Promise<void> {
  const prisma = getPrisma();
  console.log("⚙️  Creating platform settings...");

  await prisma.platformSettings.create({
    data: {
      defaultCommissionRate: 0.1, // 10%
      payoutSchedule: "MONTHLY",
    },
  });

  console.log("✅ Platform settings created.\n");
}
