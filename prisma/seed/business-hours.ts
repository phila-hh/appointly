/**
 * @file Seed business hours — 7 entries per business with variety.
 */

import { getPrisma } from "./helpers";
import type { SeededBusiness } from "./businesses";
import type { DayOfWeek } from "@/generated/prisma/client";

const WEEKDAYS: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
];

interface HoursPattern {
  weekday: { open: string; close: string };
  saturday: { open: string; close: string; closed?: boolean };
  sunday: { open: string; close: string; closed: boolean };
}

const PATTERNS: HoursPattern[] = [
  // 0 - Standard 9-6, Sat 8-5, Sun closed
  {
    weekday: { open: "09:00", close: "18:00" },
    saturday: { open: "08:00", close: "17:00" },
    sunday: { open: "00:00", close: "00:00", closed: true },
  },
  // 1 - Late 10-8, Sat 9-6, Sun closed
  {
    weekday: { open: "10:00", close: "20:00" },
    saturday: { open: "09:00", close: "18:00" },
    sunday: { open: "00:00", close: "00:00", closed: true },
  },
  // 2 - Early 7-4, Sat 7-2, Sun closed
  {
    weekday: { open: "07:00", close: "16:00" },
    saturday: { open: "07:00", close: "14:00" },
    sunday: { open: "00:00", close: "00:00", closed: true },
  },
  // 3 - Long 8-9, Sat 8-6, Sun 10-4
  {
    weekday: { open: "08:00", close: "21:00" },
    saturday: { open: "08:00", close: "18:00" },
    sunday: { open: "10:00", close: "16:00", closed: false },
  },
  // 4 - Medical 8-5, Sat 8-12, Sun closed
  {
    weekday: { open: "08:00", close: "17:00" },
    saturday: { open: "08:00", close: "12:00" },
    sunday: { open: "00:00", close: "00:00", closed: true },
  },
  // 5 - Extended 6-10, Sat 6-10, Sun 8-8
  {
    weekday: { open: "06:00", close: "22:00" },
    saturday: { open: "06:00", close: "22:00" },
    sunday: { open: "08:00", close: "20:00", closed: false },
  },
  // 6 - Short 10-3, Sat closed, Sun closed
  {
    weekday: { open: "10:00", close: "15:00" },
    saturday: { open: "00:00", close: "00:00", closed: true },
    sunday: { open: "00:00", close: "00:00", closed: true },
  },
];

export async function seedBusinessHours(
  businesses: SeededBusiness[]
): Promise<void> {
  const prisma = getPrisma();
  console.log("🕐 Creating business hours...");

  // Demo businesses get specific patterns
  const demoPatterns = [3, 1, 5]; // barbershop: long, spa: late, fitness: extended

  let count = 0;
  for (let i = 0; i < businesses.length; i++) {
    const biz = businesses[i];
    const pat =
      i < 3 ? PATTERNS[demoPatterns[i]] : PATTERNS[i % PATTERNS.length];

    for (const day of WEEKDAYS) {
      await prisma.businessHours.create({
        data: {
          businessId: biz.id,
          dayOfWeek: day,
          openTime: pat.weekday.open,
          closeTime: pat.weekday.close,
          isClosed: false,
        },
      });
      count++;
    }

    await prisma.businessHours.create({
      data: {
        businessId: biz.id,
        dayOfWeek: "SATURDAY",
        openTime: pat.saturday.open,
        closeTime: pat.saturday.close,
        isClosed: pat.saturday.closed ?? false,
      },
    });
    count++;

    await prisma.businessHours.create({
      data: {
        businessId: biz.id,
        dayOfWeek: "SUNDAY",
        openTime: pat.sunday.open,
        closeTime: pat.sunday.close,
        isClosed: pat.sunday.closed,
      },
    });
    count++;
  }

  console.log(`✅ Created ${count} business hour entries.\n`);
}
