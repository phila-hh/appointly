/**
 * @file Customer Bookings Page
 * @description Show's the customers booking history with status filters.
 *
 * URL: /bookings
 */

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { format } from "date-fns";

import { getCurrentUser } from "@/lib/session";
import { getCustomerBookings } from "@/lib/actions/booking-queries";
import { BookingList } from "@/components/shared/booking-list";

export const metadata = {
  title: "My Bookings",
};

interface BookingPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function BookingPage({ searchParams }: BookingPageProps) {
  const user = getCurrentUser();
  if (!user) redirect("/sign-in");

  const params = await searchParams;
  const bookings = await getCustomerBookings(params.status);

  // Serialize bookings for client component
  const serializedBookings = bookings.map((booking) => ({
    id: booking.id,
    date: format(booking.date, "yyyy-MM-dd"),
    startTime: booking.startTime,
    endTime: booking.endTime,
    status: booking.status,
    totalPrice: Number(booking.totalPrice),
    notes: booking.notes,
    createdAt: booking.createdAt.toISOString(),
    business: booking.business,
    service: booking.service,
    hasReview: !!booking.review,
    isPaid: booking.payment?.status === "SUCCEEDED",
  }));

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
          <p className="mt-2 text-muted-foreground">
            View and manage your appointment bookings.
          </p>
        </div>

        <Suspense>
          <BookingList bookings={serializedBookings} userRole="CUSTOMER" />
        </Suspense>
      </div>
    </div>
  );
}
