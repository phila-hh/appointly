/**
 * @file Dashboard Overview Page (Analytics)
 * @description Comprehensive analytics dashboard for business owners.
 *
 * Features:
 *   - KPI cards with trends (revenue, bookings, customers, avg value)
 *   - Revenue charts (over time, by service, breakdown)
 *   - Booking charts (over time, status distribution, popularity)
 *   - Customer analytics (new vs returning, top customers)
 *   - Peak hours analysis (time distribution, day of week, heatmap)
 *   - Date range filtering
 *   - Export to CSV
 *
 * URL: /dashboard/overview
 */

import { DollarSign, Calendar, Users, TrendingUp } from "lucide-react";

import { requireBusiness } from "@/lib/actions/business-queries";
import {
  getMetricsComparison,
  getRevenueOverTime,
  getRevenueByService,
  getBookingsOverTime,
  getBookingStatusDistribution,
  getCustomerBreakdown,
  getTopCustomers,
  getPeakHours,
  getBookingsByDayOfWeek,
  getPeakHoursHeatmap,
} from "@/lib/actions/analytics-queries";
import {
  type DateRangePreset,
  getDateRangeForPreset,
  getComparisonPeriod,
} from "@/lib/date-utils";
import { formatPrice } from "@/lib/utils";
import { DateRangeFilter } from "@/components/shared/date-range-filter";
import { StatsGrid } from "@/components/shared/stats-grid";
import { KPICard } from "@/components/shared/kpi-card";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { ServiceRevenueChart } from "@/components/charts/service-revenue-chart";
import { RevenueBreakdownChart } from "@/components/charts/revenue-breakdown-chart";
import { BookingsChart } from "@/components/charts/bookings-chart";
import { BookingStatusChart } from "@/components/charts/booking-status-chart";
import { ServicePopularityChart } from "@/components/charts/service-popularity-chart";
import { CustomerMetrics } from "@/components/charts/customer-metrics";
import { TopCustomersList } from "@/components/charts/top-customers-list";
import { PeakHoursChart } from "@/components/charts/peak-hours-chart";
import { DayOfWeekChart } from "@/components/charts/day-of-week-chart";
import { PeakHoursHeatmap } from "@/components/charts/peak-hours-heatmap";
import { ExportButton } from "@/components/shared/export-button";
import { formatDateRange } from "@/lib/date-utils";

export const metadata = {
  title: "Analytics Overview",
};

interface OverviewPageProps {
  searchParams: Promise<{
    range?: DateRangePreset;
    from?: string;
    to?: string;
  }>;
}

export default async function OverviewPage({
  searchParams,
}: OverviewPageProps) {
  await requireBusiness();
  const params = await searchParams;

  // Get date range from URL params
  const preset = (params.range as DateRangePreset) ?? "last30days";
  const customFrom = params.from ? new Date(params.from) : undefined;
  const customTo = params.to ? new Date(params.to) : undefined;

  const { start: currentStart, end: currentEnd } = getDateRangeForPreset(
    preset,
    customFrom,
    customTo
  );
  const { start: previousStart, end: previousEnd } = getComparisonPeriod(
    currentStart,
    currentEnd
  );

  // Fetch all analytics data
  const [
    metricsComparison,
    revenueOverTime,
    revenueByService,
    bookingsOverTime,
    bookingStatus,
    customerBreakdown,
    topCustomers,
    peakHours,
    dayOfWeek,
    heatmap,
  ] = await Promise.all([
    getMetricsComparison(currentStart, currentEnd, previousStart, previousEnd),
    getRevenueOverTime(currentStart, currentEnd, "day"),
    getRevenueByService(currentStart, currentEnd),
    getBookingsOverTime(currentStart, currentEnd, "day"),
    getBookingStatusDistribution(currentStart, currentEnd),
    getCustomerBreakdown(currentStart, currentEnd),
    getTopCustomers(currentStart, currentEnd, 10),
    getPeakHours(currentStart, currentEnd),
    getBookingsByDayOfWeek(currentStart, currentEnd),
    getPeakHoursHeatmap(currentStart, currentEnd),
  ]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Analytics Overview
          </h2>
          <p className="text-muted-foreground">
            Track your business performance and growth.
          </p>
        </div>

        <DateRangeFilter />
      </div>

      {/* KPI Cards */}
      <StatsGrid columns={4}>
        <KPICard
          title="Total Revenue"
          value={formatPrice(metricsComparison.current.revenue)}
          trend={metricsComparison.trends.revenue}
          icon={DollarSign}
          description="previous period"
        />
        <KPICard
          title="Total Bookings"
          value={metricsComparison.current.bookings}
          trend={metricsComparison.trends.bookings}
          icon={Calendar}
          description="previous period"
        />
        <KPICard
          title="Unique Customers"
          value={metricsComparison.current.customers}
          trend={metricsComparison.trends.customers}
          icon={Users}
          description="previous period"
        />
        <KPICard
          title="Avg Booking Value"
          value={formatPrice(metricsComparison.current.averageValue)}
          trend={metricsComparison.trends.averageValue}
          icon={TrendingUp}
          description="previous period"
        />
      </StatsGrid>

      {/* Revenue Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Revenue Analytics</h3>
          <ExportButton
            type="revenue"
            data={revenueOverTime}
            dateRange={formatDateRange(currentStart, currentEnd)}
          />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RevenueChart data={revenueOverTime} />
          </div>
          <RevenueBreakdownChart data={revenueByService} />
        </div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Service Performance</h3>
          <ExportButton
            type="services"
            data={revenueByService}
            dateRange={formatDateRange(currentStart, currentEnd)}
          />
        </div>
        <ServiceRevenueChart data={revenueByService} />
      </div>

      {/* Booking Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Booking Analytics</h3>
          <ExportButton
            type="bookings"
            data={bookingsOverTime}
            dateRange={formatDateRange(currentStart, currentEnd)}
          />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <BookingsChart data={bookingsOverTime} />
          </div>
          <BookingStatusChart data={bookingStatus} />
        </div>
        <ServicePopularityChart data={revenueByService} />
      </div>

      {/* Customer Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Customer Analytics</h3>
          <ExportButton
            type="customers"
            data={topCustomers.map((c) => ({
              name: c.name ?? "",
              email: c.email,
              bookings: c.bookingCount,
              spent: c.totalSpent,
              lastVisit: "",
            }))}
            dateRange={formatDateRange(currentStart, currentEnd)}
          />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <CustomerMetrics
            newCustomers={customerBreakdown.newCustomers}
            returningCustomers={customerBreakdown.returningCustomers}
          />
          <div className="lg:col-span-2">
            <TopCustomersList customers={topCustomers} />
          </div>
        </div>
      </div>

      {/* Peak Hours Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Peak Hours Analysis</h3>
        <PeakHoursHeatmap data={heatmap} />
        <div className="grid gap-6 lg:grid-cols-2">
          <PeakHoursChart data={peakHours} />
          <DayOfWeekChart data={dayOfWeek} />
        </div>
      </div>
    </div>
  );
}
