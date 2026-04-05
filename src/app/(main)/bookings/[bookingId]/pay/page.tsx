/**
 * @file Payment Page
 * @description Pre-checkout page showing booking summary and payment button.
 *
 * Display the booking detail and a "Pay with Chapa" button that
 * initializes a Chapa transaction and redirects the customer to
 * Chapa's hosted checkout page.
 *
 * URL: /bookings/[bookingId]/pay
 */

import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import db from "@/lib/db";
import { PaymentClient } from "./payment-client";

export const metadata = {
  title: "Complete Payment",
};

interface PaymentPageProps {
  params: Promise<{ bookingId: string }>;
}

export default async function PaymentPage({ params }: PaymentPageProps) {
  const { bookingId } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  // Fetch booking with all related data needed for display
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      business: {
        select: { name: true, slug: true },
      },
      service: {
        select: { name: true, duration: true },
      },
      payment: {
        select: { status: true },
      },
    },
  });

  if (!booking) notFound();

  // Verify ownership
  if (booking.customerId !== user.id) {
    redirect("/bookings");
  }

  // If already paid, redirect to bookings
  if (booking.payment?.status === "SUCCEEDED") {
    redirect("bookings");
  }

  // If cancelled, redirect to bookings
  if (booking.status === "CANCELLED") {
    redirect("/bookings");
  }

  // Serialize for client component
  const bookingData = {
    id: booking.id,
    date: booking.date.toISOString(),
    startTime: booking.startTime,
    endTime: booking.endTime,
    totalPrice: Number(booking.totalPrice),
    businessName: booking.business.name,
    businessSlug: booking.business.slug,
    serviceName: booking.service.name,
    serviceDuration: booking.service.duration,
  };

  return <PaymentClient booking={bookingData} />;
}
