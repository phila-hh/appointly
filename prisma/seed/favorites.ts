/**
 * @file Seed favorites.
 *
 * Demo customers favorite all 3 demo businesses + several others.
 * Regular customers favorite 2-8 random businesses.
 */

import { getPrisma, pickN } from "./helpers";
import type { SeededBusiness } from "./businesses";

export async function seedFavorites(
  allCustomerIds: string[],
  demoCustomerIds: string[],
  businesses: SeededBusiness[]
): Promise<void> {
  const prisma = getPrisma();
  console.log("❤️  Creating favorites...");

  let count = 0;
  const done = new Set<string>();

  const tryFav = async (customerId: string, businessId: string) => {
    const key = `${customerId}|${businessId}`;
    if (done.has(key)) return;
    done.add(key);
    try {
      await prisma.favorite.create({ data: { customerId, businessId } });
      count++;
    } catch {
      // skip
    }
  };

  const demoBusinessIds = businesses.filter((b) => b.isDemo).map((b) => b.id);

  // ── Demo customers ────────────────────────────────────────────────────────
  for (const custId of demoCustomerIds) {
    // All 3 demo businesses
    for (const bizId of demoBusinessIds) await tryFav(custId, bizId);
    // + 10 random others
    const extras = pickN(
      businesses.filter((b) => !b.isDemo),
      10
    );
    for (const biz of extras) await tryFav(custId, biz.id);
  }

  // ── Regular customers ─────────────────────────────────────────────────────
  for (let i = 0; i < allCustomerIds.length; i++) {
    const custId = allCustomerIds[i];
    const n = 2 + (i % 7); // 2-8
    const picked = pickN(businesses, n);
    for (const biz of picked) await tryFav(custId, biz.id);
  }

  console.log(`✅ Created ${count} favorites.\n`);
}
