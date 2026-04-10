/**
 * @file Booking Detail Page
 * @description Comprehensive view of a single booking with all related information.
 *
 * Features:
 *   - Full booking details (service, date, time, status)
 *   - Business information with contact details
 *   - Payment status and receipt
 *   - Booking timeline (visual progress)
 *   - Add to calendar button
 *   - Action buttons (pay, cancel, reschedule, review)
 *   - Printable receipt
 *
 * Accessible to:
 *   - Customer who made the booking
 *   - Business owner whose business received the booking
 *
 * URL: /bookings/[bookingId]
 */

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, MapPin, Phone, Mail, Calendar, Clock } from "lucide-react";

import { type Prisma } from "@/generated/prisma/client";
import { getCurrentUser } from "@/lib/session";
import {
  getBookingDetail,
  generateBookingTimeline,
} from "@/lib/actions/booking-detail-queries";
import { formatPrice, formatDuration } from "@/lib/utils";
import { formatTime24to12 } from "@/constants/time";
import { BOOKING_STATUS_CONFIG } from "@/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BookingTimeline } from "@/components/shared/booking-timeline";
import { BookingReceipt } from "@/components/shared/booking-receipt";
import { AddToCalendarButton } from "@/components/shared/add-to-calendar-button";

export const metadata = {
  title: "Booking Details",
};

interface BookingDetailPageProps {
  params: Promise<{ bookingId: string }>;
}

