/**
 * @file Booking List Component
 * @description Displays a filtered list of bookings as cards.
 *
 * Used by both customer and business owner views with role-specific
 * actions and information display.
 *
 * Customer action logic:
 *   PENDING (unpaid):
 *     - [Pay Now] [Cancel] — no reschedule (unpaid bookings should be
 *       cancelled and rebooked, not rescheduled)
 *   CONFIRMED (paid), > 24h before appointment:
 *     - [Reschedule] [Cancel]
 *     - Cancel dialog suggests rescheduling if rescheduleCount < 2
 *   CONFIRMED (paid), < 24h before appointment:
 *     - [Reschedule] only
 *     - Cancel is hidden — user is shown a tooltip explaining the window
 *       has passed and they should contact the business
 *   COMPLETED:
 *     - [Leave Review] (if no review) [Book Again]
 *
 * Business owner action logic:
 *   PENDING:
 *     - [Decline] (with reason) — no Confirm button (auto-confirmed on payment)
 *   CONFIRMED:
 *     - [Complete] [No-Show] [Cancel] (cancel requires reason)
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import {
  CalendarDays,
  Clock,
  Loader2,
  UserCheck,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { updateBookingStatus } from "@/lib/actions/booking";
import { canCancelForFree } from "@/lib/booking-utils";
import { formatPrice } from "@/lib/utils";
import { formatTime24to12 } from "@/constants/time";
import { BOOKING_STATUS_CONFIG } from "@/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { RescheduleDialog } from "@/components/shared/reschedule-dialog";

// =============================================================================
// Types
// =============================================================================

/** Shape of a serialized booking for display. */
interface BookingData {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  totalPrice: number;
  notes: string | null;
  createdAt: string;
  cancellationDeadline: string | null;
  rescheduleCount: number;
  business: {
    id: string;
    name: string;
    slug: string;
    image: string | null;
  };
  service: {
    id: string;
    name: string;
    duration: number;
  };
  staff: {
    id: string;
    name: string;
    title: string | null;
  } | null;
  hasReview: boolean;
  isPaid?: boolean;
  /** Customer info — only present in business owner view. */
  customer?: {
    name: string | null;
    email: string;
    phone: string | null;
  };
  /** Whether this customer has 3+ bookings at this business (loyalty indicator). */
  isReturningCustomer?: boolean;
}

interface BookingListProps {
  bookings: BookingData[];
  userRole: "CUSTOMER" | "BUSINESS_OWNER";
}

// =============================================================================
// Constants
// =============================================================================

/** Status filter tabs. */
const STATUS_FILTERS = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

// =============================================================================
// Component
// =============================================================================

