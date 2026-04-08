/**
 * @file Booking Receipt Component
 * @description Printable receipt for a completed booking.
 *
 * Displays:
 *   - Business and customer information
 *   - Service details
 *   - Booking date and time
 *   - Payment information
 *   - Transaction reference
 *
 * Styled for printing with print-specific CSS classes.
 */

"use client";

import { format } from "date-fns";
import { Printer } from "lucide-react";

import { formatPrice } from "@/lib/utils";
import { formatTime24to12 } from "@/constants/time";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface BookingReceiptProps {
  booking: {
    id: string;
    date: Date;
    startTime: string;
    endTime: string;
    totalPrice: number;
    createdAt: Date;
    business: {
      name: string;
      phone: string | null;
      email: string | null;
      address: string | null;
      city: string | null;
      state: string | null;
      zipCode: string | null;
    };
    service: {
      name: string;
      duration: number;
    };
    customer: {
      name: string | null;
      email: string;
    };
    payment?: {
      chapaTransactionRef: string | null;
      status: string;
      updatedAt: Date;
    } | null;
  };
}

export function BookingReceipt({ booking }: BookingReceiptProps) {
  function handlePrint() {
    window.print();
  }

  return (
    <Card className="print:shadow-none">
      <CardHeader className="flex flex-row items-center justify-between print:border-b">
        <CardTitle>Booking Receipt</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="print:hidden"
        >
          <Printer className="mr-2 h-4 w-4" />
          Print Receipt
        </Button>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Receipt header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold">{booking.business.name}</h2>
          {booking.business.address && (
            <p className="mt-1 text-sm text-muted-foreground">
              {booking.business.address}
              {booking.business.city && `, ${booking.business.city}`}
              {booking.business.state && `, ${booking.business.state}`}
              {booking.business.zipCode && ` ${booking.business.zipCode}`}
            </p>
          )}
          {booking.business.phone && (
            <p className="text-sm text-muted-foreground">
              {booking.business.phone}
            </p>
          )}
          {booking.business.email && (
            <p className="text-sm text-muted-foreground">
              {booking.business.email}
            </p>
          )}
        </div>

        <Separator />

        {/* Receipt details */}
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-medium">Receipt Number</p>
              <p className="text-muted-foreground">{booking.id.slice(-8)}</p>
            </div>
            <div>
              <p className="font-medium">Receipt Date</p>
              <p className="text-muted-foreground">
                {format(booking.createdAt, "MMM d, yyyy")}
              </p>
            </div>
          </div>

          <Separator />

          {/* Customer info */}
          <div>
            <p className="font-medium">Customer</p>
            <p className="text-muted-foreground">
              {booking.customer.name ?? booking.customer.email}
            </p>
            <p className="text-muted-foreground">{booking.customer.email}</p>
          </div>

          <Separator />

          {/* Service info */}
          <div>
            <p className="font-medium">Service</p>
            <p className="text-muted-foreground">{booking.service.name}</p>
          </div>

          <div>
            <p className="font-medium">Appointment Date & Time</p>
            <p className="text-muted-foreground">
              {format(booking.date, "EEEE, MMMM d, yyyy")}
            </p>
            <p className="text-muted-foreground">
              {formatTime24to12(booking.startTime)} –{" "}
              {formatTime24to12(booking.endTime)}
            </p>
          </div>

          <Separator />

          {/* Payment info */}
          {booking.payment && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Payment Status</p>
                  <p className="text-muted-foreground">
                    {booking.payment.status}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Payment Date</p>
                  <p className="text-muted-foreground">
                    {format(booking.payment.updatedAt, "MMM d, yyyy")}
                  </p>
                </div>
              </div>

              {booking.payment.chapaTransactionRef && (
                <div>
                  <p className="font-medium">Transaction Reference</p>
                  <p className="text-muted-foreground">
                    {booking.payment.chapaTransactionRef}
                  </p>
                </div>
              )}

              <Separator />
            </>
          )}

          {/* Total */}
          <div className="flex justify-between text-lg font-semibold">
            <span>Total Paid</span>
            <span>{formatPrice(booking.totalPrice)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 text-center text-xs text-muted-foreground">
          <p>Thank you for your business!</p>
          <p className="mt-1">
            This is an electronic receipt. No signature required.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
