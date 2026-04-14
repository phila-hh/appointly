/**
 * @file Shared helpers for seed data generation
 */

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

let _prisma: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (!_prisma) {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    _prisma = new PrismaClient({ adapter });
  }
  return _prisma;
}

/**
 * Get a date in the current month, clamped to valid range.
 */
export function getDateThisMonth(day: number): Date {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const safeDay = Math.min(Math.max(day, 1), lastDay);
  return new Date(now.getFullYear(), now.getMonth(), safeDay);
}

/**
 * Get a date in the previous month.
 */
export function getDateLastMonth(day: number): Date {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  const safeDay = Math.min(Math.max(day, 1), lastDay);
  return new Date(now.getFullYear(), now.getMonth() - 1, safeDay);
}

/**
 * Get a date in the next month.
 */
export function getDateNextMonth(day: number): Date {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 2, 0).getDate();
  const safeDay = Math.min(Math.max(day, 1), lastDay);
  return new Date(now.getFullYear(), now.getMonth() + 1, safeDay);
}

/**
 * Calculate end time given start time and duration in minutes.
 */
export function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const totalMinutes = h * 60 + m + minutes;
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

/**
 * Generate a slug from a business name.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Generate a unique Chapa transaction reference.
 */
export function chapaRef(index: number): string {
  return `appointly-seed-${String(index).padStart(4, "0")}-${Date.now()}`;
}