export function BookingList({ bookings, userRole }: BookingListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // ---- Cancel dialog state ----
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<BookingData | null>(
    null
  );

  // ---- Business decline dialog state ----
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [bookingToDecline, setBookingToDecline] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  // ---- Business cancel (confirmed) dialog state ----
  const [businessCancelDialogOpen, setBusinessCancelDialogOpen] =
    useState(false);
  const [bookingToBusinessCancel, setBookingToBusinessCancel] = useState<
    string | null
  >(null);
  const [businessCancelReason, setBusinessCancelReason] = useState("");

  // ---- No-show dialog state ----
  const [noShowDialogOpen, setNoShowDialogOpen] = useState(false);
  const [bookingToNoShow, setBookingToNoShow] = useState<string | null>(null);

  // ---- Reschedule dialog state ----
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [bookingToReschedule, setBookingToReschedule] =
    useState<BookingData | null>(null);

  const currentStatus = searchParams.get("status") ?? "ALL";

  // ==========================================================================
  // Navigation
  // ==========================================================================

  function handleStatusChange(status: string) {
    const params = new URLSearchParams();
    if (status !== "ALL") params.set("status", status);
    const queryString = params.toString();
    router.push(queryString ? `?${queryString}` : "/bookings", {
      scroll: false,
    });
  }

  // ==========================================================================
  // Status update helper
  // ==========================================================================

  async function handleStatusUpdate(
    bookingId: string,
    newStatus: string,
    cancellationReason?: string
  ) {
    setLoadingId(bookingId);

    try {
      const result = await updateBookingStatus({
        bookingId,
        status: newStatus as
          | "PENDING"
          | "CONFIRMED"
          | "CANCELLED"
          | "COMPLETED"
          | "NO_SHOW",
        cancellationReason,
      });

      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(result.success);
        router.refresh();
      }
    } catch {
      toast.error("Failed to update booking.");
    } finally {
      setLoadingId(null);
    }
  }

  // ==========================================================================
  // Customer: Cancel
  // ==========================================================================

  function handleCancelClick(booking: BookingData) {
    setBookingToCancel(booking);
    setCancelDialogOpen(true);
  }

  async function confirmCancel() {
    if (!bookingToCancel) return;
    await handleStatusUpdate(bookingToCancel.id, "CANCELLED");
    setCancelDialogOpen(false);
    setBookingToCancel(null);
  }

  // ==========================================================================
  // Customer: Reschedule
  // ==========================================================================

  function handleRescheduleClick(booking: BookingData) {
    setBookingToReschedule(booking);
    setRescheduleDialogOpen(true);
  }

  // ==========================================================================
  // Business: Decline (PENDING booking)
  // ==========================================================================

  function handleDeclineClick(bookingId: string) {
    setBookingToDecline(bookingId);
    setDeclineReason("");
    setDeclineDialogOpen(true);
  }

  async function confirmDecline() {
    if (!bookingToDecline) return;
    if (declineReason.trim().length < 5) {
      toast.error("Please provide a reason for declining (min 5 characters).");
      return;
    }
    await handleStatusUpdate(bookingToDecline, "CANCELLED", declineReason);
    setDeclineDialogOpen(false);
    setBookingToDecline(null);
    setDeclineReason("");
  }

  // ==========================================================================
  // Business: Cancel (CONFIRMED booking)
  // ==========================================================================

  function handleBusinessCancelClick(bookingId: string) {
    setBookingToBusinessCancel(bookingId);
    setBusinessCancelReason("");
    setBusinessCancelDialogOpen(true);
  }

  async function confirmBusinessCancel() {
    if (!bookingToBusinessCancel) return;
    if (businessCancelReason.trim().length < 5) {
      toast.error(
        "Please provide a reason for cancelling (min 5 characters). The customer will be notified."
      );
      return;
    }
    await handleStatusUpdate(
      bookingToBusinessCancel,
      "CANCELLED",
      businessCancelReason
    );
    setBusinessCancelDialogOpen(false);
    setBookingToBusinessCancel(null);
    setBusinessCancelReason("");
  }

  // ==========================================================================
  // Business: No-show
  // ==========================================================================

  function handleNoShowClick(bookingId: string) {
    setBookingToNoShow(bookingId);
    setNoShowDialogOpen(true);
  }

  async function confirmNoShow() {
    if (!bookingToNoShow) return;
    await handleStatusUpdate(bookingToNoShow, "NO_SHOW");
    setNoShowDialogOpen(false);
    setBookingToNoShow(null);
  }

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <div className="space-y-6">
      {/* Status filter tabs */}
      <Tabs value={currentStatus} onValueChange={handleStatusChange}>
        <TabsList>
          {STATUS_FILTERS.map((filter) => (
            <TabsTrigger key={filter.value} value={filter.value}>
              {filter.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Booking cards */}
      {bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const statusConfig = BOOKING_STATUS_CONFIG[booking.status] ?? {
              label: booking.status,
              className: "bg-gray-100 text-gray-800",
            };

            const isLoading = loadingId === booking.id;
            const bookingDate = new Date(booking.date);

            // ----------------------------------------------------------------
            // Customer-specific logic
            // ----------------------------------------------------------------
            const isWithinCancellationWindow =
              booking.status === "CONFIRMED" &&
              !canCancelForFree(bookingDate, booking.startTime);

            const canReschedule =
              booking.status === "CONFIRMED" &&
              booking.rescheduleCount < 2 &&
              canCancelForFree(bookingDate, booking.startTime);

            return (
              <Card key={booking.id}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    {/* -------------------------------------------------------- */}
                    {/* Left: Booking details                                    */}
                    {/* -------------------------------------------------------- */}
                    <div className="space-y-2">
                      {/* Service name + status badge */}
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">
                          {booking.service.name}
                        </h3>
                        <Badge
                          variant="outline"
                          className={statusConfig.className}
                        >
                          {statusConfig.label}
                        </Badge>
                        {/* Returning customer badge — business owner view */}
                        {userRole === "BUSINESS_OWNER" &&
                          booking.isReturningCustomer && (
                            <Badge
                              variant="outline"
                              className="border-blue-200 bg-blue-50 text-blue-700"
                            >
                              <UserCheck className="mr-1 h-3 w-3" />
                              Returning
                            </Badge>
                          )}
                      </div>

                      {/* Business name (customer view) */}
                      {userRole === "CUSTOMER" && (
                        <Link
                          href={`/business/${booking.business.slug}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {booking.business.name}
                        </Link>
                      )}

                      {/* Customer name (business view) */}
                      {userRole === "BUSINESS_OWNER" && booking.customer && (
                        <p className="text-sm text-muted-foreground">
                          {booking.customer.name ?? booking.customer.email}
                        </p>
                      )}

                      {/* Staff name — shown in both views when assigned */}
                      {booking.staff && (
                        <p className="text-xs text-muted-foreground">
                          With{" "}
                          <span className="font-medium">
                            {booking.staff.name}
                          </span>
                          {booking.staff.title && (
                            <span className="ml-1 text-muted-foreground/70">
                              ({booking.staff.title})
                            </span>
                          )}
                        </p>
                      )}

                      {/* Date and time */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="h-4 w-4" />
                          {format(bookingDate, "EEEE, MMM d, yyyy")}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          {formatTime24to12(booking.startTime)} –{" "}
                          {formatTime24to12(booking.endTime)}
                        </span>
                      </div>

                      {/* Within-window notice for customer */}
                      {userRole === "CUSTOMER" &&
                        isWithinCancellationWindow && (
                          <p className="text-xs text-muted-foreground">
                            Within 24-hour window — to cancel, contact the
                            business directly.
                          </p>
                        )}

                      {/* Notes */}
                      {booking.notes && (
                        <p className="text-sm italic text-muted-foreground">
                          &ldquo;{booking.notes}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* -------------------------------------------------------- */}
                    {/* Right: Price and actions                                 */}
                    {/* -------------------------------------------------------- */}
                    <div className="flex flex-col items-end gap-2">
                      <p className="text-lg font-semibold">
                        {formatPrice(booking.totalPrice)}
                      </p>

                      <div className="flex flex-wrap justify-end gap-2">
                        {/* View details */}
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/bookings/${booking.id}`}>
                            View Details
                          </Link>
                        </Button>

                        {/* -------------------------------------------------- */}
                        {/* CUSTOMER actions                                     */}
                        {/* -------------------------------------------------- */}
                        {userRole === "CUSTOMER" && (
                          <>
                            {/* PENDING: Pay Now + Cancel (no reschedule) */}
                            {booking.status === "PENDING" && (
                              <>
                                {!booking.isPaid && (
                                  <Button size="sm" asChild>
                                    <Link href={`/bookings/${booking.id}/pay`}>
                                      Pay Now
                                    </Link>
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isLoading}
                                  onClick={() => handleCancelClick(booking)}
                                >
                                  {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    "Cancel"
                                  )}
                                </Button>
                              </>
                            )}

                            {/* CONFIRMED: Reschedule + Cancel (if outside window) */}
                            {booking.status === "CONFIRMED" && (
                              <>
                                {canReschedule && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={isLoading}
                                    onClick={() =>
                                      handleRescheduleClick(booking)
                                    }
                                  >
                                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                                    Reschedule
                                  </Button>
                                )}
                                {/* Cancel only shown outside 24h window */}
                                {!isWithinCancellationWindow && (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    disabled={isLoading}
                                    onClick={() => handleCancelClick(booking)}
                                  >
                                    {isLoading ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      "Cancel"
                                    )}
                                  </Button>
                                )}
                              </>
                            )}

                            {/* COMPLETED: Leave review + Book again */}
                            {booking.status === "COMPLETED" && (
                              <>
                                {!booking.hasReview && (
                                  <Button size="sm" variant="outline" asChild>
                                    <Link
                                      href={`/bookings/${booking.id}/review`}
                                    >
                                      Leave Review
                                    </Link>
                                  </Button>
                                )}
                                <Button size="sm" variant="outline" asChild>
                                  <Link
                                    href={`/business/${booking.business.slug}/book?service=${booking.service.name}`}
                                  >
                                    Book Again
                                  </Link>
                                </Button>
                              </>
                            )}
                          </>
                        )}

                        {/* -------------------------------------------------- */}
                        {/* BUSINESS OWNER actions                               */}
                        {/* -------------------------------------------------- */}
                        {userRole === "BUSINESS_OWNER" && (
                          <>
                            {/* PENDING: Decline only (Confirm removed — auto on payment) */}
                            {booking.status === "PENDING" && (
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={isLoading}
                                onClick={() => handleDeclineClick(booking.id)}
                              >
                                Decline
                              </Button>
                            )}

                            {/* CONFIRMED: Complete + No-Show + Cancel (with reason) */}
                            {booking.status === "CONFIRMED" && (
                              <>
                                <Button
                                  size="sm"
                                  disabled={isLoading}
                                  onClick={() =>
                                    handleStatusUpdate(booking.id, "COMPLETED")
                                  }
                                >
                                  {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    "Complete"
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isLoading}
                                  onClick={() => handleNoShowClick(booking.id)}
                                >
                                  No-Show
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled={isLoading}
                                  onClick={() =>
                                    handleBusinessCancelClick(booking.id)
                                  }
                                >
                                  Cancel
                                </Button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <CalendarDays className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No bookings found</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            {userRole === "CUSTOMER"
              ? "You haven't made any bookings yet. Browse services to get started."
              : "No incoming bookings match the selected filter."}
          </p>
          {userRole === "CUSTOMER" && (
            <Button className="mt-4" asChild>
              <Link href="/browse">Browse Services</Link>
            </Button>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* Customer: Cancel confirmation dialog                                  */}
      {/* Suggests rescheduling if the customer has reschedules remaining.      */}
      {/* -------------------------------------------------------------------- */}
      <ConfirmationDialog
        open={cancelDialogOpen}
        onOpenChange={(open) => {
          setCancelDialogOpen(open);
          if (!open) setBookingToCancel(null);
        }}
        title="Cancel this appointment?"
        description={
          bookingToCancel
            ? canCancelForFree(
                new Date(bookingToCancel.date),
                bookingToCancel.startTime
              )
              ? "This appointment will be cancelled. You are cancelling more than 24 hours in advance so no fee will be charged."
              : "Warning: this appointment is within 24 hours. A cancellation fee may apply."
            : "This action cannot be undone."
        }
        confirmText="Yes, Cancel Appointment"
        cancelText="Keep Appointment"
        onConfirm={confirmCancel}
        destructive
        isLoading={loadingId === bookingToCancel?.id}
      >
        {/* Suggest rescheduling if the booking is CONFIRMED and reschedules remain */}
        {bookingToCancel?.status === "CONFIRMED" &&
          (bookingToCancel?.rescheduleCount ?? 0) < 2 &&
          canCancelForFree(
            new Date(bookingToCancel.date),
            bookingToCancel.startTime
          ) && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="text-sm font-medium text-blue-900">
                Did you know you can reschedule instead?
              </p>
              <p className="mt-1 text-xs text-blue-700">
                You have {2 - (bookingToCancel?.rescheduleCount ?? 0)}{" "}
                reschedule
                {2 - (bookingToCancel?.rescheduleCount ?? 0) === 1
                  ? ""
                  : "s"}{" "}
                remaining. Rescheduling keeps your booking active and avoids
                losing your slot.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 border-blue-300 text-blue-700 hover:bg-blue-100"
                onClick={() => {
                  setCancelDialogOpen(false);
                  if (bookingToCancel) {
                    handleRescheduleClick(bookingToCancel);
                  }
                }}
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Reschedule Instead
              </Button>
            </div>
          )}
      </ConfirmationDialog>

      {/* -------------------------------------------------------------------- */}
      {/* Business: Decline dialog (PENDING booking — requires reason)          */}
      {/* -------------------------------------------------------------------- */}
      <ConfirmationDialog
        open={declineDialogOpen}
        onOpenChange={(open) => {
          setDeclineDialogOpen(open);
          if (!open) {
            setBookingToDecline(null);
            setDeclineReason("");
          }
        }}
        title="Decline this booking request?"
        description="The customer will be notified. Please provide a reason."
        confirmText="Decline Request"
        cancelText="Go Back"
        onConfirm={confirmDecline}
        destructive
        isLoading={loadingId === bookingToDecline}
      >
        <div className="space-y-2">
          <Label htmlFor="decline-reason" className="text-sm font-medium">
            Reason for declining{" "}
            <span className="font-normal text-muted-foreground">
              (required)
            </span>
          </Label>
          <Textarea
            id="decline-reason"
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder="e.g. No available staff for this time slot..."
            className="min-h-[80px] resize-none"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground">
            {declineReason.length}/500
          </p>
        </div>
      </ConfirmationDialog>

      {/* -------------------------------------------------------------------- */}
      {/* Business: Cancel confirmed booking dialog (requires reason)           */}
      {/* -------------------------------------------------------------------- */}
      <ConfirmationDialog
        open={businessCancelDialogOpen}
        onOpenChange={(open) => {
          setBusinessCancelDialogOpen(open);
          if (!open) {
            setBookingToBusinessCancel(null);
            setBusinessCancelReason("");
          }
        }}
        title="Cancel this confirmed booking?"
        description="The customer has already paid. A full refund will be automatically processed. Please provide a reason — the customer will be notified."
        confirmText="Cancel & Refund"
        cancelText="Go Back"
        onConfirm={confirmBusinessCancel}
        destructive
        isLoading={loadingId === bookingToBusinessCancel}
      >
        <div className="space-y-2">
          <Label
            htmlFor="business-cancel-reason"
            className="text-sm font-medium"
          >
            Reason for cancelling{" "}
            <span className="font-normal text-muted-foreground">
              (required)
            </span>
          </Label>
          <Textarea
            id="business-cancel-reason"
            value={businessCancelReason}
            onChange={(e) => setBusinessCancelReason(e.target.value)}
            placeholder="e.g. Staff member is unavailable due to illness..."
            className="min-h-[80px] resize-none"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground">
            {businessCancelReason.length}/500
          </p>
        </div>
      </ConfirmationDialog>

      {/* -------------------------------------------------------------------- */}
      {/* Business: No-show confirmation                                        */}
      {/* -------------------------------------------------------------------- */}
      <ConfirmationDialog
        open={noShowDialogOpen}
        onOpenChange={(open) => {
          setNoShowDialogOpen(open);
          if (!open) setBookingToNoShow(null);
        }}
        title="Mark customer as no-show?"
        description="This will mark the appointment as a no-show. This action affects the customer's booking history."
        confirmText="Mark as No-Show"
        cancelText="Cancel"
        onConfirm={confirmNoShow}
        isLoading={loadingId === bookingToNoShow}
      />

      {/* -------------------------------------------------------------------- */}
      {/* Reschedule dialog                                                     */}
      {/* -------------------------------------------------------------------- */}
      {bookingToReschedule && (
        <RescheduleDialog
          open={rescheduleDialogOpen}
          onOpenChange={(open) => {
            setRescheduleDialogOpen(open);
            if (!open) setBookingToReschedule(null);
          }}
          booking={{
            id: bookingToReschedule.id,
            businessId: bookingToReschedule.business.id,
            serviceId: bookingToReschedule.service.id,
            staffId: bookingToReschedule.staff?.id ?? null,
            currentDate: bookingToReschedule.date,
            currentStartTime: bookingToReschedule.startTime,
            currentEndTime: bookingToReschedule.endTime,
            serviceName: bookingToReschedule.service.name,
            businessName: bookingToReschedule.business.name,
            rescheduleCount: bookingToReschedule.rescheduleCount,
          }}
        />
      )}
    </div>
  );
}
