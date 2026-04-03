/**
 * @file Dashboard Bookings Page
 * @description Incoming booking management for business owners.
 *
 * Reuses the BookingList component with BUSINESS_OWNER role config,
 * which allows confirm/complete/cancel/no-show action buttons.
 *
 * URL: /dashboard/bookings
 */

import { Suspense } from "react";

import { requireBusiness } from "@/lib/actions/business-queries";
import { getBusinessBookings } from "@/lib/actions/booking-queries";
import { BookingList } from "@/components/shared/booking-list";

export const metadata = {
  title: "Bookings",
};

interface DashboardBookingsPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function DashboardBookingsPage({
  searchParams,
}: DashboardBookingsPageProps) {
  await requireBusiness();

  const params = await searchParams;
  const bookings = await getBusinessBookings(params.status);

  // Serialize bookings for client component
  const serializedBookings = bookings.map((booking) => ({
    id: booking.id,
    date: booking.date.toISOString(),
    startTime: booking.startTime,
    endTime: booking.endTime,
    status: booking.status,
    totalPrice: Number(booking.totalPrice),
    notes: booking.notes,
    createdAt: booking.createdAt.toISOString(),
    business: {
      name: "",
      slug: "",
      image: null,
    },
    service: {
      name: booking.service.name,
      duration: booking.service.duration,
    },
    hasReview: false,
    customer: {
      name: booking.customer.name,
      email: booking.customer.email,
      phone: booking.customer.email,
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

      <Suspense>
        <BookingList bookings={serializedBookings} userRole="BUSINESS_OWNER" />
      </Suspense>
    </div>
  );
}
