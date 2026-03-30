/**
 * @file Business Query Helpers
 * @description Server-side data fetching functions for business data.
 *
 * These are NOT server actions (they don't mutate data).
 * They are plain async functions used by Server Components to fetch data.
 *
 * Separated from server actions to maintain clear distinction between
 * queries (reading data) and mutations (changing data).
 */

import { redirect } from "next/navigation";

import { Service } from "@/generated/prisma/client";
import db from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

/**
 * Retrieves the current user's business with all fields.
 * Redirects to /dashboard/setup if no business exists.
 *
 * Use this in dashboard pages that require a business to function.
 *
 * @returns The full business record
 */
export async function requireBusiness() {
  const user = await getCurrentUser();

  if (!user || user.role !== "BUSINESS_OWNER") {
    redirect("/sign-in");
  }

  const business = await db.business.findUnique({
    where: { ownerId: user.id },
  });

  if (!business) {
    redirect("/dashboard/setup");
  }

  return business;
}

/**
 * Retrieves all services for the current user's business.
 * Includes both active and inactive services, ordered by creation date.
 *
 * @returns Array of service records, or empty array if no business
 */
export async function getBusinessServices(): Promise<Service[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const business = await db.business.findUnique({
    where: { ownerId: user.id },
    select: { id: true },
  });

  if (!business) return [];

  return db.service.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
  });
}