export default async function BookingDetailPage({
  params,
}: BookingDetailPageProps) {
  const { bookingId } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const rawBooking = await getBookingDetail(bookingId);
  if (!rawBooking) notFound();

  const booking = serializeBooking(rawBooking as BookingWithRelations);

  const statusConfig = BOOKING_STATUS_CONFIG[booking.status] ?? {
    label: booking.status,
    className: "bg-gray-100 text-gray-800",
  };

  const timeline = generateBookingTimeline(booking);

  const isCustomer = booking.customerId === user.id;
  const isOwner = booking.business.ownerId === user.id;

  // Build business address for display
  const businessAddress = [
    booking.business.address,
    booking.business.city,
    booking.business.state,
    booking.business.zipCode,
  ]
    .filter(Boolean)
    .join(", ");

  // Prepare calendar event data
  const calendarEvent = {
    title: `${booking.service.name} at ${booking.business.name}`,
    description: booking.service.description ?? undefined,
    location: businessAddress || undefined,
    startDate: new Date(booking.date),
    startTime: booking.startTime,
    endTime: booking.endTime,
    bookingId: booking.id,
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Back button */}
        <Button variant="ghost" size="sm" asChild>
          <Link href="/bookings">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Bookings
          </Link>
        </Button>

        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Booking Details
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Booking ID: {booking.id.slice(-8)}
            </p>
          </div>
          <Badge variant="outline" className={statusConfig.className}>
            {statusConfig.label}
          </Badge>
        </div>

        {/* Main content — two columns on large screens */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column: Main booking info */}
          <div className="space-y-6 lg:col-span-2">
            {/* Service and business info */}
            <Card>
              <CardHeader>
                <CardTitle>Appointment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Service */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Service
                  </p>
                  <p className="text-lg font-semibold">
                    {booking.service.name}
                  </p>
                  {booking.service.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {booking.service.description}
                    </p>
                  )}
                </div>

                <Separator />

                {/* Business */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Business
                  </p>
                  {isCustomer ? (
                    <Link
                      href={`/business/${booking.business.slug}`}
                      className="text-lg font-semibold text-primary hover:underline"
                    >
                      {booking.business.name}
                    </Link>
                  ) : (
                    <p className="text-lg font-semibold">
                      {booking.business.name}
                    </p>
                  )}
                </div>

                <Separator />

                {/* Date and time */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Date
                    </p>
                    <p className="mt-1">
                      {format(new Date(booking.date), "EEEE, MMMM d, yyyy")}
                    </p>
                  </div>
                  <div>
                    <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Time
                    </p>
                    <p className="mt-1">
                      {formatTime24to12(booking.startTime)} –{" "}
                      {formatTime24to12(booking.endTime)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDuration(booking.service.duration)}
                    </p>
                  </div>
                </div>

                {/* Customer notes */}
                {booking.notes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Notes
                      </p>
                      <p className="mt-1 italic">
                        &ldquo;{booking.notes}&rdquo;
                      </p>
                    </div>
                  </>
                )}

                {/* Customer info (for business owners) */}
                {isOwner && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Customer
                      </p>
                      <p className="mt-1">
                        {booking.customer.name ?? booking.customer.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {booking.customer.email}
                      </p>
                      {booking.customer.phone && (
                        <p className="text-sm text-muted-foreground">
                          {booking.customer.phone}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Business contact info */}
            {isCustomer && (
              <Card>
                <CardHeader>
                  <CardTitle>Business Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {businessAddress && (
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Address</p>
                        <p className="text-sm text-muted-foreground">
                          {businessAddress}
                        </p>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessAddress)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-block text-sm text-primary hover:underline"
                        >
                          Open in Maps
                        </a>
                      </div>
                    </div>
                  )}

                  {booking.business.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Phone</p>
                        <a
                          href={`tel:${booking.business.phone}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {booking.business.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {booking.business.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <a
                          href={`mailto:${booking.business.email}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {booking.business.email}
                        </a>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Booking timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <BookingTimeline events={timeline} />
              </CardContent>
            </Card>

            {/* Receipt (only if payment exists) */}
            {booking.payment && (
              <BookingReceipt
                booking={{
                  id: booking.id,
                  date: new Date(booking.date), // ✅ FIX
                  startTime: booking.startTime,
                  endTime: booking.endTime,
                  totalPrice: Number(booking.totalPrice), // ✅ FIX
                  createdAt: new Date(booking.createdAt),

                  business: booking.business,
                  service: {
                    name: booking.service.name,
                    duration: booking.service.duration,
                  },
                  customer: booking.customer,

                  payment: booking.payment && {
                    ...booking.payment,
                    updatedAt: new Date(booking.payment.updatedAt),
                  },
                }}
              />
            )}
          </div>

          {/* Right column: Actions and payment info */}
          <div className="space-y-6">
            {/* Payment summary */}
            <Card>
              <CardHeader>
                <CardTitle>Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(booking.totalPrice)}</span>
                </div>

                {booking.payment && (
                  <>
                    <Separator />
                    <div className="text-sm">
                      <p className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <span
                          className={
                            booking.payment.status === "SUCCEEDED"
                              ? "font-medium text-green-600"
                              : "text-muted-foreground"
                          }
                        >
                          {booking.payment.status}
                        </span>
                      </p>
                      {booking.payment.chapaTransactionRef && (
                        <p className="mt-2 flex justify-between">
                          <span className="text-muted-foreground">Ref</span>
                          <span className="text-xs">
                            {booking.payment.chapaTransactionRef.slice(-12)}
                          </span>
                        </p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Action buttons */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Add to calendar */}
                <AddToCalendarButton event={calendarEvent} />

                {/* Customer actions */}
                {isCustomer && (
                  <>
                    {/* Pay now (if pending and unpaid) */}
                    {booking.status === "PENDING" &&
                      booking.payment?.status !== "SUCCEEDED" && (
                        <Button className="w-full" asChild>
                          <Link href={`/bookings/${booking.id}/pay`}>
                            Pay Now
                          </Link>
                        </Button>
                      )}

                    {(booking.status === "PENDING" ||
                      booking.status === "CONFIRMED") && (
                      <>
                        {/* Reschedule */}
                        <Button variant="outline" className="w-full" asChild>
                          <Link href={`/bookings/reschedule?${booking.id}`}>
                            Reschedule
                          </Link>
                        </Button>

                        {/* Cancel */}
                        <Button
                          variant="destructive"
                          className="w-full"
                          asChild
                        >
                          <Link href={`/bookings?cancel=${booking.id}`}>
                            Cancel Booking
                          </Link>
                        </Button>
                      </>
                    )}

                    {/* Leave review */}
                    {booking.status === "COMPLETED" && !booking.review && (
                      <Button variant="outline" className="w-full" asChild>
                        <Link href={`/bookings/${booking.id}/review`}>
                          Leave Review
                        </Link>
                      </Button>
                    )}

                    {/* Rebook */}
                    {booking.status === "COMPLETED" && (
                      <Button variant="outline" className="w-full" asChild>
                        <Link
                          href={`/business/${booking.business.slug}/book?service=${booking.serviceId}`}
                        >
                          Book Again
                        </Link>
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

type BookingWithRelations = Prisma.BookingGetPayload<{
  include: {
    booking: true;
    service: true;
    business: true;
    customer: true;
    payment: true;
    review: true;
  };
}>;

function serializeBooking(booking: BookingWithRelations) {
  return {
    ...booking,

    // totalPrice: booking.totalPrice?.toString(),
    totalPrice: Number(booking.totalPrice),
    cancellationFee: booking.cancellationFee?.toString(),

    date: booking.date?.toISOString(),

    service: {
      ...booking.service,
      price: booking.service.price?.toString(),
    },

    payment: booking.payment && {
      ...booking.payment,
      amount: booking.payment.amount?.toString(),
    },
  };
}
