/**
 * @file Dashboard Bookings Page
 * @description Incoming booking management for business owners.
 *
 * Features:
 *   - Status filter (All, Pending, Confirmed, etc.)
 *   - Staff filter — filter bookings by assigned team member
 *   - Assigned staff name shown on each booking card
 *   - Returning customer badge when customer has 3+ bookings at this business
 *   - Overdue bookings alert for past confirmed appointments
 *   - Reuses BookingList component with BUSINESS_OWNER role config
 *
 * URL: /dashboard/bookings
 */

import { Suspense } from "react";
import { format } from "date-fns";

import { requireBusiness } from "@/lib/actions/business-queries";
import { getBusinessBookings } from "@/lib/actions/booking-queries";
import { getBusinessStaff } from "@/lib/actions/staff-queries";
import { BookingList } from "@/components/shared/booking-list";
import { StaffBookingFilter } from "@/components/shared/staff-booking-filter";

export const metadata = {
  title: "Bookings",
};

interface DashboardBookingsPageProps {
  searchParams: Promise<{ status?: string; staffId?: string }>;
}

export default async function DashboardBookingsPage({
  searchParams,
}: DashboardBookingsPageProps) {
  await requireBusiness();

  const params = await searchParams;

  const bookings = await getBusinessBookings(params.status, params.staffId);
  const staff = await getBusinessStaff();
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
    // Business owners do not need these for rescheduling (only customers reschedule)
    // but they are included for type consistency with BookingData
    cancellationDeadline: booking.cancellationDeadline?.toISOString() ?? null,
    rescheduleCount: booking.rescheduleCount,
    business: {
      id: "", // not needed — business owner is viewing their own business
      name: "",
      slug: "",
      image: null,
    },
    service: {
      id: "", // not needed — business owner does not reschedule
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
