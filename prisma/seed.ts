/**
 * @file Database Seed Script — Main Orchestrator
 * @description Populates the database with massive, realistic Ethiopian test data.
 *
 * Creates:
 *   - 167 users (55 business owners, 110 customers, 2 admins)
 *   - 55 businesses across all 13 categories
 *   - 350+ services (5-10 per business, prices in ETB)
 *   - Weekly operating hours for all businesses
 *   - 420+ bookings in every status with edge cases
 *   - Payment records for all bookings
 *   - Reviews for ~70% of completed bookings
 *   - Customer favorites
 *
 * Run with: npm run db:seed
 * Reset and re-seed with: npm run db:reset
 */

import { getPrisma } from "./seed/helpers";
import { seedUsers } from "./seed/users";
import { seedBusinesses } from "./seed/businesses";
import { seedServices } from "./seed/services";
import { seedBusinessHours } from "./seed/business-hours";
import { seedBookings } from "./seed/bookings";
import { seedPayments } from "./seed/payments";
import { seedReviews } from "./seed/reviews";
import { seedFavorites } from "./seed/favorites";

async function main() {
  const prisma = getPrisma();

  console.log("🌱 Starting database seed...\n");
  console.log("=".repeat(60));

  // ---------------------------------------------------------------------------
  // Step 1: Clean existing data (reverse order of dependencies)
  // ---------------------------------------------------------------------------

  console.log("🧹 Cleaning existing data...");

  await prisma.favorite.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.businessHours.deleteMany();
  await prisma.service.deleteMany();
  await prisma.business.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();

  console.log("✅ Existing data cleared.\n");

  // ---------------------------------------------------------------------------
  // Step 2: Seed users
  // ---------------------------------------------------------------------------

  const { businessOwners, customers, admins } = await seedUsers();

  // ---------------------------------------------------------------------------
  // Step 3: Seed businesses
  // ---------------------------------------------------------------------------

  const businesses = await seedBusinesses(businessOwners.map((u) => u.id));

  // ---------------------------------------------------------------------------
  // Step 4: Seed services
  // ---------------------------------------------------------------------------

  const services = await seedServices(businesses);

  // ---------------------------------------------------------------------------
  // Step 5: Seed business hours
  // ---------------------------------------------------------------------------

  await seedBusinessHours(businesses);

  // ---------------------------------------------------------------------------
  // Step 6: Seed bookings
  // ---------------------------------------------------------------------------

  const bookings = await seedBookings(
    customers.map((c) => c.id),
    businesses,
    services
  );

  // ---------------------------------------------------------------------------
  // Step 7: Seed payments
  // ---------------------------------------------------------------------------

  await seedPayments(bookings);

  // ---------------------------------------------------------------------------
  // Step 8: Seed reviews
  // ---------------------------------------------------------------------------

  await seedReviews(bookings);

  // ---------------------------------------------------------------------------
  // Step 9: Seed favorites
  // ---------------------------------------------------------------------------

  await seedFavorites(
    customers.map((c) => c.id),
    businesses
  );

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------

  console.log("=".repeat(60));
  console.log("🎉 Database seeded successfully!");
  console.log("=".repeat(60));
  console.log(`
📊 Seed Summary:
  👤 Users:        ${businessOwners.length + customers.length + admins.length}
     ├─ Business Owners: ${businessOwners.length}
     ├─ Customers:       ${customers.length}
     └─ Admins:          ${admins.length}
  🏪 Businesses:   ${businesses.length} (across all 13 categories)
  💈 Services:     ${services.length}
  🕐 Hours:        ${businesses.length * 7} entries
  📅 Bookings:     ${bookings.length}
     ├─ COMPLETED:  ${bookings.filter((b) => b.status === "COMPLETED").length}
     ├─ CONFIRMED:  ${bookings.filter((b) => b.status === "CONFIRMED").length}
     ├─ PENDING:    ${bookings.filter((b) => b.status === "PENDING").length}
     ├─ CANCELLED:  ${bookings.filter((b) => b.status === "CANCELLED").length}
     └─ NO_SHOW:    ${bookings.filter((b) => b.status === "NO_SHOW").length}
  💳 Payments:     ${bookings.length}
  ⭐ Reviews:      ~${Math.floor(bookings.filter((b) => b.status === "COMPLETED").length * 0.7)}
  ❤️  Favorites:    ~${customers.length * 5} (avg 5 per customer)

🔐 Test accounts (all passwords: 'password123'):

  Admins:
    - admin.yonas@gmail.com
    - admin.tigist@gmail.com

  Business owners (first 5):
    - abebe.kebede@gmail.com      (Fresh Cuts Barbershop)
    - tigist.haile@gmail.com      (Arada Mens Grooming)
    - dawit.mengistu@gmail.com    (Kings Barbershop Hawassa)
    - meron.tadesse@gmail.com     (Dire Dawa Classic Cuts)
    - yohannes.bekele@gmail.com   (Blade Masters Bahir Dar)

  Customers (first 5):
    - abenet.worku@gmail.com
    - addis.gebreselassie@gmail.com
    - alem.tessema@gmail.com
    - aster.beyene@gmail.com
    - berhane.kidane@gmail.com

  📌 All 55 business owners and 110 customers use: password123

Run 'npm run db:studio' to browse the data visually.
`);
}

main()
  .then(async () => {
    const prisma = getPrisma();
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("❌ Seed failed:", error);
    const prisma = getPrisma();
    await prisma.$disconnect();
    process.exit(1);
  });
