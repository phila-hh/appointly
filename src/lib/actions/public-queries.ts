/**
 * @file Public Query Functions
 * @description Server-side data fetching for public (customer-facing) pages.
 *
 * These functions power the browse page and business detail pages.
 * They are NOT server actions (no "use server" — they don't mutate data).
 * They are plain async functions called from Server Components.
 *
 * All queries filter for active businesses only (isActive = true)
 * and active services only, ensuring deactivated content is never
 * shown to customers.
 */

import db from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

/** Number of businesses to display per page. */
const BUSINESSES_PER_PAGE = 9;

/** Parameters for the browse businesses query. */
export interface BrowseBusinessesParams {
  /** Filter by business category (e.g., "BARBERSHOP") */
  category?: string;
  /** Filter by city name (case-insensitive partial match) */
  city?: string;
  /** Search query matching business name (case-insensitive partial match) */
  search?: string;
  /** Page number for pagination (1-based) */
  page?: number;
}

/** Business type for browse results with count and review ratings. */
type BrowseBusinessesItem = Prisma.BusinessGetPayload<{
  include: {
    _count: {
      select: {
        services: { where: { isActive: true } };
        reviews: true;
      };
    };
    reviews: {
      select: { rating: true };
    };
  };
}>;

/** Return type for the browse businesses query. */
export interface BrowseBusinessesResult {
  /** Array of business records for the current page */
  businesses: BrowseBusinessesItem[];
  /** Total number of businesses matching the filters (for pagination) */
  totalCount: number;
  /** Total number of pages */
  totalPages: number;
  /** Current page number */
  currentPage: number;
}

/**
 * Fetches a paginated, filtered list of active businesses.
 *
 * Supports:
 *   - Category filtering (exact match against enum)
 *   - City filtering (case-insensitive partial match)
 *   - Name search (case-insensitive partial match)
 *   - Pagination (9 businesses per page)
 *
 * Results include the count of active services and the average review
 * rating for each business, enabling display of summary statistics
 * on the listing cards.
 *
 * @param params - Filter, search, and pagination parameters
 * @returns Paginated business list with metadata
 */
export async function browseBusinesses(
  params: BrowseBusinessesParams
): Promise<BrowseBusinessesResult> {
  const { category, city, search, page = 1 } = params;

  // Build the WHERE clause dynamically based on provided filters
  const where: Prisma.BusinessWhereInput = {
    isActive: true, // Never show inactive businesses
  };

  if (category && category !== "ALL") {
    where.category = category as Prisma.EnumBusinessCategoryFilter;
  }

  if (city) {
    where.city = {
      contains: city,
      mode: "insensitive", // Case-insensitive matching
    };
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  // Get total count for pagination
  const totalCount = await db.business.count({ where });
  const totalPages = Math.ceil(totalCount / BUSINESSES_PER_PAGE);

  // Clamp the page number to valid range
  const currentPage = Math.max(1, Math.min(page, totalPages || 1));
  const skip = (currentPage - 1) * BUSINESSES_PER_PAGE;

  // Fetch businesses with related data counts
  const businesses = await db.business.findMany({
    where,
    include: {
      _count: {
        select: {
          services: { where: { isActive: true } }, // Count only active services
          reviews: true, // Count all reviews
        },
      },
      reviews: {
        select: { rating: true }, // Fetch ratings for average calculation
      },
    },
    orderBy: { createdAt: "desc" }, // Newest businesses first
    skip,
    take: BUSINESSES_PER_PAGE,
  });

  return {
    businesses,
    totalCount,
    totalPages,
    currentPage,
  };
}

/**
 * Fetches a single business by its URL slug with all public-facing data.
 *
 * Includes:
 *   - Business profile information
 *   - Active services (sorted by price)
 *   - Business hours (all 7 days)
 *   - Customer reviews with reviewer names (newest first)
 *
 * @param slug - The URL-friendly business identifier
 * @returns The business with all related data, or null if not found/inactive
 */
export async function getBusinessBySlug(slug: string) {
  const business = await db.business.findUnique({
    where: {
      slug,
      isActive: true, // Don't show inactive businesses
    },
    include: {
      services: {
        where: { isActive: true }, // Only active services
        orderBy: { price: "asc" }, // Cheapest first
      },
      BusinessHours: {
        orderBy: { dayOfWeek: "asc" },
      },
      reviews: {
        include: {
          customer: {
            select: {
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "desc" }, // Newest reviews first
      },
      _count: {
        select: {
          reviews: true,
          bookings: true,
        },
      },
    },
  });

  return business;
}

/**
 * Fetches all distinct cities that have at least one active business.
 * Used to populate the city filter dropdown on the browse page.
 *
 * @returns Array of unique city names, sorted alphabetically
 */
export async function getAvailableCities(): Promise<string[]> {
  const cities = await db.business.findMany({
    where: {
      isActive: true,
      city: { not: null },
    },
    select: { city: true },
    distinct: ["city"],
    orderBy: { city: "asc" },
  });

  return cities
    .map((b) => b.city)
    .filter((city): city is string => city !== null);
}
