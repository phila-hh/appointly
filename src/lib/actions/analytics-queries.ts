/**
 * @file Analytics Query Helpers
 * @description Complex database queries for business analytics dashboard.
 *
 * Provides:
 *   - Revenue metrics (total, average, trends)
 *   - Booking statistics (counts, status distribution, trends)
 *   - Service performance (revenue per service, popularity)
 *   - Customer analytics (new vs returning, retention)
 *   - Time-based grouping (daily, weekly, monthly)
 *   - Peak hours analysis
 *
 * All queries are scoped to the current business owner's business.
 */

import { startOfDay, endOfDay, format } from "date-fns";

import db from "@/lib/db";
import { Prisma, BookingStatus } from "@/generated/prisma/client";
import { getCurrentUser } from "@/lib/session";

/**
 * Helper: Get the current business owner's business ID.
 * Returns null if not authenticated or no business exists.
 */
async function getBusinessId(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== "BUSINESS_OWNER") return null;

  const business = await db.business.findUnique({
    where: { ownerId: user.id },
    select: { id: true },
  });

  return business?.id ?? null;
}

/**
 * Gets total revenue for a date range.
 *
 * Only counts COMPLETED bookings with SUCCEEDED payments.
 *
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @returns Total revenue as a number
 */
export async function getTotalRevenue(
  startDate: Date,
  endDate: Date
): Promise<number> {
  const businessId = await getBusinessId();
  if (!businessId) return 0;

  const result = await db.booking.aggregate({
    where: {
      businessId,
      status: "COMPLETED",
      date: {
        gte: startOfDay(startDate),
        lte: endOfDay(endDate),
      },
      payment: {
        status: "SUCCEEDED",
      },
    },
    _sum: {
      totalPrice: true,
    },
  });

  return result._sum.totalPrice ? Number(result._sum.totalPrice) : 0;
}

/**
 * Gets total number of bookings for a date range.
 *
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @param status - Optional status filter
 * @returns Booking count
 */
export async function getTotalBookings(
  startDate: Date,
  endDate: Date,
  status?: BookingStatus
): Promise<number> {
  const businessId = await getBusinessId();
  if (!businessId) return 0;

  const where: Prisma.BookingWhereInput = {
    businessId,
    date: {
      gte: startOfDay(startDate),
      lte: endOfDay(endDate),
    },
    ...(status && { status }),
  };

  return db.booking.count({ where });
}

/**
 * Gets unique customer count for a date range.
 *
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @returns Count of unique customers
 */
export async function getUniqueCustomers(
  startDate: Date,
  endDate: Date
): Promise<number> {
  const businessId = await getBusinessId();
  if (!businessId) return 0;

  const bookings = await db.booking.findMany({
    where: {
      businessId,
      date: {
        gte: startOfDay(startDate),
        lte: endOfDay(endDate),
      },
    },
    select: {
      customerId: true,
    },
    distinct: ["customerId"],
  });

  return bookings.length;
}

/**
 * Gets average booking value (revenue per booking).
 *
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @returns Average booking value
 */
export async function getAverageBookingValue(
  startDate: Date,
  endDate: Date
): Promise<number> {
  const businessId = await getBusinessId();
  if (!businessId) return 0;

  const result = await db.booking.aggregate({
    where: {
      businessId,
      status: "COMPLETED",
      date: {
        gte: startOfDay(startDate),
        lte: endOfDay(endDate),
      },
      payment: {
        status: "SUCCEEDED",
      },
    },
    _avg: {
      totalPrice: true,
    },
  });

  return result._avg.totalPrice ? Number(result._avg.totalPrice) : 0;
}

/**
 * Gets revenue grouped by date for time-series charts.
 *
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @param groupBy - Grouping interval ('day' | 'week' | 'month')
 * @returns Array of { date: string, revenue: number }
 */
