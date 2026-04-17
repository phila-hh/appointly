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
 *   5.Sends payment receipt email on successful payment
 */

"use server";

import { revalidatePath } from "next/cache";

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { chapaInitialize, chapaVerify, generateTxRef } from "@/lib/chapa";
import { sendPaymentReceiptEmail } from "@/lib/email-service";

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

function roundCurrency(value: number): number {
  return Number(value.toFixed(2));
}

async function ensureCommissionForBooking(bookingId: string) {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      businessId: true,
      totalPrice: true,
      commission: { select: { id: true } },
    },
  });

  if (!booking || booking.commission) return;

  const settings = await db.platformSettings.findFirst({
    select: { defaultCommissionRate: true },
  });

  const commissionRate = settings?.defaultCommissionRate ?? 0.1;
  const grossAmount = Number(booking.totalPrice);
  const commissionAmount = roundCurrency(grossAmount * commissionRate);
  const netAmount = roundCurrency(grossAmount - commissionAmount);

  await db.commission.create({
    data: {
      bookingId: booking.id,
      businessId: booking.businessId,
      grossAmount,
      commissionRate,
      commissionAmount,
      netAmount,
      status: "PENDING",
    },
  });
}

/**
 * Initializes a Chapa payment session for a booking.
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

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        service: { select: { name: true } },
        business: { select: { name: true } },
      },
    });

    if (!booking) {
      return { error: "Booking not found." };
    }

    if (booking.customerId !== user.id) {
      return { error: "You do not have permission to pay for this booking." };
    }

    if (booking.payment?.status === "SUCCEEDED") {
      return { error: "This booking has already been paid for." };
    }

    if (booking.status === "CANCELLED") {
      return { error: "This booking has been cancelled." };
    }

    const txRef = generateTxRef(bookingId);
    const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";
    const returnUrl = `${baseUrl}/bookings/${bookingId}/payment-success?tx_ref=${txRef}`;
    const callbackUrl = `${baseUrl}/api/webhooks/chapa`;

    const nameParts = (user.name ?? "Customer").split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || firstName;

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
 * Phase 17: Sends payment receipt email on successful verification.
 *
 * @param txRef - The unique transaction reference
 * @returns Object with verification result
 */
export async function verifyPayment(
  txRef: string
): Promise<VerifyPaymentResult> {
  try {
    const payment = await db.payment.findUnique({
      where: { chapaTransactionRef: txRef },
      include: {
        booking: { select: { id: true, status: true } },
      },
    });

    if (!payment) {
      return { error: "Payment not found for this transaction." };
    }

    if (payment.status === "SUCCEEDED") {
      await ensureCommissionForBooking(payment.booking.id);
      return { success: true, status: "SUCCEEDED" };
    }

    const verification = await chapaVerify(txRef);

    if (
      verification.status === "success" &&
      verification.data?.status === "success"
    ) {
      await db.$transaction([
        db.payment.update({
          where: { id: payment.id },
          data: { status: "SUCCEEDED" },
        }),
        db.booking.update({
          where: { id: payment.booking.id },
          data: { status: "CONFIRMED" },
        }),
      ]);

      await ensureCommissionForBooking(payment.booking.id);

      // -----------------------------------------------------------------------
      // Fire-and-forget payment receipt email
      // -----------------------------------------------------------------------
      sendPaymentReceiptEmail(payment.booking.id).catch((err) => {
        console.error("Payment receipt email error:", err);
      });

      return { success: true, status: "SUCCEEDED" };
    }

    if (verification.data?.status === "failed") {
      await db.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      });
      return { success: false, status: "FAILED" };
    }

    return { success: false, status: "PENDING" };
  } catch (error) {
    console.error("Verify payment error:", error);
    return { error: "Failed to verify payment. Please try again." };
  }
}

/**
 * Wrapper around verifyPayment that includes cache revalidation.
 */
export async function verifyPaymentAndRevalidate(
  txRef: string
): Promise<VerifyPaymentResult> {
  const result = await verifyPayment(txRef);

  if (result.success && result.status === "SUCCEEDED") {
    revalidatePath("/bookings");
    revalidatePath("/dashboard/bookings");
  }

  return result;
}
