/**
 * @file Shared helpers and Prisma singleton for all seed modules.
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

// ---------------------------------------------------------------------------
// Date helpers — window 2025-07 to 2026-06
// ---------------------------------------------------------------------------

/** Return a Date at midnight UTC for a given year, month (1-indexed), day. */
export function d(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

/** Spread dates evenly across the whole window (2025-07 → 2026-06). */
export function windowDate(indexInTotal: number, total: number): Date {
  // Window: 2025-07-01 = day 0, 2026-06-30 = day 364
  const startMs = Date.UTC(2025, 6, 1); // July 1 2025
  const endMs = Date.UTC(2026, 5, 30); // June 30 2026
  const span = endMs - startMs;
  const offset = Math.floor((indexInTotal / total) * span);
  const ms = startMs + offset;
  return new Date(ms);
}

/** Clamp a day number to the actual days in a given month. */
export function clampDay(year: number, month: number, day: number): number {
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Math.min(Math.max(day, 1), last);
}

/** Add minutes to an "HH:mm" string, returns "HH:mm". */
export function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + mins;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

/** Generate a unique Chapa-style transaction reference. */
let _refCounter = 1;
export function chapaRef(): string {
  return `appointly-${String(_refCounter++).padStart(5, "0")}-${Date.now()}`;
}

/** Slugify a business name. */
export function slugify(name: string, suffix = ""): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return suffix ? `${base}-${suffix}` : base;
}

/** Pick a random element from an array. */
export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Pick N unique random elements from an array. */
export function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

/** Round a number to 2 decimal places (for ETB amounts). */
export function etb(amount: number): number {
  return Math.round(amount * 100) / 100;
}

// ---------------------------------------------------------------------------
// Shared time-slot pool
// ---------------------------------------------------------------------------
export const TIME_SLOTS = [
  "07:00",
  "07:30",
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
];
