/**
 * @file Booking Detail Page
 * @description Comprehensive view of a single booking with all related
 * information, actions, and payment status.
 *
 * Features:
 *   - Full booking details (service, date, time, staff, status)
 *   - Business information with contact details and map link
 *   - Payment status with refund status display
 *   - Cancellation deadline display ("Free cancellation until...")
 *   - Reschedule count indicator ("Rescheduled X of 2 times")
 *   - Booking timeline (visual progression of events)
 *   - Add to calendar button
 *   - Action buttons — context-aware per role and status:
 *       Customer: Pay, Reschedule, Cancel, Leave Review, Book Again
 *       Business owner: Complete, No-Show, Cancel (with reason)
 *   - Review display with business reply (if any)
 *   - Customer review edit (if they already reviewed)
 *   - Printable receipt (BookingReceipt component)
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
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Clock,
  RefreshCw,
  MessageSquare,
} from "lucide-react";

import { getCurrentUser } from "@/lib/session";
import {
  getBookingDetail,
  generateBookingTimeline,
} from "@/lib/actions/booking-detail-queries";
import { canCancelForFree } from "@/lib/booking-utils";
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
import { CancelBookingButton } from "@/app/(main)/bookings/[bookingId]/cancel-booking-button";
import { RescheduleDialogTrigger } from "@/app/(main)/bookings/[bookingId]/reschedule-dialog-trigger";

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

  const booking = await getBookingDetail(bookingId);
  if (!booking) notFound();

  const statusConfig = BOOKING_STATUS_CONFIG[booking.status] ?? {
    label: booking.status,
    className: "bg-gray-100 text-gray-800",
  };

  const timeline = generateBookingTimeline({
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    status: booking.status,
    rescheduleCount: booking.rescheduleCount,
    payment: booking.payment
      ? {
          status: booking.payment.status,
          createdAt: booking.payment.createdAt,
          updatedAt: booking.payment.updatedAt,
          refundStatus: booking.payment.refundStatus,
          refundedAt: booking.payment.refundedAt,
        }
      : null,
    review: booking.review ? { createdAt: booking.review.createdAt } : null,
  });

  const isCustomer = booking.customerId === user.id;
  const isOwner = booking.business.ownerId === user.id;
  const isPaid = booking.payment?.status === "SUCCEEDED";

  // Cancellation window check for action button logic
  const isOutsideCancellationWindow = canCancelForFree(
    new Date(booking.date),
    booking.startTime
  );

  const canReschedule =
    booking.status === "CONFIRMED" &&
    booking.rescheduleCount < 2 &&
    isOutsideCancellationWindow;

  // Build business address for display and map link
  const businessAddress = [
    booking.business.address,
    booking.business.city,
    booking.business.state,
    booking.business.zipCode,
  ]
    .filter(Boolean)
    .join(", ");

  // Calendar event data
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
          <Link
            href={isOwner && !isCustomer ? "/dashboard/bookings" : "/bookings"}
          >
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
              Booking ID: {booking.id.slice(-8).toUpperCase()}
            </p>
          </div>
          <Badge variant="outline" className={statusConfig.className}>
            {statusConfig.label}
          </Badge>
        </div>

        {/* Main content — two columns on large screens */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* ---------------------------------------------------------------- */}
          {/* Left column: Appointment info, contact, timeline, receipt        */}
          {/* ---------------------------------------------------------------- */}
          <div className="space-y-6 lg:col-span-2">
            {/* Appointment information */}
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

                {/* Staff — shown when a staff member is assigned */}
                {booking.staff && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Staff Member
                      </p>
                      <p className="font-medium">{booking.staff.name}</p>
                      {booking.staff.title && (
                        <p className="text-sm text-muted-foreground">
                          {booking.staff.title}
                        </p>
                      )}
                    </div>
                  </>
                )}

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

                {/* Reschedule count — shown when rescheduled at least once */}
                {booking.rescheduleCount > 0 && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Rescheduled{" "}
                        <span className="font-medium text-foreground">
                          {booking.rescheduleCount} of 2
                        </span>{" "}
                        times
                      </p>
                    </div>
                  </>
                )}

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

                {/* Customer info (business owner view) */}
                {isOwner && !isCustomer && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Customer
                      </p>
                      <p className="mt-1 font-medium">
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

            {/* Business contact info (customer view only) */}
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

            {/* Review display — shown when a review exists */}
            {booking.review && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Review</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={
                          i < booking.review!.rating
                            ? "text-yellow-400"
                            : "text-gray-200"
                        }
                      >
                        ★
                      </span>
                    ))}
                    <span className="text-sm text-muted-foreground">
                      {format(
                        new Date(booking.review.createdAt),
                        "MMM d, yyyy"
                      )}
                    </span>
                  </div>

                  {booking.review.comment && (
                    <p className="text-sm italic">
                      &ldquo;{booking.review.comment}&rdquo;
                    </p>
                  )}

                  {/* Business reply — shown publicly when present */}
                  {booking.review.businessReply && (
                    <div className="rounded-lg border bg-muted/40 p-3">
                      <div className="mb-1 flex items-center gap-2">
                        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-xs font-medium text-muted-foreground">
                          Response from {booking.business.name}
                          {booking.review.businessReplyAt && (
                            <span className="ml-1">
                              ·{" "}
                              {format(
                                new Date(booking.review.businessReplyAt),
                                "MMM d, yyyy"
                              )}
                            </span>
                          )}
                        </p>
                      </div>
                      <p className="text-sm">{booking.review.businessReply}</p>
                    </div>
                  )}

                  {/* Edit review — customer can edit their own review */}
                  {isCustomer && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/bookings/${booking.id}/review`}>
                        Edit Review
                      </Link>
                    </Button>
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

            {/* Receipt — only when payment exists */}
            {booking.payment && (
              <BookingReceipt
                booking={{
                  id: booking.id,
                  date: new Date(booking.date),
                  startTime: booking.startTime,
                  endTime: booking.endTime,
                  totalPrice: Number(booking.totalPrice),
                  createdAt: new Date(booking.createdAt),
                  business: booking.business,
                  service: {
                    name: booking.service.name,
                    duration: booking.service.duration,
                  },
                  customer: booking.customer,
                  payment: {
                    ...booking.payment,
                    updatedAt: new Date(booking.payment.updatedAt),
                  },
                }}
              />
            )}
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Right column: Payment summary + Actions                          */}
          {/* ---------------------------------------------------------------- */}
          <div className="space-y-6">
            {/* Payment summary */}
            <Card>
              <CardHeader>
                <CardTitle>Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(Number(booking.totalPrice))}</span>
                </div>

                {booking.payment && (
                  <>
                    <Separator />
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <span
                          className={
                            booking.payment.status === "SUCCEEDED"
                              ? "font-medium text-green-600"
                              : "text-muted-foreground"
                          }
                        >
                          {booking.payment.status === "SUCCEEDED"
                            ? "Paid"
                            : booking.payment.status}
                        </span>
                      </div>

                      {/* Refund status */}
                      {booking.payment.refundStatus && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Refund</span>
                          <span
                            className={
                              booking.payment.refundStatus === "REFUNDED"
                                ? "font-medium text-green-600"
                                : booking.payment.refundStatus ===
                                    "PENDING_REFUND"
                                  ? "font-medium text-amber-600"
                                  : "text-muted-foreground"
                            }
                          >
                            {booking.payment.refundStatus === "REFUNDED"
                              ? "Refunded"
                              : booking.payment.refundStatus ===
                                  "PENDING_REFUND"
                                ? "Processing..."
                                : booking.payment.refundStatus}
                          </span>
                        </div>
                      )}

                      {booking.payment.chapaTransactionRef && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Ref</span>
                          <span className="text-xs">
                            {booking.payment.chapaTransactionRef.slice(-12)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Cancellation deadline — shown for active bookings */}
                    {booking.cancellationDeadline &&
                      !["CANCELLED", "COMPLETED", "NO_SHOW"].includes(
                        booking.status
                      ) && (
                        <>
                          <Separator />
                          <p className="text-xs text-muted-foreground">
                            {isOutsideCancellationWindow ? (
                              <>
                                Free cancellation until{" "}
                                <span className="font-medium text-foreground">
                                  {format(
                                    new Date(booking.cancellationDeadline),
                                    "MMM d 'at' h:mm a"
                                  )}
                                </span>
                              </>
                            ) : (
                              <span className="text-amber-600">
                                Cancellation window has passed.
                              </span>
                            )}
                          </p>
                        </>
                      )}
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
                {/* Add to calendar — for active bookings */}
                {!["COMPLETED", "CANCELLED", "NO_SHOW"].includes(
                  booking.status
                ) && <AddToCalendarButton event={calendarEvent} />}

                {/* Customer actions */}
                {isCustomer && (
                  <>
                    {/* Pay now — PENDING and unpaid */}
                    {booking.status === "PENDING" && !isPaid && (
                      <Button className="w-full" asChild>
                        <Link href={`/bookings/${booking.id}/pay`}>
                          Pay Now
                        </Link>
                      </Button>
                    )}

                    {/* Reschedule — CONFIRMED, outside window, reschedules remaining */}
                    {canReschedule && (
                      <RescheduleDialogTrigger
                        booking={{
                          id: booking.id,
                          businessId: booking.business.id,
                          serviceId: booking.serviceId,
                          staffId: booking.staffId ?? null,
                          currentDate: new Date(booking.date).toISOString(),
                          currentStartTime: booking.startTime,
                          currentEndTime: booking.endTime,
                          serviceName: booking.service.name,
                          businessName: booking.business.name,
                          rescheduleCount: booking.rescheduleCount,
                        }}
                      />
                    )}

                    {/* Cancel — PENDING or CONFIRMED outside window */}
                    {(booking.status === "PENDING" ||
                      (booking.status === "CONFIRMED" &&
                        isOutsideCancellationWindow)) && (
                      <CancelBookingButton
                        bookingId={booking.id}
                        businessId={booking.business.id}
                        serviceId={booking.serviceId}
                        staffId={booking.staffId ?? null}
                        currentDate={new Date(booking.date).toISOString()}
                        currentStartTime={booking.startTime}
                        currentEndTime={booking.endTime}
                        serviceName={booking.service.name}
                        businessName={booking.business.name}
                        rescheduleCount={booking.rescheduleCount}
                        bookingStatus={booking.status}
                        bookingDate={booking.date.toString()}
                        startTime={booking.startTime}
                        isPaid={isPaid}
                        canReschedule={canReschedule}
                      />
                    )}

                    {/* Within 24h — show contact business message instead of cancel */}
                    {booking.status === "CONFIRMED" &&
                      !isOutsideCancellationWindow && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                          <p className="text-xs text-amber-800">
                            The cancellation window has passed. To make changes,
                            please contact{" "}
                            <span className="font-medium">
                              {booking.business.name}
                            </span>{" "}
                            directly.
                          </p>
                          {booking.business.phone && (
                            <a
                              href={`tel:${booking.business.phone}`}
                              className="mt-2 block text-xs font-medium text-amber-900 hover:underline"
                            >
                              📞 {booking.business.phone}
                            </a>
                          )}
                        </div>
                      )}

                    {/* Leave review — COMPLETED, no review yet */}
                    {booking.status === "COMPLETED" && !booking.review && (
                      <Button variant="outline" className="w-full" asChild>
                        <Link href={`/bookings/${booking.id}/review`}>
                          Leave Review
                        </Link>
                      </Button>
                    )}

                    {/* Book again — COMPLETED */}
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
