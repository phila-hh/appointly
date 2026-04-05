/**
 * @file Database Seed Script
 * @description Populates the database with realistic test data for development.
 *
 * This script creates:
 *   - 5 users (2 business owners, 3 customers)
 *   - 2 businesses with full profiles
 *   - Multiple services per business (priced in ETB)
 *   - Weekly operating hours for each business
 *   - Sample bookings in various statuses
 *   - Payment records for bookings
 *   - Customer reviews
 *
 * Run with: npm run db:seed
 * Reset and re-seed with: npm run db:reset
 */

import { PrismaClient, DayOfWeek } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

/**
 * Main seed function. Clears existing data, then creates fresh test data.
 */
async function main() {
  console.log("🌱 Starting database seed...\n");

  // ---------------------------------------------------------------------------
  // Step 1: Clean existing data (reverse order of dependencies)
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
  // Step 2: Create users
  // ---------------------------------------------------------------------------

  console.log("👤 Creating users...");

  const hashedPassword = await hash("password123", 10);

  const businessOwner1 = await prisma.user.create({
    data: {
      name: "Marcus Johnson",
      email: "marcus@gmail.com",
      password: hashedPassword,
      phone: "+251-911-123456",
      role: "BUSINESS_OWNER",
      emailVerified: new Date(),
    },
  });

  const businessOwner2 = await prisma.user.create({
    data: {
      name: "Elena Rodriguez",
      email: "elena@gmail.com",
      password: hashedPassword,
      phone: "+251-922-654321",
      role: "BUSINESS_OWNER",
      emailVerified: new Date(),
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      name: "James Wilson",
      email: "james@gmail.com",
      password: hashedPassword,
      phone: "+251-933-111222",
      role: "CUSTOMER",
      emailVerified: new Date(),
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      name: "Sarah Chen",
      email: "sarah@gmail.com",
      password: hashedPassword,
      phone: "+251-944-333444",
      role: "CUSTOMER",
      emailVerified: new Date(),
    },
  });

  const customer3 = await prisma.user.create({
    data: {
      name: "David Kim",
      email: "david@gmail.com",
      password: hashedPassword,
      phone: "+251-955-555666",
      role: "CUSTOMER",
      emailVerified: new Date(),
    },
  });

  console.log(`✅ Created ${5} users.\n`);

  // ---------------------------------------------------------------------------
  // Step 3: Create businesses
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
      phone: "+251-911-100100",
      email: "info@freshcuts.example.com",
      website: "https://freshcuts.example.com",
      address: "Bole Road, Friendship Building, 3rd Floor",
      city: "Addis Ababa",
      state: "Addis Ababa",
      zipCode: "1000",
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
      phone: "+251-922-200200",
      email: "hello@serenityspa.example.com",
      website: "https://serenityspa.example.com",
      address: "Kazanchis, Mega Building, Ground Floor",
      city: "Addis Ababa",
      state: "Addis Ababa",
      zipCode: "1000",
      isActive: true,
    },
  });

  console.log(`✅ Created ${2} businesses.\n`);

  // ---------------------------------------------------------------------------
  // Step 4: Create services (prices in ETB)
  // ---------------------------------------------------------------------------

  console.log("💈 Creating services...");

  const barbershopServices = await Promise.all([
    prisma.service.create({
      data: {
        businessId: business1.id,
        name: "Classic Haircut",
        description:
          "Traditional haircut with scissors and clippers. Includes wash, cut, and style.",
        price: 350,
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
        price: 450,
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
        price: 200,
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
        price: 550,
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
        price: 300,
        duration: 30,
        isActive: true,
      },
    }),
  ]);

  const spaServices = await Promise.all([
    prisma.service.create({
      data: {
        businessId: business2.id,
        name: "Swedish Massage",
        description:
          "Full-body relaxation massage using long, flowing strokes to ease tension and promote circulation.",
        price: 2000,
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
        price: 2500,
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
        price: 1200,
        duration: 30,
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        businessId: business2.id,
        name: "Luxury Facial",
        description:
          "Premium facial with deep cleansing, anti-aging serum, collagen mask, and facial massage.",
        price: 3500,
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
        price: 2800,
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

  console.log("🕐 Creating business hours...");

  const weekdays: DayOfWeek[] = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
  ];

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
  // Step 6: Create bookings (prices in ETB)
  // ---------------------------------------------------------------------------

  console.log("📅 Creating bookings...");

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

  const booking1 = await prisma.booking.create({
    data: {
      customerId: customer1.id,
      businessId: business1.id,
      serviceId: barbershopServices[0].id,
      date: getDateThisMonth(5),
      startTime: "10:00",
      endTime: "10:30",
      status: "COMPLETED",
      totalPrice: 350,
      notes: "First time visit. Looking for a clean, professional cut.",
    },
  });

  const booking2 = await prisma.booking.create({
    data: {
      customerId: customer2.id,
      businessId: business2.id,
      serviceId: spaServices[0].id,
      date: getDateThisMonth(8),
      startTime: "14:00",
      endTime: "15:00",
      status: "COMPLETED",
      totalPrice: 2000,
    },
  });

  const booking3 = await prisma.booking.create({
    data: {
      customerId: customer3.id,
      businessId: business1.id,
      serviceId: barbershopServices[1].id,
      date: getDateThisMonth(22),
      startTime: "11:00",
      endTime: "11:45",
      status: "CONFIRMED",
      totalPrice: 450,
      notes: "Low fade, please.",
    },
  });

  const booking4 = await prisma.booking.create({
    data: {
      customerId: customer1.id,
      businessId: business2.id,
      serviceId: spaServices[1].id,
      date: getDateThisMonth(25),
      startTime: "16:00",
      endTime: "17:00",
      status: "PENDING",
      totalPrice: 2500,
      notes: "Focus on lower back area, please.",
    },
  });

  const booking5 = await prisma.booking.create({
    data: {
      customerId: customer2.id,
      businessId: business1.id,
      serviceId: barbershopServices[3].id,
      date: getDateThisMonth(12),
      startTime: "09:00",
      endTime: "10:00",
      status: "CANCELLED",
      totalPrice: 550,
    },
  });

  const booking6 = await prisma.booking.create({
    data: {
      customerId: customer3.id,
      businessId: business2.id,
      serviceId: spaServices[4].id,
      date: getDateThisMonth(10),
      startTime: "11:00",
      endTime: "12:30",
      status: "COMPLETED",
      totalPrice: 2800,
    },
  });

  console.log(`✅ Created 6 bookings.\n`);

  // ---------------------------------------------------------------------------
  // Step 7: Create payments (Chapa transaction references)
  // ---------------------------------------------------------------------------

  console.log("💳 Creating payments...");

  await prisma.payment.createMany({
    data: [
      {
        bookingId: booking1.id,
        chapaTransactionRef: "appointly-test-001-1700000001",
        amount: 350,
        status: "SUCCEEDED",
      },
      {
        bookingId: booking2.id,
        chapaTransactionRef: "appointly-test-002-1700000002",
        amount: 2000,
        status: "SUCCEEDED",
      },
      {
        bookingId: booking3.id,
        chapaTransactionRef: "appointly-test-003-1700000003",
        amount: 450,
        status: "SUCCEEDED",
      },
      {
        bookingId: booking4.id,
        chapaTransactionRef: null,
        amount: 2500,
        status: "PENDING",
      },
      {
        bookingId: booking5.id,
        chapaTransactionRef: "appointly-test-005-1700000005",
        amount: 550,
        status: "REFUNDED",
      },
      {
        bookingId: booking6.id,
        chapaTransactionRef: "appointly-test-006-1700000006",
        amount: 2800,
        status: "SUCCEEDED",
      },
    ],
  });

  console.log("✅ Created 6 payments.\n");

  // ---------------------------------------------------------------------------
  // Step 8: Create reviews
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
          "Very relaxing massage. The spa atmosphere is beautiful and calming. Only reason for 4 stars is the waiting area was a bit crowded. The massage itself was wonderful.",
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
  console.log("\nTest accounts (all passwords: 'password123'):");
  console.log("  Business owners:");
  console.log("    - marcus@gmail.com  (Fresh Cuts Barbershop)");
  console.log("    - elena@gmail.com   (Serenity Wellness Spa)");
  console.log("  Customers:");
  console.log("    - james@gmail.com");
  console.log("    - sarah@gmail.com");
  console.log("    - david@gmail.com");
  console.log("\nRun 'npm run db:studio' to browse the data visually.\n");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("❌ Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
