/**
 * @file Booking List Component
 * @description Displays a filtered list of bookings as cards.
 *
 * Used by both customer and business owner views with role-specific
 * actions and information display.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { CalendarDays, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { updateBookingStatus } from "@/lib/actions/booking";
import { formatPrice } from "@/lib/utils";
import { formatTime24to12 } from "@/constants/time";
import { BOOKING_STATUS_CONFIG } from "@/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  business: {
    name: string;
    slug: string;
    image: string | null;
  };
  service: {
    name: string;
    duration: number;
  };
  hasReview: boolean;
  /** Whether the payment has been completed. */
  isPaid?: boolean;
  /** Customer info — only present in business owner view. */
  customer?: {
    name: string | null;
    email: string;
    phone: string | null;
  };
}

interface BookingListProps {
  bookings: BookingData[];
  userRole: "CUSTOMER" | "BUSINESS_OWNER";
}

/** Status filter tabs. */
const STATUS_FILTERS = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function BookingList({ bookings, userRole }: BookingListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const currentStatus = searchParams.get("status") ?? "ALL";

  /** Navigate to a status filter tab. */
  function handleStatusChange(status: string) {
    const params = new URLSearchParams();
    if (status !== "ALL") {
      params.set("status", status);
    }
    const queryString = params.toString();
    router.push(queryString ? `?${queryString}` : ".", { scroll: false });
  }

  /** Update a booking's status with loading state and feedback. */
  async function handleStatusUpdate(bookingId: string, newStatus: string) {
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

            return (
              <Card key={booking.id}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    {/* Left: Booking details */}
                    <div className="space-y-2">
                      {/* Service and business names */}
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
                      </div>

                      {/* Business name (for customer view) */}
                      {userRole === "CUSTOMER" && (
                        <Link
                          href={`/business/${booking.business.slug}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {booking.business.name}
                        </Link>
                      )}

                      {/* Customer name (for business view) */}
                      {userRole === "BUSINESS_OWNER" && booking.customer && (
                        <p className="text-sm text-muted-foreground">
                          Customer:{" "}
                          {booking.customer.name ?? booking.customer.email}
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

                      {/* Notes */}
                      {booking.notes && (
                        <p className="text-sm italic text-muted-foreground">
                          &ldquo;{booking.notes}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Right: Price and actions */}
                    <div className="flex flex-col items-end gap-2">
                      <p className="text-lg font-semibold">
                        {formatPrice(booking.totalPrice)}
                      </p>

                      {/* Action buttons based on role and current status */}
                      <div className="flex flex-wrap gap-2">
                        {/* Customer actions */}
                        {userRole === "CUSTOMER" && (
                          <>
                            {booking.status === "PENDING" &&
                              !booking.isPaid && (
                                <Button size="sm" asChild>
                                  <Link href={`/bookings/${booking.id}/pay`}>
                                    Pay Now
                                  </Link>
                                </Button>
                              )}
                            {(booking.status === "PENDING" ||
                              booking.status === "CONFIRMED") && (
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={isLoading}
                                onClick={() =>
                                  handleStatusUpdate(booking.id, "CANCELLED")
                                }
                              >
                                {isLoading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Cancel"
                                )}
                              </Button>
                            )}
                            {booking.status === "COMPLETED" &&
                              !booking.hasReview && (
                                <Button size="sm" variant="outline" asChild>
                                  <Link href={`/bookings/${booking.id}/review`}>
                                    Leave Review
                                  </Link>
                                </Button>
                              )}
                          </>
                        )}

                        {/* Business owner actions */}
                        {userRole === "BUSINESS_OWNER" && (
                          <>
                            {booking.status === "PENDING" && (
                              <>
                                <Button
                                  size="sm"
                                  disabled={isLoading}
                                  onClick={() =>
                                    handleStatusUpdate(booking.id, "CONFIRMED")
                                  }
                                >
                                  {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    "Confirm"
                                  )}
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled={isLoading}
                                  onClick={() =>
                                    handleStatusUpdate(booking.id, "CANCELLED")
                                  }
                                >
                                  Decline
                                </Button>
                              </>
                            )}
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
                                  onClick={() =>
                                    handleStatusUpdate(booking.id, "NO_SHOW")
                                  }
                                >
                                  No-Show
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled={isLoading}
                                  onClick={() =>
                                    handleStatusUpdate(booking.id, "CANCELLED")
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
    </div>
  );
}
