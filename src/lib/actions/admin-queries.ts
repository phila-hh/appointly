// src/lib/actions/admin-queries.ts

/**
 * @file Admin Query Functions
 * @description Server-side data fetching for the admin panel pages.
 *
 * These are NOT server actions (they don't mutate data).
 * They are plain async functions called from Server Components.
 * Every function calls requireAdmin() to enforce role-based access.
 *
 * Separated from admin.ts (mutations) to maintain the clear
 * query / mutation distinction used throughout the project.
 *
 * Provides:
 *   - Platform overview stats (KPIs for the overview dashboard)
 *   - User listing with search and role/status filtering
 *   - User detail with activity counts and linked business
 *   - Business listing with search and status filtering
 *   - Business detail with services, hours, and owner info
 *   - Review listing with search and rating filtering
 *   - Audit log entries with admin info
 */

import { notFound } from "next/navigation";

import db from "@/lib/db";
import { requireAdmin } from "@/lib/guards";

// =============================================================================
// Platform Overview
// =============================================================================

/**
 * Fetches platform-wide KPI data for the admin overview dashboard.
 *
 * Runs all queries in parallel for performance.
 *
 * @returns Aggregated platform metrics and current settings
 */
export async function getAdminPlatformOverview() {
  await requireAdmin();

  const [
    totalUsers,
    activeUsers,
    totalBusinesses,
    activeBusinesses,
    totalBookings,
    completedBookings,
    revenue,
    settings,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { emailVerified: { not: null } } }),
    db.business.count(),
    db.business.count({ where: { isActive: true } }),
    db.booking.count(),
    db.booking.count({ where: { status: "COMPLETED" } }),
    db.payment.aggregate({
      _sum: { amount: true },
      where: { status: "SUCCEEDED" },
    }),
    db.platformSettings.findFirst(),
  ]);

  return {
    totalUsers,
    activeUsers,
    totalBusinesses,
    activeBusinesses,
    totalBookings,
    completedBookings,
    grossRevenue: Number(revenue._sum.amount ?? 0),
    settings,
  };
}

// =============================================================================
// User Management Queries
// =============================================================================

/**
 * Fetches all users with optional search and filter parameters.
 *
 * Supports:
 *   - Name and email search (case-insensitive partial match)
 *   - Role filter (exact match against enum)
 *   - Status filter (ACTIVE = emailVerified is set, SUSPENDED = null)
 *
 * Includes the user's linked business (if they are a BUSINESS_OWNER)
 * for display in the users table.
 *
 * @param params - Optional search, role, and status filters
 * @returns Array of user records ordered by creation date (newest first)
 */
