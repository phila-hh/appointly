/**
 * @file Database Seed Script — Main Orchestrator
 * Updated: added notifications step, updated clean step for new models.
 */

import { getPrisma } from "./seed/helpers";
import { seedPlatformSettings } from "./seed/platform";
import { seedUsers } from "./seed/users";
import { seedBusinesses } from "./seed/businesses";
import { seedServices } from "./seed/services";
import { seedStaff } from "./seed/staff";
import { seedBusinessHours } from "./seed/business-hours";
import { seedBookings } from "./seed/bookings";
import { seedPayments } from "./seed/payments";
import { seedCommissions } from "./seed/commissions";
import { seedPayouts } from "./seed/payouts";
import { seedReviews } from "./seed/reviews";
import { seedFavorites } from "./seed/favorites";
import { seedAuditLogs } from "./seed/audit-logs";
import { seedNotifications } from "./seed/notifications";

async function main() {
  const prisma = getPrisma();

  console.log("\n" + "=".repeat(60));
  console.log("🌱 Starting Appointly database seed...");
  console.log("   Date window: 2025-07-01 → 2026-06-30");
  console.log("=".repeat(60) + "\n");

  // ── Step 1: Clean ──────────────────────────────────────────────────────────
  console.log("🧹 Cleaning existing data...");
  await prisma.notification.deleteMany();
  await prisma.adminAuditLog.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.review.deleteMany();
  await prisma.commission.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.staffHours.deleteMany();
  await prisma.staffService.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.businessHours.deleteMany();
  await prisma.service.deleteMany();
  await prisma.business.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.platformSettings.deleteMany();
  console.log("✅ Cleaned.\n");

  // ── Step 2: Platform settings ─────────────────────────────────────────────
  await seedPlatformSettings();

  // ── Step 3: Users ─────────────────────────────────────────────────────────
  const users = await seedUsers();

  // ── Step 4: Businesses ────────────────────────────────────────────────────
  const businesses = await seedBusinesses(users);

  // ── Step 5: Services ──────────────────────────────────────────────────────
  const services = await seedServices(businesses);

  // ── Step 6: Staff (with hours + service links) ────────────────────────────
  const staff = await seedStaff(businesses, services);

  // ── Step 7: Business hours ────────────────────────────────────────────────
  await seedBusinessHours(businesses);

  // ── Step 8: Bookings ──────────────────────────────────────────────────────
  const bookings = await seedBookings(
    users.allCustomers.map((c) => c.id),
    users.demoCustomers.map((c) => c.id),
    businesses,
    services,
    staff
  );

  // ── Step 9: Payments ──────────────────────────────────────────────────────
  await seedPayments(bookings);

  // ── Step 10: Commissions ──────────────────────────────────────────────────
  const commissions = await seedCommissions(bookings);

  // ── Step 11: Payouts ──────────────────────────────────────────────────────
  await seedPayouts(commissions);

  // ── Step 12: Reviews ──────────────────────────────────────────────────────
  await seedReviews(bookings);

  // ── Step 13: Favorites ────────────────────────────────────────────────────
  await seedFavorites(
    users.allCustomers.map((c) => c.id),
    users.demoCustomers.map((c) => c.id),
    businesses
  );

  // ── Step 14: Audit logs ───────────────────────────────────────────────────
  await seedAuditLogs(users.admins, businesses);

  // ── Step 15: Notifications ────────────────────────────────────────────────
  await seedNotifications(
    users.admins,
    users.demoOwners,
    users.regularOwners,
    users.demoCustomers,
    users.regularCustomers,
    businesses,
    bookings
  );

  // ── Summary ───────────────────────────────────────────────────────────────
  const statusCounts = bookings.reduce(
    (a, b) => {
      a[b.status] = (a[b.status] || 0) + 1;
      return a;
    },
    {} as Record<string, number>
  );

  console.log("\n" + "=".repeat(60));
  console.log("🎉 Appointly database seeded successfully!");
  console.log("=".repeat(60));
  console.log(`
📊 Seed Summary:
  ⚙️  Platform Settings: 1
  👤 Users:             ${users.allOwners.length + users.allCustomers.length + users.admins.length}
     ├─ Admins:              ${users.admins.length}
     ├─ Business Owners:     ${users.allOwners.length} (3 demo)
     └─ Customers:           ${users.allCustomers.length} (3 demo)
  🏪 Businesses:        ${businesses.length} (3 demo, ${businesses.length - 3} regular)
  💈 Services:          ${services.length}
  👷 Staff Members:     ${staff.length}
  🕐 Business Hours:    ${businesses.length * 7} entries
  📅 Bookings:          ${bookings.length}
     ├─ COMPLETED:  ${statusCounts.COMPLETED || 0}
     ├─ CONFIRMED:  ${statusCounts.CONFIRMED || 0}
     ├─ PENDING:    ${statusCounts.PENDING || 0}
     ├─ CANCELLED:  ${statusCounts.CANCELLED || 0}
     └─ NO_SHOW:    ${statusCounts.NO_SHOW || 0}
  💳 Payments:          ${bookings.length} (SUCCEEDED / PENDING / FAILED / REFUNDED)
  💰 Commissions:       (PENDING / INCLUDED_IN_PAYOUT / PAID_OUT)
  📤 Payouts:           (PAID / PROCESSING / FAILED)
  ⭐ Reviews:           with sentiment labels + business replies
  🔔 Notifications:     all 13 types, full coverage for demo accounts
  📋 Audit Logs:        26 admin action entries
`);

  console.log("=".repeat(60));
  console.log("🔐 ALL ACCOUNTS — password: password123");
  console.log("=".repeat(60));
  console.log(`
┌─────────────────────────────────────────────────────────┐
│                   ADMINS                                │
├─────────────────────────────────────────────────────────┤
│  admin.gebremedhin@gmail.com  (Gebremedhin Hagos)       │
│  admin.nigisti@gmail.com      (Nigisti Berhe)            │
├─────────────────────────────────────────────────────────┤
│              DEMO BUSINESS OWNERS  ⭐                   │
├─────────────────────────────────────────────────────────┤
│  tekleab.kahsay@gmail.com  → Habesha Cuts Barbershop    │
│    • 90+ bookings, 5 staff, full commission history     │
│    • Announcements, reviews with replies, notifications │
│    • Location: Hawelti, Mekelle, Tigray                 │
│                                                         │
│  abrehet.weldu@gmail.com   → Axum Wellness Spa          │
│    • 90+ bookings, 5 staff, full commission history     │
│    • Announcements, reviews with replies, notifications │
│    • Location: Adi Haki, Mekelle, Tigray                │
│                                                         │
│  mehari.gebrehiwet@gmail.com → Tigray Fitness Hub       │
│    • 90+ bookings, 5 staff, full commission history     │
│    • Announcements, reviews with replies, notifications │
│    • Location: Kedamay Weyane, Mekelle, Tigray          │
├─────────────────────────────────────────────────────────┤
│              DEMO CUSTOMERS  ⭐                         │
├─────────────────────────────────────────────────────────┤
│  bereket.gebremedhin@gmail.com (Bereket Gebremedhin)    │
│    • 40+ extra bookings across all 3 demo businesses    │
│    • All notification types, reviews, rescheduled       │
│                                                         │
│  semhar.tekleab@gmail.com (Semhar Tekleab)              │
│    • 35+ extra bookings (spa & salon focus)             │
│    • Cancellation history, refund notifications         │
│                                                         │
│  yonas.hagos@gmail.com (Yonas Hagos)                    │
│    • 35+ extra bookings (fitness & barbershop focus)    │
│    • No-show history, rescheduled bookings              │
├─────────────────────────────────────────────────────────┤
│  All locations: Mekelle, Adwa, Axum, Adigrat, Wukro,   │
│  Shire, Maychew, Abiy Addi, Enticho, Edaga Hamus, etc. │
│  Password for ALL accounts: password123                 │
└─────────────────────────────────────────────────────────┘

Run 'npm run db:studio' to browse the data visually.
`);
}

main()
  .then(async () => {
    const prisma = getPrisma();
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error("❌ Seed failed:", err);
    const prisma = getPrisma();
    await prisma.$disconnect();
    process.exit(1);
  });
