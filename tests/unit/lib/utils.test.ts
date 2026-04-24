/**
 * @file Utils Unit Tests
 * @description Tests for cn(), slugify(), formatDuration(), and formatPrice().
 *
 * Covers:
 *   - cn: Tailwind class merging and conflict resolution
 *   - slugify: URL-safe slug generation from arbitrary strings
 *   - formatDuration: minutes to human-readable string
 *   - formatPrice: number/string to ETB currency string
 *
 * Pure input/output — no database, no network, no external services.
 */

import { describe, it, expect } from "vitest";
import { cn, slugify, formatDuration, formatPrice } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// cn
// ─────────────────────────────────────────────────────────────────────────────

describe("cn", () => {
  it("merges two simple class strings", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("resolves Tailwind conflicts — last value wins", () => {
    // tailwind-merge should keep bg-red-500 and drop bg-blue-500
    expect(cn("bg-blue-500", "bg-red-500")).toBe("bg-red-500");
  });

  it("drops falsy conditional classes", () => {
    expect(cn("px-4", false && "py-2", null, undefined)).toBe("px-4");
  });

  it("includes truthy conditional classes", () => {
    expect(cn("px-4", true && "py-2")).toBe("px-4 py-2");
  });

  it("handles empty input", () => {
    expect(cn()).toBe("");
  });

  it("handles array of classes", () => {
    expect(cn(["px-4", "py-2"])).toBe("px-4 py-2");
  });

  it("handles object syntax from clsx", () => {
    expect(cn({ "px-4": true, "py-2": false })).toBe("px-4");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// slugify
// ─────────────────────────────────────────────────────────────────────────────

describe("slugify", () => {
  // ── Basic transformations ───────────────────────────────────────────────

  it("converts a simple string to lowercase slug", () => {
    expect(slugify("Haircut")).toBe("haircut");
  });

  it("replaces spaces with hyphens", () => {
    expect(slugify("Fresh Cuts Barbershop")).toBe("fresh-cuts-barbershop");
  });

  it("replaces underscores with hyphens", () => {
    expect(slugify("fresh_cuts_barbershop")).toBe("fresh-cuts-barbershop");
  });

  it("removes special characters", () => {
    expect(slugify("Fresh Cuts Barbershop!")).toBe("fresh-cuts-barbershop");
  });

  it("collapses consecutive hyphens", () => {
    // Two spaces → two hyphens → collapsed to one
    expect(slugify("Bella  Salon")).toBe("bella-salon");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  -Salon- ")).toBe("salon");
  });

  it("handles leading and trailing whitespace", () => {
    expect(slugify("  Bella's Salon  ")).toBe("bellas-salon");
  });

  // ── Real-world business name examples ──────────────────────────────────

  it("slugifies a barbershop name", () => {
    expect(slugify("Fresh Cuts Barbershop!")).toBe("fresh-cuts-barbershop");
  });

  it("handles ampersands and symbols", () => {
    // & and -- are removed/collapsed
    expect(slugify("Café & Spa -- Deluxe")).toBe("caf-spa-deluxe");
  });

  it("handles numbers in the string", () => {
    expect(slugify("Studio 54 Hair")).toBe("studio-54-hair");
  });

  it("handles already-lowercase hyphenated input", () => {
    expect(slugify("already-good-slug")).toBe("already-good-slug");
  });

  // ── Edge cases ──────────────────────────────────────────────────────────

  it("returns empty string for all special characters", () => {
    expect(slugify("!!!")).toBe("");
  });

  it("returns empty string for empty input", () => {
    expect(slugify("")).toBe("");
  });

  it("handles a single letter", () => {
    expect(slugify("A")).toBe("a");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// formatDuration
// ─────────────────────────────────────────────────────────────────────────────

describe("formatDuration", () => {
  // ── Minutes only ────────────────────────────────────────────────────────

  it("formats 30 minutes as '30 min'", () => {
    expect(formatDuration(30)).toBe("30 min");
  });

  it("formats 5 minutes as '5 min'", () => {
    expect(formatDuration(5)).toBe("5 min");
  });

  it("formats 45 minutes as '45 min'", () => {
    expect(formatDuration(45)).toBe("45 min");
  });

  // ── Hours only ──────────────────────────────────────────────────────────

  it("formats 60 minutes as '1 hr'", () => {
    expect(formatDuration(60)).toBe("1 hr");
  });

  it("formats 120 minutes as '2 hr'", () => {
    expect(formatDuration(120)).toBe("2 hr");
  });

  it("formats 480 minutes as '8 hr'", () => {
    expect(formatDuration(480)).toBe("8 hr");
  });

  // ── Hours and minutes combined ──────────────────────────────────────────

  it("formats 90 minutes as '1 hr 30 min'", () => {
    expect(formatDuration(90)).toBe("1 hr 30 min");
  });

  it("formats 75 minutes as '1 hr 15 min'", () => {
    expect(formatDuration(75)).toBe("1 hr 15 min");
  });

  it("formats 150 minutes as '2 hr 30 min'", () => {
    expect(formatDuration(150)).toBe("2 hr 30 min");
  });

  // ── Edge cases ──────────────────────────────────────────────────────────

  it("formats 0 minutes as '0 min'", () => {
    expect(formatDuration(0)).toBe("0 min");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// formatPrice
// ─────────────────────────────────────────────────────────────────────────────

describe("formatPrice", () => {
  // ── Number input ────────────────────────────────────────────────────────

  it("formats zero as ETB 0.00", () => {
    expect(formatPrice(0)).toBe("ETB\u00a00.00");
  });

  it("formats a whole number correctly", () => {
    expect(formatPrice(350)).toBe("ETB\u00a0350.00");
  });

  it("formats a large number with comma separator", () => {
    expect(formatPrice(2500)).toBe("ETB\u00a02,500.00");
  });

  it("formats a decimal number correctly", () => {
    expect(formatPrice(350.5)).toBe("ETB\u00a0350.50");
  });

  it("formats a number with two decimal places already", () => {
    expect(formatPrice(99.99)).toBe("ETB\u00a099.99");
  });

  // ── String input ────────────────────────────────────────────────────────

  it("parses and formats a string number", () => {
    expect(formatPrice("2500")).toBe("ETB\u00a02,500.00");
  });

  it("parses and formats a decimal string", () => {
    expect(formatPrice("350.50")).toBe("ETB\u00a0350.50");
  });
});
