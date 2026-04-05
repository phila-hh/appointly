/**
 * @file Payment Client Component
 * @description Interactive payment page with booking summary and Chapa checkout.
 *
 * Features:
 *   - Clear booking summary (service, date, time, amount)
 *   - Available payment methods display (Telebirr, CBE Birr, etc.)
 *   - "Pay with Chapa" button that initializes payment and redirects
 *   - Loading state with redirect indicator
 *   - Error handling with retry capability
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  CreditCard,
  Smartphone,
  Building2,
  ShieldCheck,
  Loader2,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

import { initializePayment } from "@/lib/actions/payment";
import { formatPrice, formatDuration } from "@/lib/utils";
import { formatTime24to12 } from "@/constants/time";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

/** Booking daa shape passed from the server component. */
interface BookingData {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  businessName: string;
  businessSlug: string;
  serviceName: string;
  serviceDuration: number;
}

interface PaymentClientProps {
  booking: BookingData;
}

export function PaymentClient({ booking }: PaymentClientProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Initialize Chapa payment and redirect to checkout.
   */
  async function handlePayment() {
    setIsProcessing(true);

    try {
      const result = await initializePayment(booking.id);

      if (result.error) {
        toast.error(result.error);
        setIsProcessing(false);
        return;
      }

      if (result.checkoutUrl) {
        // Redirect to Chapa's hosted checkout page
        toast.info("Redirecting to payment page...");
        window.location.href = result.checkoutUrl;
        // Note: We don't setIsProcessing(false) here because
        // the page is navigating away. The loading state stays
        // visible until the redirect completes.
      }
    } catch {
      toast.error("Failed to start payment. Please tr again.");
      setIsProcessing(false);
    }
  }

  const bookingDate = new Date(booking.date);

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-lg space-y-6">
        {/* Back link */}
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/business/${booking.businessSlug}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to business
          </Link>
        </Button>

        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Complete Your Payment
          </h1>
          <p className="mt-1 text-muted-foreground">
            Review your booking details and pay securely with Chapa.
          </p>
        </div>

        {/* Booking summary card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Booking Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Business</span>
              <span className="font-medium">{booking.businessName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Service</span>
              <span className="font-medium">{booking.serviceName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Duration</span>
              <span>{formatDuration(booking.serviceDuration)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Date</span>
              <span>{format(bookingDate, "EEEE, MMMM d, yyyy")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Time</span>
              <span>
                {formatTime24to12(booking.startTime)} –{" "}
                {formatTime24to12(booking.endTime)}
              </span>
            </div>

            <Separator />

            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>{formatPrice(booking.totalPrice)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Payment methods info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Available Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
                <Smartphone className="h-3.5 w-3.5" />
                Telebirr
              </Badge>
              <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
                <Building2 className="h-3.5 w-3.5" />
                CBE Birr
              </Badge>
              <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
                <Smartphone className="h-3.5 w-3.5" />
                Amole
              </Badge>
              <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
                <CreditCard className="h-3.5 w-3.5" />
                Visa / Mastercard
              </Badge>
              <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
                <Building2 className="h-3.5 w-3.5" />
                Bank Transfer
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Pay button */}
        <Button
          className="w-full"
          size="lg"
          onClick={handlePayment}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Redirecting to Chapa...
            </>
          ) : (
            <>
              Pay {formatPrice(booking.totalPrice)}
              <ExternalLink className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>

        {/* Security note */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4" />
          <span>
            Payments are processed securely by{" "}
            <a
              href="https://chapa.co"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline underline-offset-2"
            >
              Chapa
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}
