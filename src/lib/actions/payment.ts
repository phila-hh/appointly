/**
 * @file Payment Server Actions
 * @description Server-side functions for Chapa payment initialization
 * and verification.
 *
 * Flow:
 *   1. initializePayment — creates a Chapa checkout session
 *   2. Customer pays on Chapa's hosted page
 *   3. verifyPayment — confirms payment status via Chapa API
 *   4. Updates payment + booking records accordingly
 */

"use server";

import { revalidatePath } from "next/cache";

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { chapaInitialize, chapaVerify, generateTxRef } from "@/lib/chapa";

/** Result type for payment initialization. */
type InitializePaymentResult = {
  checkoutUrl?: string;
  error?: string;
};

/** Result type for payment verification. */
type VerifyPaymentResult = {
  success?: boolean;
  error?: string;
  status?: string;
};

/**
 * Initializes a Chapa payment session for a booking.
 *
 * Flow:
 *   1. Verify the current user owns the booking
 *   2. Check the payment hasn't already been completed
 *   3. Generate a unique transaction reference
 *   4. Call Chapa API to create a checkout session
 *   5. Store the tx_ref on the payment record
 *   6. Return the checkout URL for client-side redirect
 *
 * @param bookingId - The booking to initialize payment for
 * @returns Object with `checkoutUrl` or `error`
 */
export async function initializePayment(
  bookingId: string
): Promise<InitializePaymentResult> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { error: "Please sign in." };
    }

    // Fetch the booking with payment and service details
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        service: {
          select: { name: true },
        },
        business: {
          select: { name: true },
        },
      },
    });

    if (!booking) {
      return { error: "Booking not found." };
    }

    // Verify ownership
    if (booking.customerId !== user.id) {
      return { error: "You do not have permission to pay for this booking." };
    }

    // Check if payment already succeeded
    if (booking.payment?.status === "SUCCEEDED") {
      return { error: "This booking has already been paid for." };
    }

    // Check booking isn't cancelled
    if (booking.status === "CANCELLED") {
      return { error: "This booking has been cancelled." };
    }

    // Generate a unique transaction reference
    const txRef = generateTxRef(bookingId);

    // Build the return URL (where customer comes back after paying)
    const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";
    const returnUrl = `${baseUrl}/bookings/${bookingId}/payment-success?tx_ref=${txRef}`;
    const callbackUrl = `${baseUrl}/api/webhooks/chapa`;

    // Split user name into first/last for Chapa
    const nameParts = (user.name ?? "Customer").split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || firstName;

    // Initialize the Chapa transaction
    const checkoutUrl = await chapaInitialize({
      amount: Number(booking.totalPrice),
      email: user.email ?? "",
      firstName,
      lastName,
      txRef,
      returnUrl,
      callbackUrl,
      title: `Payment for ${booking.service.name}`,
      description: `Booking at ${booking.business.name}`,
    });

    // Update the payment record with the transaction reference
    if (booking.payment) {
      await db.payment.update({
        where: { id: booking.payment.id },
        data: { chapaTransactionRef: txRef },
      });
    }

    return { checkoutUrl };
  } catch (error) {
    console.error("Initialize payment error:", error);
    return { error: "Failed to initialize payment. Please try again." };
  }
}

/**
 * Verifies a Chapa transaction and updates payment + booking status.
 *
 * Called when:
 *   1. Customer returns from Chapa's checkout page (return_url)
 *   2. Webhook is received from Chapa (callback_url)
 *
 * This function is IDEMPOTENT — calling it multiple times with the same
 * tx_ref produces the same result (safe for webhook retries).
 *
 * @param txRef - The unique transaction reference
 * @returns Object with verification result
 */
export async function verifyPayment(
  txRef: string
): Promise<VerifyPaymentResult> {
  try {
    // Look up the payment by transaction reference
    const payment = await db.payment.findUnique({
      where: { chapaTransactionRef: txRef },
      include: {
        booking: {
          select: { id: true, status: true },
        },
      },
    });

    if (!payment) {
      return { error: "Payment not found for this transaction." };
    }

    // If already processed, return the current status (idempotent)
    if (payment.status === "SUCCEEDED") {
      return { success: true, status: "SUCCEEDED" };
    }

    // Call Chapa's verify API
    const verification = await chapaVerify(txRef);

    if (
      verification.status === "success" &&
      verification.data?.status === "success"
    ) {
      // Payment confirmed — update records atomically
      await db.$transaction([
        // Update payment status
        db.payment.update({
          where: { id: payment.id },
          data: { status: "SUCCEEDED" },
        }),
        // Update booking status to CONFIRMED
        db.booking.update({
          where: { id: payment.booking.id },
          data: { status: "CONFIRMED" },
        }),
      ]);

      // Revalidate pages showing booking data
      revalidatePath("/bookings");
      revalidatePath("/dashboard/bookings");

      return { success: true, status: "SUCCEEDED" };
    }

    if (verification.data?.status === "failed") {
      // Payment failed — update payment status
      await db.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      });

      return { success: false, status: "FAILED" };
    }

    // Payment still pending
    return { success: false, status: "PENDING" };
  } catch (error) {
    console.error("Verify payment error:", error);
    return { error: "Failed to verify payment. Please try again." };
  }
}
