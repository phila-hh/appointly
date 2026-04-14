/**
 * @file Seed business hours — weekly schedules for all businesses
 * Includes variety: some open Sunday, some close early, some have different hours
 */

import { getPrisma } from "./helpers";
import type { DayOfWeek } from "@/generated/prisma/client";
import type { SeededBusiness } from "./businesses";

interface HoursPattern {
  weekday: { open: string; close: string; isClosed?: boolean };
  saturday: { open: string; close: string; isClosed?: boolean };
  sunday: { open: string; close: string; isClosed?: boolean };
}

const PATTERNS: HoursPattern[] = [
  // Pattern 0: Standard 9-6, Sat 8-5, Sun closed
  {
    weekday: { open: "09:00", close: "18:00" },
    saturday: { open: "08:00", close: "17:00" },
    sunday: { open: "00:00", close: "00:00", isClosed: true },
  },
  // Pattern 1: Late opening 10-8, Sat 9-6, Sun closed
  {
    weekday: { open: "10:00", close: "20:00" },
    saturday: { open: "09:00", close: "18:00" },
    sunday: { open: "00:00", close: "00:00", isClosed: true },
  },
  // Pattern 2: Early bird 7-4, Sat 7-2, Sun closed
  {
    weekday: { open: "07:00", close: "16:00" },
    saturday: { open: "07:00", close: "14:00" },
    sunday: { open: "00:00", close: "00:00", isClosed: true },
  },
  // Pattern 3: Long hours 8-9, Sat 8-6, Sun 10-4
  {
    weekday: { open: "08:00", close: "21:00" },
    saturday: { open: "08:00", close: "18:00" },
    sunday: { open: "10:00", close: "16:00", isClosed: false },
  },
  // Pattern 4: Medical hours 8-5, Sat 8-12, Sun closed
  {
    weekday: { open: "08:00", close: "17:00" },
    saturday: { open: "08:00", close: "12:00" },
    sunday: { open: "00:00", close: "00:00", isClosed: true },
  },
  // Pattern 5: 24/7 style but with shifts 6am-10pm
  {
    weekday: { open: "06:00", close: "22:00" },
    saturday: { open: "06:00", close: "22:00" },
    sunday: { open: "08:00", close: "20:00", isClosed: false },
  },
  // Pattern 6: Short hours 10-3, Sat closed, Sun closed (edge case)
  {
    weekday: { open: "10:00", close: "15:00" },
    saturday: { open: "00:00", close: "00:00", isClosed: true },
    sunday: { open: "00:00", close: "00:00", isClosed: true },
  },
];

const WEEKDAYS: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
];

export async function seedBusinessHours(
  businesses: SeededBusiness[]
): Promise<void> {
  const prisma = getPrisma();
  console.log("🕐 Creating business hours...");

  let count = 0;
  for (let i = 0; i < businesses.length; i++) {
    const biz = businesses[i];
    const pattern = PATTERNS[i % PATTERNS.length];

    for (const day of WEEKDAYS) {
      await prisma.businessHours.create({
        data: {
          businessId: biz.id,
          dayOfWeek: day,
          openTime: pattern.weekday.open,
          closeTime: pattern.weekday.close,
          isClosed: false,
        },
      });
      count++;
    }

    // Saturday
    await prisma.businessHours.create({
      data: {
        businessId: biz.id,
        dayOfWeek: "SATURDAY",
        openTime: pattern.saturday.open,
        closeTime: pattern.saturday.close,
        isClosed: pattern.saturday.isClosed || false,
      },
    });
    count++;

    // Sunday
    await prisma.businessHours.create({
      data: {
        businessId: biz.id,
        dayOfWeek: "SUNDAY",
        openTime: pattern.sunday.open,
        closeTime: pattern.sunday.close,
        isClosed: pattern.sunday.isClosed,
      },
    });
    count++;
  }

  console.log(`✅ Created ${count} business hour entries.\n`);
}