export async function getAdminUsers(params?: {
  search?: string;
  role?: "CUSTOMER" | "BUSINESS_OWNER" | "ADMIN";
  status?: "ACTIVE" | "SUSPENDED";
}) {
  await requireAdmin();

  const search = params?.search?.trim();

  // Normalize the role filter — "ALL" from the Select component means no filter
  const roleFilter =
    params?.role && params.role !== ("ALL" as string)
      ? { role: params.role }
      : {};

  // Normalize the status filter
  const statusFilter =
    params?.status === "ACTIVE"
      ? { emailVerified: { not: null } }
      : params?.status === "SUSPENDED"
        ? { emailVerified: null }
        : {};

  // Text search across name and email
  const searchFilter = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  return db.user.findMany({
    where: {
      ...roleFilter,
      ...statusFilter,
      ...searchFilter,
    },
    include: {
      business: {
        select: { id: true, name: true, isActive: true, slug: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Fetches a single user by ID with full detail for the admin user
 * detail page.
 *
 * Includes:
 *   - Activity counts (bookings, reviews, favorites)
 *   - Linked business profile with its own counts (if BUSINESS_OWNER)
 *
 * Calls notFound() if the user does not exist, triggering Next.js's
 * 404 page automatically.
 *
 * @param userId - The user's ID
 * @returns Full user record with counts and linked business
 */
export async function getAdminUserDetail(userId: string) {
  await requireAdmin();

  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      business: {
        include: {
          _count: {
            select: {
              services: true,
              bookings: true,
              reviews: true,
            },
          },
        },
      },
      _count: {
        select: {
          bookings: true,
          reviews: true,
          favorites: true,
        },
      },
    },
  });

  if (!user) notFound();

  return user;
}

// =============================================================================
// Business Management Queries
// =============================================================================

/**
 * Fetches all businesses with optional search and status filtering.
 *
 * Supports:
 *   - Name, city, and owner email search (case-insensitive partial match)
 *   - Status filter (ACTIVE = isActive true, SUSPENDED = false)
 *
 * Includes owner info for display in the businesses table.
 *
 * @param params - Optional search and status filters
 * @returns Array of business records ordered by creation date (newest first)
 */
export async function getAdminBusinesses(params?: {
  search?: string;
  status?: "ACTIVE" | "SUSPENDED";
}) {
  await requireAdmin();

  const search = params?.search?.trim();

  // Normalize the status filter — "ALL" from the Select means no filter
  const statusFilter =
    params?.status && params.status !== ("ALL" as string)
      ? { isActive: params.status === "ACTIVE" }
      : {};

  // Text search across business name, city, and owner email
  const searchFilter = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { city: { contains: search, mode: "insensitive" as const } },
          {
            owner: {
              email: { contains: search, mode: "insensitive" as const },
            },
          },
        ],
      }
    : {};

  return db.business.findMany({
    where: {
      ...statusFilter,
      ...searchFilter,
    },
    include: {
      owner: {
        select: { id: true, name: true, email: true, role: true },
      },
      _count: {
        select: {
          services: true,
          bookings: true,
          reviews: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Fetches a single business by ID with full detail for the admin
 * business detail page.
 *
 * Includes:
 *   - Owner info with creation date
 *   - All services (active and inactive) sorted by creation date
 *   - Business hours for all 7 days
 *   - Activity counts (bookings, reviews, favorites, services)
 *
 * Calls notFound() if the business does not exist.
 *
 * @param businessId - The business's ID
 * @returns Full business record with owner, services, and hours
 */
export async function getAdminBusinessDetail(businessId: string) {
  await requireAdmin();

  const business = await db.business.findUnique({
    where: { id: businessId },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      },
      services: {
        // Include all services regardless of isActive for admin visibility
        orderBy: { createdAt: "desc" },
      },
      BusinessHours: {
        orderBy: { dayOfWeek: "asc" },
      },
      _count: {
        select: {
          bookings: true,
          reviews: true,
          favorites: true,
          services: true,
        },
      },
    },
  });

  if (!business) notFound();

  return business;
}

// =============================================================================
// Review Moderation Queries
// =============================================================================

/**
 * Fetches all reviews with optional search and rating filtering.
 *
 * Supports:
 *   - Comment content, business name, and customer email search
 *   - Minimum rating filter (e.g., minRating=4 returns 4 and 5 star reviews)
 *
 * Includes:
 *   - Business info (name, slug for public page link)
 *   - Customer info (name, email)
 *   - Linked booking (date, time, status)
 *   - AI sentiment fields (sentimentLabel, sentimentScore) from Phase 16A
 *
 * @param params - Optional search and minimum rating filters
 * @returns Array of review records ordered by creation date (newest first)
 */
export async function getAdminReviews(params?: {
  search?: string;
  minRating?: number;
}) {
  await requireAdmin();

  const search = params?.search?.trim();

  // Validate minRating — ignore if it would filter nothing or everything
  const ratingFilter =
    params?.minRating &&
    params.minRating >= 1 &&
    params.minRating <= 5 &&
    params.minRating !== ("ALL" as unknown as number)
      ? { rating: { gte: params.minRating } }
      : {};

  const searchFilter = search
    ? {
        OR: [
          { comment: { contains: search, mode: "insensitive" as const } },
          {
            business: {
              name: { contains: search, mode: "insensitive" as const },
            },
          },
          {
            customer: {
              email: { contains: search, mode: "insensitive" as const },
            },
          },
          {
            customer: {
              name: { contains: search, mode: "insensitive" as const },
            },
          },
        ],
      }
    : {};

  return db.review.findMany({
    where: {
      ...ratingFilter,
      ...searchFilter,
    },
    include: {
      business: {
        select: { id: true, name: true, slug: true },
      },
      customer: {
        select: { id: true, name: true, email: true },
      },
      booking: {
        select: { id: true, date: true, startTime: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

// =============================================================================
// Audit Log Queries
// =============================================================================

/**
 * Fetches recent admin audit log entries.
 *
 * The audit log is append-only — entries are never updated or deleted.
 * This function is read-only and supports optional entity type filtering
 * which is applied at the call site (audit-log page) for flexibility.
 *
 * @param limit - Maximum number of entries to return (default: 200)
 * @returns Array of audit log entries with admin info, newest first
 */
export async function getAdminAuditLogs(limit = 200) {
  await requireAdmin();

  return db.adminAuditLog.findMany({
    take: limit,
    include: {
      admin: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
