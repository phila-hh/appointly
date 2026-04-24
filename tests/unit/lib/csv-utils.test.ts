/**
 * @file CSV Utils Unit Tests
 * @description Tests for formatAnalyticsForCSV() — the analytics CSV formatter.
 *
 * Covers:
 *   - All four export types: revenue, bookings, services, customers
 *   - Correct column headers per type
 *   - Correct value formatting (ETB prefix, avg calculation, null name)
 *   - Filename generation: type slug + sanitized date range + timestamp
 *   - Empty input arrays return empty data arrays
 *
 * Note: downloadCSV() is NOT tested here — it calls URL.createObjectURL
 * and DOM methods that jsdom does not support. The CSV string-building
 * logic is exercised through formatAnalyticsForCSV().
 *
 * vi.useFakeTimers() is used to pin the timestamp in generated filenames
 * so assertions are deterministic.
 *
 * Pure input/output — no database, no network.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { formatAnalyticsForCSV } from "@/lib/csv-utils";

describe("formatAnalyticsForCSV", () => {
  // Pin clock so the timestamp in filenames is deterministic
  const FIXED_NOW = new Date("2027-06-15T00:00:00.000Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── revenue ─────────────────────────────────────────────────────────────

  describe("type: revenue", () => {
    const revenueData = [
      { date: "2027-06-01", revenue: 1500 },
      { date: "2027-06-02", revenue: 2250.5 },
    ];

    it("maps each item to Date and Revenue columns", () => {
      const { data } = formatAnalyticsForCSV(
        "revenue",
        revenueData,
        "Jun 2027"
      );
      expect(data).toHaveLength(2);
      expect(data[0]).toHaveProperty("Date", "2027-06-01");
      expect(data[0]).toHaveProperty("Revenue", "ETB 1500.00");
    });

    it("formats revenue with 2 decimal places", () => {
      const { data } = formatAnalyticsForCSV(
        "revenue",
        revenueData,
        "Jun 2027"
      );
      expect(data[1]).toHaveProperty("Revenue", "ETB 2250.50");
    });

    it("generates a filename starting with 'revenue-'", () => {
      const { filename } = formatAnalyticsForCSV(
        "revenue",
        revenueData,
        "Jun 2027"
      );
      expect(filename.startsWith("revenue-")).toBe(true);
    });

    it("appends the today's date to the filename", () => {
      const { filename } = formatAnalyticsForCSV(
        "revenue",
        revenueData,
        "Jun 2027"
      );
      expect(filename).toContain("2027-06-15");
    });

    it("sanitizes special characters in the date range for the filename", () => {
      const { filename } = formatAnalyticsForCSV(
        "revenue",
        revenueData,
        "Jun 1 - Jun 30, 2027"
      );
      // Spaces, commas, hyphens replaced with hyphens
      expect(filename).not.toMatch(/[ ,]/);
    });

    it("returns empty data array for empty input", () => {
      const { data } = formatAnalyticsForCSV("revenue", [], "Jun 2027");
      expect(data).toHaveLength(0);
    });
  });

  // ── bookings ─────────────────────────────────────────────────────────────

  describe("type: bookings", () => {
    const bookingsData = [
      { date: "2027-06-01", count: 5 },
      { date: "2027-06-02", count: 12 },
    ];

    it("maps each item to Date and Bookings columns", () => {
      const { data } = formatAnalyticsForCSV(
        "bookings",
        bookingsData,
        "Jun 2027"
      );
      expect(data).toHaveLength(2);
      expect(data[0]).toHaveProperty("Date", "2027-06-01");
      expect(data[0]).toHaveProperty("Bookings", 5);
    });

    it("generates a filename starting with 'bookings-'", () => {
      const { filename } = formatAnalyticsForCSV(
        "bookings",
        bookingsData,
        "Jun 2027"
      );
      expect(filename.startsWith("bookings-")).toBe(true);
    });

    it("returns empty data array for empty input", () => {
      const { data } = formatAnalyticsForCSV("bookings", [], "Jun 2027");
      expect(data).toHaveLength(0);
    });
  });

  // ── services ─────────────────────────────────────────────────────────────

  describe("type: services", () => {
    const servicesData = [
      { serviceName: "Haircut", revenue: 3000, bookings: 20 },
      { serviceName: "Shave", revenue: 500, bookings: 10 },
    ];

    it("maps each item to Service, Revenue, Bookings, and Avg Value columns", () => {
      const { data } = formatAnalyticsForCSV(
        "services",
        servicesData,
        "Jun 2027"
      );
      expect(data[0]).toHaveProperty("Service", "Haircut");
      expect(data[0]).toHaveProperty("Revenue", "ETB 3000.00");
      expect(data[0]).toHaveProperty("Bookings", 20);
      expect(data[0]).toHaveProperty("Avg Value", "ETB 150.00");
    });

    it("calculates average value correctly as revenue / bookings", () => {
      const { data } = formatAnalyticsForCSV(
        "services",
        servicesData,
        "Jun 2027"
      );
      // 500 / 10 = 50.00
      expect(data[1]).toHaveProperty("Avg Value", "ETB 50.00");
    });

    it("formats revenue with 2 decimal places", () => {
      const data2 = [
        { serviceName: "Deep Condition", revenue: 125.5, bookings: 5 },
      ];
      const { data } = formatAnalyticsForCSV("services", data2, "Jun 2027");
      expect(data[0]).toHaveProperty("Revenue", "ETB 125.50");
    });

    it("generates a filename starting with 'service-performance-'", () => {
      const { filename } = formatAnalyticsForCSV(
        "services",
        servicesData,
        "Jun 2027"
      );
      expect(filename.startsWith("service-performance-")).toBe(true);
    });

    it("returns empty data array for empty input", () => {
      const { data } = formatAnalyticsForCSV("services", [], "Jun 2027");
      expect(data).toHaveLength(0);
    });
  });

  // ── customers ─────────────────────────────────────────────────────────────

  describe("type: customers", () => {
    const customersData = [
      {
        name: "Alice Bekele",
        email: "alice@example.com",
        bookings: 8,
        spent: 2400,
        lastVisit: "2027-06-10",
      },
      {
        name: null,
        email: "unknown@example.com",
        bookings: 1,
        spent: 150,
        lastVisit: "2027-05-20",
      },
    ];

    it("maps each item to the correct columns", () => {
      const { data } = formatAnalyticsForCSV(
        "customers",
        customersData,
        "Jun 2027"
      );
      expect(data[0]).toHaveProperty("Customer", "Alice Bekele");
      expect(data[0]).toHaveProperty("Email", "alice@example.com");
      expect(data[0]).toHaveProperty("Total Bookings", 8);
      expect(data[0]).toHaveProperty("Total Spent", "ETB 2400.00");
      expect(data[0]).toHaveProperty("Last Visit", "2027-06-10");
    });

    it("substitutes 'Unknown' when customer name is null", () => {
      const { data } = formatAnalyticsForCSV(
        "customers",
        customersData,
        "Jun 2027"
      );
      expect(data[1]).toHaveProperty("Customer", "Unknown");
    });

    it("formats spent amount with 2 decimal places", () => {
      const data2 = [
        {
          name: "Bob",
          email: "bob@example.com",
          bookings: 2,
          spent: 75.5,
          lastVisit: "2027-06-01",
        },
      ];
      const { data } = formatAnalyticsForCSV("customers", data2, "Jun 2027");
      expect(data[0]).toHaveProperty("Total Spent", "ETB 75.50");
    });

    it("generates a filename starting with 'customers-'", () => {
      const { filename } = formatAnalyticsForCSV(
        "customers",
        customersData,
        "Jun 2027"
      );
      expect(filename.startsWith("customers-")).toBe(true);
    });

    it("returns empty data array for empty input", () => {
      const { data } = formatAnalyticsForCSV("customers", [], "Jun 2027");
      expect(data).toHaveLength(0);
    });
  });

  // ── filename sanitization (shared across types) ──────────────────────────

  describe("filename sanitization", () => {
    it("replaces spaces in dateRange with hyphens", () => {
      const { filename } = formatAnalyticsForCSV(
        "revenue",
        [{ date: "2027-06-01", revenue: 100 }],
        "Jun 2027"
      );
      expect(filename).not.toContain(" ");
    });

    it("replaces commas in dateRange with hyphens", () => {
      const { filename } = formatAnalyticsForCSV(
        "bookings",
        [{ date: "2027-06-01", count: 1 }],
        "Jan 1, 2027"
      );
      expect(filename).not.toContain(",");
    });
  });
});
