/**
 * @file Utility Functions
 * @description Shared functions used across the application.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes intelligently, resolving conflicts.
 * Combines clsx (conditional classes) with tailwind-merge (conflict resolution).
 *
 * @param inputs - Class values (strings, arrays, conditionals)
 * @returns Merged string with conflicts resolved
 *
 * @example
 * ```ts
 * cn("px-4 py-2", isActive && "bg-blue-500", "bg-red-500")
 * // → "px-4 py-2 bg-red-500" (bg-red wins over bg-blue)
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a string into a URL-friendly slug.
 *
 * Transformation steps:
 *   1. Convert to lowercase
 *   2. Replace spaces and underscores with hyphens
 *   3. Remove all non-alphanumeric characters (except hyphens)
 *   4. Collapse consecutive hyphens into one
 *   5. Trim leading/trailing hyphens
 *
 * @param text - The string to slugify
 * @returns A URL-safe slug string
 *
 * @example
 * ```ts
 * slugify("Fresh Cuts Barbershop!")  // → "fresh-cuts-barbershop"
 * slugify("  Café & Spa -- Deluxe ") // → "caf-spa-deluxe"
 * ```
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-") // spaces & underscores a hyphens
    .replace(/[^a-z0-9-]/g, "") // remove non-alphanumeric (keep hyphens)
    .replace(/-+/g, "-") // collapse consecutive hyphens
    .replace(/^-|-$/g, ""); // trim leading/trailing hyphens
}

/**
 * Format a duration in minutes into human-readable string.
 *
 * @param minutes - Duration in minutes
 * @returns Formatted string (e.g., "30 min", "1 hr", "1 hr 30 min")
 *
 * @example
 * ```ts
 * formatDuration(30)  // → "30 min"
 * formatDuration(60)  // → "1 hr"
 * formatDuration(90)  // → "1 hr 30 min"
 * ```
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
}

/**
 * Formats a price value into currency string in Ethiopian Birr.
 *
 * @param price - The price as a number, string, or Decimal
 * @returns Formatted ETB string (e.g., "ETB 350.00")
 *
 * @example
 * ```ts
 * formatPrice(350)      // → "ETB 350.00"
 * formatPrice("2500") // → "ETB 2,500.00"
 * formatPrice(0)  // → "ETB 0.00"
 * ```
 */
export function formatPrice(price: number | string): string {
  const numericPrice = typeof price === "string" ? parseFloat(price) : price;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "ETB",
    minimumFractionDigits: 2,
  }).format(numericPrice);
}