export async function getRevenueOverTime(
  startDate: Date,
  endDate: Date,
  groupBy: "day" | "week" | "month" = "day"
): Promise<Array<{ date: string; revenue: number }>> {
  const businessId = await getBusinessId();
  if (!businessId) return [];

  const bookings = await db.booking.findMany({
    where: {
      businessId,
      status: "COMPLETED",
      date: {
        gte: startOfDay(startDate),
        lte: endOfDay(endDate),
      },
      payment: {
        status: "SUCCEEDED",
      },
    },
    select: {
      date: true,
      totalPrice: true,
    },
    orderBy: {
      date: "asc",
    },
  });

  // Group by date
  const grouped = new Map<string, number>();

  bookings.forEach((booking) => {
    let key: string;

    if (groupBy === "day") {
      key = format(booking.date, "yyyy-MM-dd");
    } else if (groupBy === "week") {
      // Group by week start (Monday)
      const weekStart = startOfDay(booking.date);
      weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
      key = format(weekStart, "yyyy-MM-dd");
    } else {
      // Group by month
      key = format(booking.date, "yyyy-MM");
    }

    const current = grouped.get(key) ?? 0;
    grouped.set(key, current + Number(booking.totalPrice));
  });

  return Array.from(grouped.entries())
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Gets bookings grouped by date for trend charts.
 *
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @param groupBy - Grouping interval
 * @returns Array of { date: string, count: number }
 */
export async function getBookingsOverTime(
  startDate: Date,
  endDate: Date,
  groupBy: "day" | "week" | "month" = "day"
): Promise<Array<{ date: string; count: number }>> {
  const businessId = await getBusinessId();
  if (!businessId) return [];

  const bookings = await db.booking.findMany({
    where: {
      businessId,
      date: {
        gte: startOfDay(startDate),
        lte: endOfDay(endDate),
      },
    },
    select: {
      date: true,
    },
    orderBy: {
      date: "asc",
    },
  });

  // Group by date
  const grouped = new Map<string, number>();

  bookings.forEach((booking) => {
    let key: string;

    if (groupBy === "day") {
      key = format(booking.date, "yyyy-MM-dd");
    } else if (groupBy === "week") {
      const weekStart = startOfDay(booking.date);
      weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
      key = format(weekStart, "yyyy-MM-dd");
    } else {
      key = format(booking.date, "yyyy-MM");
    }

    const current = grouped.get(key) ?? 0;
    grouped.set(key, current + 1);
  });

  return Array.from(grouped.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Gets booking status distribution.
 *
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @returns Object with count for each status
 */
export async function getBookingStatusDistribution(
  startDate: Date,
  endDate: Date
): Promise<Record<string, number>> {
  const businessId = await getBusinessId();
  if (!businessId) return {};

  const bookings = await db.booking.groupBy({
    by: ["status"],
    where: {
      businessId,
      date: {
        gte: startOfDay(startDate),
        lte: endOfDay(endDate),
      },
    },
    _count: {
      status: true,
    },
  });

  const distribution: Record<string, number> = {};
  bookings.forEach((item) => {
    distribution[item.status] = item._count.status;
  });

  return distribution;
}

/**
 * Gets revenue by service.
 *
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @returns Array of { serviceName: string, revenue: number, bookings: number }
 */
export async function getRevenueByService(
  startDate: Date,
  endDate: Date
): Promise<Array<{ serviceName: string; revenue: number; bookings: number }>> {
  const businessId = await getBusinessId();
  if (!businessId) return [];

  const bookings = await db.booking.findMany({
    where: {
      businessId,
      status: "COMPLETED",
      date: {
        gte: startOfDay(startDate),
        lte: endOfDay(endDate),
      },
      payment: {
        status: "SUCCEEDED",
      },
    },
    include: {
      service: {
        select: {
          name: true,
        },
      },
    },
  });

  // Group by service
  const grouped = new Map<string, { revenue: number; count: number }>();

  bookings.forEach((booking) => {
    const serviceName = booking.service.name;
    const current = grouped.get(serviceName) ?? { revenue: 0, count: 0 };

    grouped.set(serviceName, {
      revenue: current.revenue + Number(booking.totalPrice),
      count: current.count + 1,
    });
  });

  return Array.from(grouped.entries())
    .map(([serviceName, data]) => ({
      serviceName,
      revenue: data.revenue,
      bookings: data.count,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

/**
 * Gets new vs returning customer breakdown.
 *
 * A customer is "new" if this is their first completed booking in the date range.
 *
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @returns { newCustomers: number, returningCustomers: number }
 */
export async function getCustomerBreakdown(
  startDate: Date,
  endDate: Date
): Promise<{ newCustomers: number; returningCustomers: number }> {
  const businessId = await getBusinessId();
  if (!businessId) {
    return { newCustomers: 0, returningCustomers: 0 };
  }

  // Get all completed bookings in range
  const bookingsInRange = await db.booking.findMany({
    where: {
      businessId,
      status: "COMPLETED",
      date: {
        gte: startOfDay(startDate),
        lte: endOfDay(endDate),
      },
    },
    select: {
      customerId: true,
    },
  });

  const customerIds = new Set(bookingsInRange.map((b) => b.customerId));

  let newCustomers = 0;
  let returningCustomers = 0;

  // For each customer, check if they had bookings before this date range
  for (const customerId of customerIds) {
    const previousBookings = await db.booking.count({
      where: {
        businessId,
        customerId,
        status: "COMPLETED",
        date: {
          lt: startOfDay(startDate),
        },
      },
    });

    if (previousBookings === 0) {
      newCustomers++;
    } else {
      returningCustomers++;
    }
  }

  return { newCustomers, returningCustomers };
}

/**
 * Gets peak hours distribution (bookings by hour of day).
 *
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @returns Array of { hour: number, count: number }
 */
export async function getPeakHours(
  startDate: Date,
  endDate: Date
): Promise<Array<{ hour: number; count: number }>> {
  const businessId = await getBusinessId();
  if (!businessId) return [];

  const bookings = await db.booking.findMany({
    where: {
      businessId,
      date: {
        gte: startOfDay(startDate),
        lte: endOfDay(endDate),
      },
    },
    select: {
      startTime: true,
    },
  });

  // Count by hour
  const hourCounts = new Map<number, number>();

  bookings.forEach((booking) => {
    const hour = parseInt(booking.startTime.split(":")[0]);
    hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
  });

  return Array.from(hourCounts.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => a.hour - b.hour);
}

/**
 * Gets bookings by day of week.
 *
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @returns Array of { dayOfWeek: string, count: number }
 */
export async function getBookingsByDayOfWeek(
  startDate: Date,
  endDate: Date
): Promise<Array<{ dayOfWeek: string; count: number }>> {
  const businessId = await getBusinessId();
  if (!businessId) return [];

  const bookings = await db.booking.findMany({
    where: {
      businessId,
      date: {
        gte: startOfDay(startDate),
        lte: endOfDay(endDate),
      },
    },
    select: {
      date: true,
    },
  });

  // Count by day of week
  const dayCounts = new Map<string, number>();
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  bookings.forEach((booking) => {
    const dayIndex = booking.date.getDay();
    const dayName = dayNames[dayIndex];
    dayCounts.set(dayName, (dayCounts.get(dayName) ?? 0) + 1);
  });

  // Return in order (Monday first)
  const orderedDays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  return orderedDays.map((day) => ({
    dayOfWeek: day,
    count: dayCounts.get(day) ?? 0,
  }));
}

/**
 * Gets comprehensive KPI metrics for a date range.
 *
 * Returns all key metrics needed for the dashboard overview.
 *
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @returns Object with all KPI metrics
 */
export async function getKPIMetrics(
  startDate: Date,
  endDate: Date
): Promise<{
  revenue: number;
  bookings: number;
  customers: number;
  averageValue: number;
}> {
  const [revenue, bookings, customers, averageValue] = await Promise.all([
    getTotalRevenue(startDate, endDate),
    getTotalBookings(startDate, endDate),
    getUniqueCustomers(startDate, endDate),
    getAverageBookingValue(startDate, endDate),
  ]);

  return {
    revenue,
    bookings,
    customers,
    averageValue,
  };
}

/**
 * Gets metrics comparison between current and previous period.
 *
 * Calculates percentage changes for all KPIs.
 *
 * @param currentStart - Current period start
 * @param currentEnd - Current period end
 * @param previousStart - Previous period start
 * @param previousEnd - Previous period end
 * @returns Object with current metrics and percentage changes
 */
export async function getMetricsComparison(
  currentStart: Date,
  currentEnd: Date,
  previousStart: Date,
  previousEnd: Date
): Promise<{
  current: {
    revenue: number;
    bookings: number;
    customers: number;
    averageValue: number;
  };
  previous: {
    revenue: number;
    bookings: number;
    customers: number;
    averageValue: number;
  };
  trends: {
    revenue: number;
    bookings: number;
    customers: number;
    averageValue: number;
  };
}> {
  const [current, previous] = await Promise.all([
    getKPIMetrics(currentStart, currentEnd),
    getKPIMetrics(previousStart, previousEnd),
  ]);

  // Calculate percentage changes
  const calculateChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  return {
    current,
    previous,
    trends: {
      revenue: calculateChange(current.revenue, previous.revenue),
      bookings: calculateChange(current.bookings, previous.bookings),
      customers: calculateChange(current.customers, previous.customers),
      averageValue: calculateChange(
        current.averageValue,
        previous.averageValue
      ),
    },
  };
}

/**
 * Gets top customers by total spending.
 *
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @param limit - Number of customers to return
 * @returns Array of top customers with spending and booking count
 */
export async function getTopCustomers(
  startDate: Date,
  endDate: Date,
  limit: number = 10
): Promise<
  Array<{
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    totalSpent: number;
    bookingCount: number;
  }>
> {
  const businessId = await getBusinessId();
  if (!businessId) return [];

  // Get all completed bookings with customer info
  const bookings = await db.booking.findMany({
    where: {
      businessId,
      status: "COMPLETED",
      date: {
        gte: startOfDay(startDate),
        lte: endOfDay(endDate),
      },
      payment: {
        status: "SUCCEEDED",
      },
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  // Group by customer
  const customerMap = new Map<
    string,
    {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
      totalSpent: number;
      bookingCount: number;
    }
  >();

  bookings.forEach((booking) => {
    const customerId = booking.customer.id;
    const existing = customerMap.get(customerId);

    if (existing) {
      existing.totalSpent += Number(booking.totalPrice);
      existing.bookingCount += 1;
    } else {
      customerMap.set(customerId, {
        id: booking.customer.id,
        name: booking.customer.name,
        email: booking.customer.email,
        image: booking.customer.image,
        totalSpent: Number(booking.totalPrice),
        bookingCount: 1,
      });
    }
  });

  // Sort by total spent and return top N
  return Array.from(customerMap.values())
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, limit);
}

/**
 * Gets peak hours heatmap data (bookings by day AND hour).
 *
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @returns Array of { dayOfWeek, hour, count }
 */
export async function getPeakHoursHeatmap(
  startDate: Date,
  endDate: Date
): Promise<Array<{ dayOfWeek: string; hour: number; count: number }>> {
  const businessId = await getBusinessId();
  if (!businessId) return [];

  const bookings = await db.booking.findMany({
    where: {
      businessId,
      date: {
        gte: startOfDay(startDate),
        lte: endOfDay(endDate),
      },
    },
    select: {
      date: true,
      startTime: true,
    },
  });

  // Group by day of week AND hour
  const heatmapData = new Map<string, number>();
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  bookings.forEach((booking) => {
    const dayOfWeek = dayNames[booking.date.getDay()];
    const hour = parseInt(booking.startTime.split(":")[0]);
    const key = `${dayOfWeek}-${hour}`;

    heatmapData.set(key, (heatmapData.get(key) ?? 0) + 1);
  });

  // Convert to array format
  return Array.from(heatmapData.entries()).map(([key, count]) => {
    const [dayOfWeek, hourStr] = key.split("-");
    return {
      dayOfWeek,
      hour: parseInt(hourStr),
      count,
    };
  });
}
