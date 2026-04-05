/**
 * @file Payment Success Page
 * @description Landing page after Chapa payment redirect.
 *
 * When Chapa redirects the customer back to the app, this page:
 *   1. Reads the tx_ref from the URL search params
 *   2. Calls the Chapa verify API to confirm payment
 *   3. Updates payments and booking records
 *   4. Displays a success or failure message
 *
 * This is a server component — verification happens on the server
 * before the page renders. No client-side secrets are exposed.
 *
 * URL: /bookings/[bookingId]/payment-success?tx_ref="appointly-xxx-123"
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

import { getCurrentUser } from "@/lib/session";
import { verifyPayment } from "@/lib/actions/payment";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Metadata = {
  title: "Payment Result",
};

interface PaymentSuccessPageProps {
  params: Promise<{ bookingId: string }>;
  searchParams: Promise<{ tx_ref?: string }>;
}

export default async function PaymentSuccessPage({
  params,
  searchParams,
}: PaymentSuccessPageProps) {
  const { bookingId } = await params;
  const { tx_ref } = await searchParams;

  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  // Verify the payment if we have a tx_ref
  let verificationResult: {
    success?: boolean;
    error?: string;
    status?: string;
  } = {};

  if (tx_ref) {
    verificationResult = await verifyPayment(tx_ref);
  }

  // Determine the display state
  const isSuccess =
    verificationResult.success && verificationResult.status === "SUCCEEDED";
  const isFailed = verificationResult.status === "FAILED";
  const isPending = !isSuccess && !isFailed && !verificationResult.error;

  return (
    <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md text-center">
        {isSuccess && (
          <>
            {/* Success state */}
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="mb-2 text-2xl font-bold">Payment Successful!</h1>
            <p className="mb-8 text-muted-foreground">
              Your appointment has been confirmed. You will receive a
              confirmation notification shortly.
            </p>
            <Card className="mb-8">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  Your booking has been automatically confirmed. The business
                  owner has been notified of your appointment.
                </p>
              </CardContent>
            </Card>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild>
                <Link href="/bookings">View My Bookings</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/browse">Browse More Services</Link>
              </Button>
            </div>
          </>
        )}

        {isFailed && (
          <>
            {/* Failed state */}
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="mb-2 text-2xl font-bold">Payment Failed</h1>
            <p className="mb-8 text-muted-foreground">
              Your payment could not be processed. Your booking is still pending
              — you can try again.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild>
                <Link href={`/bookings/${bookingId}/pay`}>Try Again</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/bookings">View My Bookings</Link>
              </Button>
            </div>
          </>
        )}

        {isPending && (
          <>
            {/* Pending / uncertain state */}
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100">
              <Clock className="h-10 w-10 text-yellow-600" />
            </div>
            <h1 className="mb-2 text-2xl font-bold">Payment Processing</h1>
            <p className="mb-8 text-muted-foreground">
              Your payment is being processed. This may take a moment. Please
              check your booking status shortly.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild>
                <Link href="/bookings">View My Bookings</Link>
              </Button>
            </div>
          </>
        )}

        {verificationResult.error && (
          <>
            {/* Error state */}
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="mb-2 text-2xl font-bold">Verification Error</h1>
            <p className="mb-8 text-muted-foreground">
              {verificationResult.error}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild>
                <Link href="/bookings">View My Bookings</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
