import { notFound } from "next/navigation";

import db from "@/lib/db";
import { requireAdmin } from "@/lib/guards";

export async function getAdminPlatformOverview() {
  await requireAdmin();

  const [totalUsers, totalBusinesses, totalBookings, revenue, settings] =
    await Promise.all([
      db.user.count(),
      db.business.count(),
      db.booking.count(),
      db.payment.aggregate({
        _sum: { amount: true },
        where: { status: "SUCCEEDED" },
      }),
      db.platformSettings.findFirst(),
    ]);

  return {
    totalUsers,
    totalBusinesses,
    totalBookings,
    grossRevenue: Number(revenue._sum.amount ?? 0),
    settings,
  };
}

export async function getAdminUsers(params?: {
  search?: string;
  role?: "CUSTOMER" | "BUSINESS_OWNER" | "ADMIN";
  status?: "ACTIVE" | "SUSPENDED";
}) {
  await requireAdmin();
  const search = params?.search?.trim();

  return db.user.findMany({
    where: {
      ...(params?.role ? { role: params.role } : {}),
      ...(params?.status === "ACTIVE"
        ? { emailVerified: { not: null } }
        : params?.status === "SUSPENDED"
          ? { emailVerified: null }
          : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      business: {
        select: { id: true, name: true, isActive: true, slug: true },
      },
    },
  });
}

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

export async function getAdminBusinesses(params?: {
  search?: string;
  status?: "ACTIVE" | "SUSPENDED";
}) {
  await requireAdmin();
  const search = params?.search?.trim();

  return db.business.findMany({
    where: {
      ...(params?.status ? { isActive: params.status === "ACTIVE" } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { city: { contains: search, mode: "insensitive" } },
              { owner: { email: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
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

export async function getAdminReviews(params?: {
  search?: string;
  minRating?: number;
}) {
  await requireAdmin();
  const search = params?.search?.trim();

  return db.review.findMany({
    where: {
      ...(params?.minRating ? { rating: { gte: params.minRating } } : {}),
      ...(search
        ? {
            OR: [
              { comment: { contains: search, mode: "insensitive" } },
              { business: { name: { contains: search, mode: "insensitive" } } },
              {
                customer: { email: { contains: search, mode: "insensitive" } },
              },
            ],
          }
        : {}),
    },
    include: {
      business: { select: { id: true, name: true, slug: true } },
      customer: { select: { id: true, name: true, email: true } },
      booking: {
        select: { id: true, date: true, startTime: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

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
