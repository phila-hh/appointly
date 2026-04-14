/**
 * @file Seed favorites — customers favoriting businesses
 */

import { getPrisma } from "./helpers";
import type { SeededBusiness } from "./businesses";

export async function seedFavorites(
  customerIds: string[],
  businesses: SeededBusiness[]
): Promise<void> {
  const prisma = getPrisma();
  console.log("❤️ Creating favorites...");

  let count = 0;
  const favSet = new Set<string>();

  // Each customer favorites 2-8 random businesses
  for (let cIdx = 0; cIdx < customerIds.length; cIdx++) {
    const numFavs = 2 + (cIdx % 7); // 2 to 8
    const shuffled = [...businesses].sort(() => Math.random() - 0.5);
    const toFav = shuffled.slice(0, numFavs);

    for (const biz of toFav) {
      const key = `${customerIds[cIdx]}-${biz.id}`;
      if (favSet.has(key)) continue;
      favSet.add(key);

      try {
        await prisma.favorite.create({
          data: {
            customerId: customerIds[cIdx],
            businessId: biz.id,
          },
        });
        count++;
      } catch {
        // Skip duplicates
      }
    }
  }

  console.log(`✅ Created ${count} favorites.\n`);
}
