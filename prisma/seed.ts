/**
 * @file Database Seed Script
 * @description Populate the database with realistic test data for development.
 *
 * This script creates:
 *   - 5 users (2 business owners, 3 customers)
 *   - 2 businesses with full profiles
 *   - Multiple services per business
 *   - Weekly operating hours for each business
 *   - Sample bookings in various statuses
 *   - Payment records for bookings
 *   - Customer reviews
 *
 * Run with: npm run db:seed
 * Reset and re-seed with: npm run db:reset
 *
 * @see https://www.prisma.io/docs/guides/migrate/seed-database
 */

import { PrismaClient, DayOfWeek } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

/**
 * Main seed function. Clears existing data, then creates fresh data.
 * Operates run in a specific order to respect foreign key constraints.
 * Users → Businesses → Services & Hours → Bookings → Payments → Reviews
 */
async function main() {
  console.log("🌱 Starting database seed...\n");

  // ---------------------------------------------------------------------------
  // Step 1: Clean existing data
  // ---------------------------------------------------------------------------
  // Delete in reverse order of dependencies to avoid foreign key violations.
  // Reviews depend on Bookings, Bookings depend on Services, etc
  // ---------------------------------------------------------------------------

  console.log("🧹 Cleaning existing data...");

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
  // Step 2: Create Users
  // ---------------------------------------------------------------------------
  // All passwords are hashed with bcrypt (cost factor 10)
  // NEVER store plain-text passwords — event in test data
  // ---------------------------------------------------------------------------

  console.log("👤 Creating users...");

  const hashedPassword = await hash("password123", 10);

  const businessOwner1 = await prisma.user.create({
    data: {
      name: "Marcus Johnson",
      email: "marcus@example.com",
      password: hashedPassword,
      phone: "+1-555-0101",
      role: "BUSINESS_OWNER",
      emailVerification: new Date(),
    },
  });

  const businessOwner2 = await prisma.user.create({
    data: {
      name: "Elena Rodriguez",
      email: "elena@example.com",
      password: hashedPassword,
      phone: "+1-555-0102",
      role: "BUSINESS_OWNER",
      emailVerification: new Date(),
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      name: "James Wilson",
      email: "james@example.com",
      password: hashedPassword,
      phone: "+1-555-0201",
      role: "CUSTOMER",
      emailVerification: new Date(),
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      name: "Sarah Chen",
      email: "sarah@example.com",
      password: hashedPassword,
      phone: "+1-555-0202",
      role: "CUSTOMER",
      emailVerification: new Date(),
    },
  });

  const customer3 = await prisma.user.create({
    data: {
      name: "David Kim",
      email: "david@example.com",
      password: hashedPassword,
      phone: "+1-555-0203",
      role: "CUSTOMER",
      emailVerification: new Date(),
    },
  });

  console.log(`✅ Created ${5} users.\n`);

  // ---------------------------------------------------------------------------
  // Step 3: Create Businesses
  // ---------------------------------------------------------------------------

  console.log("🏪 Creating businesses...");

  const business1 = await prisma.business.create({
    data: {
      ownerId: businessOwner1.id,
      name: "Fresh Cuts Barbershop",
      slug: "fresh-cuts-barbershop",
      description:
        "Premium barbershop offering classic and modern cuts in a relaxed atmosphere. Walk-ins welcome, appointments preferred. Our experienced barbers specialize in fades, beard grooming, and hot towel shaves.",
      category: "BARBERSHOP",
      phone: "+1-555-1001",
      email: "info@freshcuts.example.com",
      website: "https://freshcuts.example.com",
      address: "123 Main Street",
      city: "Austin",
      state: "TX",
      zipCode: "73301",
      isActive: true,
    },
  });

  const business2 = await prisma.business.create({
    data: {
      ownerId: businessOwner2.id,
      name: "Serenity Wellness Spa",
      slug: "serenity-wellness-spa",
      description:
        "A full-service wellness spa dedicated to relaxation and rejuvenation. We offer a range of massage therapies, facials, and body treatments performed by certified therapists in a tranquil setting.",
      category: "SPA",
      phone: "+1-555-1002",
      email: "hello@serenityspa.example.com",
      website: "https://serenityspa.example.com",
      address: "456 Oak Avenue, Suite 200",
      city: "Austin",
      state: "TX",
      zipCode: "73301",
      isActive: true,
    },
  });

  console.log(`✅ Created ${2} businesses.\n`);

  // ---------------------------------------------------------------------------
  // Step 4: Create services
  // ---------------------------------------------------------------------------
  // Prices use Prisma's Decimal type. Duration is in minutes.
  // ---------------------------------------------------------------------------

  console.log("💈 Creating services...");

  // -- Fresh Cuts Barbershop services --
  const barbershopServices = await Promise.all([
    prisma.service.create({
      data: {
        businessId: business1.id,
        name: "Classic Haircut",
        description:
          "Traditional haircut with scissors and clippers. Includes wash, cut, and style.",
        price: 30.0,
        duration: 30,
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        businessId: business1.id,
        name: "Fade Haircut",
        description:
          "Precision fade with seamless blending. Low, mid, or high fade options available.",
        price: 35.0,
        duration: 45,
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        businessId: business1.id,
        name: "Beard Trim & Shape",
        description:
          "Professional beard trimming, shaping, and conditioning with hot towel treatment.",
        price: 20.0,
        duration: 20,
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        businessId: business1.id,
        name: "Haircut + Beard Combo",
        description:
          "Full haircut plus beard trim and shape. Our most popular package.",
        price: 50.0,
        duration: 60,
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        businessId: business1.id,
        name: "Hot Towel Shave",
        description:
          "Luxurious straight razor shave with hot towel preparation and aftershave balm.",
        price: 25.0,
        duration: 30,
        isActive: true,
      },
    }),
  ]);

  // -- Serenity Wellness Spa services --
  const spaServices = await Promise.all([
    prisma.service.create({
      data: {
        businessId: business2.id,
        name: "Swedish Massage",
        description:
          "Full-body relaxation massage using long, flowing strokes to ease tension and promote circulation.",
        price: 80.0,
        duration: 60,
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        businessId: business2.id,
        name: "Deep Tissue Massage",
        description:
          "Intensive massage targeting deep muscle layers. Ideal for chronic pain and muscle recovery.",
        price: 100.0,
        duration: 60,
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        businessId: business2.id,
        name: "Express Facial",
        description:
          "Quick revitalizing facial treatment with cleanse, exfoliation, and hydrating mask.",
        price: 55.0,
        duration: 30,
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        businessId: business2.id,
        name: "Luxury Facial",
        description:
          "Premium facial with deep cleansing, anti-aging serum, collagen mask, and facial mask.",
        price: 120.0,
        duration: 75,
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        businessId: business2.id,
        name: "Hot Stone Massage",
        description:
          "Therapeutic massage using heated basalt stones to melt away tension and promote deep relaxation.",
        price: 110.0,
        duration: 90,
        isActive: true,
      },
    }),
  ]);

  console.log(
    `✅ Created ${barbershopServices.length + spaServices.length} services.\n`
  );

  // ---------------------------------------------------------------------------
  // Step 5: Create business hours
  // ---------------------------------------------------------------------------
  // Both businesses are open Monday-Saturday, closed Sunday.
  // Hours are stored as "HH:mm" strings in the business's local time.
  // ---------------------------------------------------------------------------

  console.log("🕐 Creating business hours...");

  /** Helper: standard weekdays (Mon-Fri) */
  const weekdays: DayOfWeek[] = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
  ];

  // -- Fresh Cuts: Mon-Fri 9am-7pm, Sat 8am-5pm, Sun closed --
  for (const day of weekdays) {
    await prisma.businessHours.create({
      data: {
        businessId: business1.id,
        dayOfWeek: day,
        openTime: "09:00",
        closeTime: "19:00",
        isClosed: false,
      },
    });
  }

  await prisma.businessHours.create({
    data: {
      businessId: business1.id,
      dayOfWeek: "SATURDAY",
      openTime: "08:00",
      closeTime: "17:00",
      isClosed: false,
    },
  });

  await prisma.businessHours.create({
    data: {
      businessId: business1.id,
      dayOfWeek: "SUNDAY",
      openTime: "00:00",
      closeTime: "00:00",
      isClosed: true,
    },
  });

  // -- Serenity Spa: Mon-Fri 10am-8pm, Sat 9am-6pm, Sun closed --
  for (const day of weekdays) {
    await prisma.businessHours.create({
      data: {
        businessId: business2.id,
        dayOfWeek: day,
        openTime: "10:00",
        closeTime: "20:00",
        isClosed: false,
      },
    });
  }

  await prisma.businessHours.create({
    data: {
      businessId: business2.id,
      dayOfWeek: "SATURDAY",
      openTime: "09:00",
      closeTime: "18:00",
      isClosed: false,
    },
  });

  await prisma.businessHours.create({
    data: {
      businessId: business2.id,
      dayOfWeek: "SUNDAY",
      openTime: "00:00",
      closeTime: "00:00",
      isClosed: true,
    },
  });

  console.log("✅ Created business hours for both businesses.\n");

  // ---------------------------------------------------------------------------
  // Step 6: Create bookings
  // ---------------------------------------------------------------------------
  // Create bookings in various statuses to simulate a realistic state.
  // Dates use the current month so the data always looks fresh.
  // ---------------------------------------------------------------------------

  console.log("📅 Create bookings...");

  /**
   * Helper: builds a Date object for a specific day in the current month.
   * Falls back to the last day of the month if the given day exceeds it.
   *
   * @params day - Day of the month (1-31)
   * @returns Date object set to the day in the current month
   */
  const getDateThisMonth = (day: number): Date => {
    const now = new Date();
    const lastDay = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate();
    const safeDay = Math.min(day, lastDay);
    return new Date(now.getFullYear(), now.getMonth(), safeDay);
  };

  // Booking 1: Completed booking at the barbershop
  const booking1 = await prisma.booking.create({
    data: {
      customerId: customer1.id,
      businessId: business1.id,
      serviceId: barbershopServices[0].id, // Classic Haircut
      date: getDateThisMonth(5),
      startTime: "10:00",
      endTime: "10:30",
      status: "COMPLETED",
      totalPrice: 30.0,
      notes: "First time visit. Looking for a clean, professional cut.",
    },
  });

  // Booking 2: Completed booking at the spa
  const booking2 = await prisma.booking.create({
    data: {
      customerId: customer2.id,
      businessId: business2.id,
      serviceId: spaServices[0].id, // Swedish Massage
      date: getDateThisMonth(8),
      startTime: "14:00",
      endTime: "15:00",
      status: "COMPLETED",
      totalPrice: 80.0,
    },
  });

  // Booking 3: Confirmed upcoming booking
  const booking3 = await prisma.booking.create({
    data: {
      customerId: customer3.id,
      businessId: business1.id,
      serviceId: barbershopServices[1].id, // Fade Haircut
      date: getDateThisMonth(22),
      startTime: "11:00",
      endTime: "11:45",
      status: "CONFIRMED",
      totalPrice: 35.0,
      notes: "Low fade, please.",
    },
  });

  // Booking 4: pending booking (awaiting confirmation)
  const booking4 = await prisma.booking.create({
    data: {
      customerId: customer1.id,
      businessId: business2.id,
      serviceId: spaServices[1].id, // Deep tissue massage
      date: getDateThisMonth(25),
      startTime: "16:00",
      endTime: "17:00",
      status: "PENDING",
      totalPrice: 100.0,
      notes: "Focus on lower back area, please.",
    },
  });

  // Booking 5: Cancelled booking
  const booking5 = await prisma.booking.create({
    data: {
      customerId: customer2.id,
      businessId: business1.id,
      serviceId: barbershopServices[3].id, // Haircut + Beard Combo
      date: getDateThisMonth(12),
      startTime: "09:00",
      endTime: "10:00",
      status: "CANCELLED",
      totalPrice: 50.0,
    },
  });

  // Booking 6: Completed booking (for another review)
  const booking6 = await prisma.booking.create({
    data: {
      customerId: customer3.id,
      businessId: business2.id,
      serviceId: spaServices[4].id, // Hot Stone Massage
      date: getDateThisMonth(10),
      startTime: "11.00",
      endTime: "12:30",
      status: "COMPLETED",
      totalPrice: 110.0,
    },
  });

  console.log("✅ Created 6 bookings.\n");

  // ---------------------------------------------------------------------------
  // Step 7: Create payments
  // ---------------------------------------------------------------------------
  // Payments mirror the booking status. Competed bookings have succeeded
  // payments, cancelled payments have refunded payments, etc.
  // Stripe IDs are fake placeholders — real ones come from Stripe's API.
  // ---------------------------------------------------------------------------

  console.log("💳 Creating Payments...");

  await prisma.payment.createMany({
    data: [
      {
        bookingId: booking1.id,
        stripePaymentId: "p1_test_completed_001",
        amount: 30.0,
        status: "SUCCEEDED",
      },
      {
        bookingId: booking2.id,
        stripePaymentId: "p1_test_completed_002",
        amount: 80.0,
        status: "SUCCEEDED",
      },
      {
        bookingId: booking3.id,
        stripePaymentId: "pi_test_confirmed_001",
        amount: 35.0,
        status: "SUCCEEDED",
      },
      {
        bookingId: booking4.id,
        stripePaymentId: null, // Payment not yet initiated
        amount: 100.0,
        status: "PENDING",
      },
      {
        bookingId: booking5.id,
        stripePaymentId: "pi_test_refunded_001",
        amount: 50.0,
        status: "REFUNDED",
      },
      {
        bookingId: booking6.id,
        stripePaymentId: "pi_test_completed_003",
        amount: 110.0,
        status: "SUCCEEDED",
      },
    ],
  });

  console.log("✅ Created 6 payments.\n");

  // ---------------------------------------------------------------------------
  // Step 6: Create reviews
  // ---------------------------------------------------------------------------
  // Only completed bookings can have reviews. Ratings range from 1 to 5.
  // ---------------------------------------------------------------------------

  console.log("⭐ Creating reviews...");

  await prisma.review.createMany({
    data: [
      {
        customerId: customer1.id,
        businessId: business1.id,
        bookingId: booking1.id,
        rating: 5,
        comment:
          "Excellent haircut! Marcus really knows his craft. The shop has a great vibe and I was in and out in 30 minutes. Will definitely be coming back.",
      },
      {
        customerId: customer2.id,
        businessId: business2.id,
        bookingId: booking2.id,
        rating: 4,
        comment:
          "Very relaxing massage. The spa atmosphere is beautiful and calming. Only for 4 stars is the waiting area was a bit crowded. The massage itself was wonderful.",
      },
      {
        customerId: customer3.id,
        businessId: business2.id,
        bookingId: booking6.id,
        rating: 5,
        comment:
          "The hot stone massage was absolutely incredible. Best spa experience I have ever had. The therapist was skilled and attentive. Worth every penny!",
      },
    ],
  });

  console.log("✅ Created 3 reviews.\n");

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------

  console.log("=".repeat(60));
  console.log("🎉 Database seeded successfully!");
  console.log("=".repeat(60));
  console.log("\nTest account (all passwords: 'password123'):");
  console.log("  Business owners:");
  console.log("    - marcus@example.com (Fresh Cuts Barbershop)");
  console.log("    - elena@example.com (Serenity Wellness Spa)");
  console.log("  Customers:");
  console.log("    - james@example.com");
  console.log("    - sarah@example.com");
  console.log("    - david@example.com");
  console.log("\nRun 'npm run db:studio' to browse the data visually.\n");
}

// Execute the seed function and handle errors
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("❌ Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
