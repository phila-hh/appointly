/**
 * @file Dashboard Bookings Page
 * @description Incoming booking management for business owners.
 *
 * Features:
 *   - Overdue bookings alert — banner shown when past confirmed bookings
 *     have not been marked complete or no-show
 *   - Status filter (All, Pending, Confirmed, etc.)
 *   - Staff filter — filter bookings by assigned team member
 *   - Assigned staff name shown on each booking card
 *   - Returning customer badge when customer has 3+ bookings at this business
 *   - Reuses BookingList component with BUSINESS_OWNER role config
 *
 * URL: /dashboard/bookings
 */

import { Suspense } from "react";
import { format, startOfDay } from "date-fns";

import { requireBusiness } from "@/lib/actions/business-queries";
import { getBusinessBookings } from "@/lib/actions/booking-queries";
import { getBusinessStaff } from "@/lib/actions/staff-queries";
import db from "@/lib/db";
import { BookingList } from "@/components/shared/booking-list";
import { StaffBookingFilter } from "@/components/shared/staff-booking-filter";
import { OverdueBookingsAlert } from "@/components/shared/overdue-bookings-alert";

export const metadata = {
  title: "Bookings",
};

interface DashboardBookingsPageProps {
  searchParams: Promise<{ status?: string; staffId?: string }>;
}

export default async function DashboardBookingsPage({
  searchParams,
}: DashboardBookingsPageProps) {
  const business = await requireBusiness();
  const params = await searchParams;

  // Fetch bookings, staff, and overdue count in parallel
  const [bookings, staff, overdueCount] = await Promise.all([
    getBusinessBookings(params.status, params.staffId),
    getBusinessStaff(),
    // Count confirmed bookings whose date has passed (before today's start)
    db.booking.count({
      where: {
        businessId: business.id,
        status: "CONFIRMED",
        date: { lt: startOfDay(new Date()) },
      },
    }),
  ]);

  const hasStaff = staff.length > 0;

  const serializedStaff = staff.map((member) => ({
    id: member.id,
    name: member.name,
    title: member.title,
  }));

  const serializedBookings = bookings.map((booking) => ({
    id: booking.id,
    date: format(booking.date, "yyyy-MM-dd"),
    startTime: booking.startTime,
    endTime: booking.endTime,
    status: booking.status,
    totalPrice: Number(booking.totalPrice),
    notes: booking.notes,
    createdAt: booking.createdAt.toISOString(),
    cancellationDeadline: booking.cancellationDeadline?.toISOString() ?? null,
    rescheduleCount: booking.rescheduleCount,
    business: {
      id: "",
      name: "",
      slug: "",
      image: null,
    },
    service: {
      id: "",
      name: booking.service.name,
      duration: booking.service.duration,
    },
    staff: booking.staff
      ? {
          id: booking.staff.id,
          name: booking.staff.name,
          title: booking.staff.title,
        }
      : null,
    hasReview: false,
    isReturningCustomer: booking.isReturningCustomer,
    customer: {
      name: booking.customer.name,
      email: booking.customer.email,
      phone: booking.customer.phone,
    },
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Bookings</h2>
        <p className="text-muted-foreground">
          View and manage your incoming appointment bookings.
        </p>
      </div>

      {/* Overdue bookings alert — rendered above all filters */}
      <OverdueBookingsAlert count={overdueCount} />

      {/* Staff filter */}
      {hasStaff && (
        <StaffBookingFilter
          staffMembers={serializedStaff}
          currentStaffId={params.staffId}
        />
      )}

      <Suspense>
        <BookingList bookings={serializedBookings} userRole="BUSINESS_OWNER" />
      </Suspense>
    </div>
  );
}
