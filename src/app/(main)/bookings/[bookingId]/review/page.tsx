/**
 * @file Review Submission Page
 * @description Page for customers to leave a review after a completed booking.
 *
 * Pre-conditions:
 *   - User is authenticated
 *   - User is the customer who made the booking
 *   - Booking status is COMPLETED
 *   - No review exists yet (or redirect to edit page)
 *
 * URL: /bookings/[bookingId]/review
 */

import { redirect, notFound } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import db from "@/lib/db";
import { ReviewForm } from "@/components/forms/review-form";

export const metadata = {
  title: "Leave a Review",
};

interface ReviewPageProps {
  params: Promise<{ bookingId: string }>;
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { bookingId } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  // Fetch booking with all related data
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      business: {
        select: {
          name: true,
        },
      },
      service: {
        select: {
          name: true,
        },
      },
      review: true,
    },
  });

  if (!booking) notFound();

  // Verify ownership
  if (booking.customerId !== user.id) {
    redirect("/bookings");
  }

  // Check booking is completed
  if (booking.status !== "COMPLETED") {
    redirect(`/bookings/${bookingId}`);
  }

  // If review already exists, redirect to booking detail
  // (they can edit from there)
  if (booking.review) {
    redirect(`/bookings/${bookingId}`);
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Leave a Review
          </h1>
          <p className="mt-2 text-muted-foreground">
            Share your experience to help others make informed decisions.
          </p>
        </div>

        <ReviewForm
          bookingId={bookingId}
          businessName={booking.business.name}
          serviceName={booking.service.name}
        />
      </div>
    </div>
  );
}
