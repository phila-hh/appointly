/**
 * @file Payment Server Actions
 * @description Server-side functions for Chapa payment initialization,
 * verification, and refund processing.
 *
 * Payment flow:
 *   1. initializePayment  — creates a Chapa checkout session
 *   2. Customer pays on Chapa's hosted page
 *   3. verifyPayment      — confirms payment status via Chapa API
 *   4. Updates payment + booking records accordingly
 *   5. Sends payment receipt email on successful payment
 *
 * Refund flow:
 *   1. processRefund is called when a booking is cancelled and the
 *      customer is eligible for a refund (paid + within free window,
 *      or cancelled by the business owner)
 *   2. Payment refundStatus is set to "PENDING_REFUND" immediately
 *   3. chapaRefund() is called — test mode simulates success,
 *      live mode calls the real Chapa API
 *   4. On success: refundStatus → "REFUNDED", refundedAt → now()
 *   5. Commission is reversed if it has not yet been included in a payout
 *   6. Customer receives PAYMENT_REFUNDED in-app notification
 *   7. Customer receives refund confirmation email
 *   8. Admin receives REFUND_ISSUED in-app notification for oversight
 *
 * Commission reversal rules:
 *   - PENDING commission   → deleted (clean reversal, no payout impact)
 *   - INCLUDED_IN_PAYOUT   → cannot be cleanly reversed; flagged for
 *                            manual admin review via REFUND_ISSUED notification
 *   - PAID_OUT             → same as above — admin handles manually
 */

"use server";

import { revalidatePath } from "next/cache";

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import {
  chapaInitialize,
  chapaVerify,
  chapaRefund,
  generateTxRef,
} from "@/lib/chapa";
import {
  sendPaymentReceiptEmail,
  sendPaymentRefundedEmail,
} from "@/lib/email-service";
import { createNotification } from "@/lib/actions/notification";

// =============================================================================
// Types
// =============================================================================

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

// =============================================================================
// Helpers
// =============================================================================

/**
 * Rounds a currency value to 2 decimal places.
 * Prevents floating-point drift in commission calculations.
 */
function roundCurrency(value: number): number {
  return Number(value.toFixed(2));
}

/**
 * Creates a commission record for a booking if one does not already exist.
 *
 * Called after payment is confirmed — either via the verify endpoint
 * or the Chapa webhook. The double-call is safe because we check for
 * an existing commission before creating.
 *
 * @param bookingId - The booking to create a commission for
 */
async function ensureCommissionForBooking(bookingId: string): Promise<void> {
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
 * Reverses the commission for a cancelled booking.
 *
 * Reversal rules:
 *   - PENDING commission: deleted — clean reversal with no payout impact.
 *   - INCLUDED_IN_PAYOUT or PAID_OUT: cannot be deleted (already batched or
 *     disbursed). Logs a warning and sends an admin REFUND_ISSUED notification
 *     so the finance team can handle it manually.
 *
 * This function is called by processRefund after a successful refund.
 * Failures are caught and logged but never re-thrown — a commission reversal
 * failure must never prevent the refund record from being updated.
 *
 * @param bookingId - The booking whose commission should be reversed
 */
async function reverseCommission(bookingId: string): Promise<void> {
  try {
    const commission = await db.commission.findUnique({
      where: { bookingId },
      select: { id: true, status: true, commissionAmount: true },
    });

    if (!commission) {
      // No commission record — nothing to reverse (e.g. payment was never confirmed)
      return;
    }

    if (commission.status === "PENDING") {
      // Safe to delete — has not yet been included in any payout batch
      await db.commission.delete({ where: { id: commission.id } });
      console.log(`💸 Commission reversed (deleted) for booking ${bookingId}.`);
      return;
    }

    // Commission is in a payout batch or already paid out — cannot delete.
    // Log a warning and notify admin for manual handling.
    console.warn(
      `⚠️ Commission for booking ${bookingId} is ${commission.status} — ` +
        `manual admin review required. Amount: ${commission.commissionAmount} ETB.`
    );

    // Notify all admins about the commission that needs manual handling
    const admins = await db.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    await Promise.all(
      admins.map((admin) =>
        createNotification({
          userId: admin.id,
          type: "REFUND_ISSUED",
          title: "Manual Commission Review Required",
          message: `A refund was issued for a booking whose commission is already ${commission.status.toLowerCase().replace("_", " ")}. Manual adjustment needed.`,
          link: `/admin/finance/commissions`,
        })
      )
    );
  } catch (error) {
    // Non-fatal — log and continue
    console.error("reverseCommission error:", error);
  }
}

// =============================================================================
// Refund Processing (Internal — called by booking.ts)
// =============================================================================

/**
 * Processes a full refund for a cancelled booking.
 *
 * This function is called internally by updateBookingStatus in booking.ts
 * when a cancellation is eligible for a refund. It is exported so that
 * booking.ts can import it — it is NOT intended to be called directly
 * from client components.
 *
 * Steps:
 *   1. Fetch payment and booking data
 *   2. Guard: only process if payment is SUCCEEDED and not already refunded
 *   3. Mark payment as PENDING_REFUND immediately (so duplicate triggers are safe)
 *   4. Call chapaRefund() — test mode simulates, live mode calls real API
 *   5. On success: mark REFUNDED, set refundedAt, reverse commission
 *   6. On failure: mark NOT_ELIGIBLE with a log (manual admin follow-up)
 *   7. Notify customer (in-app + email) and admin
 *
 * @param bookingId - The booking to process a refund for
 */
export async function processRefund(bookingId: string): Promise<void> {
  try {
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        customerId: true,
        totalPrice: true,
        business: {
          select: {
            ownerId: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        service: {
          select: { name: true },
        },
        payment: {
          select: {
            id: true,
            status: true,
            refundStatus: true,
            chapaTransactionRef: true,
            amount: true,
          },
        },
      },
    });

    if (!booking?.payment) {
      console.warn(`processRefund: No payment found for booking ${bookingId}.`);
      return;
    }

    const { payment } = booking;

    // Guard: only refund succeeded payments
    if (payment.status !== "SUCCEEDED") {
      console.log(
        `processRefund: Payment for booking ${bookingId} is ${payment.status} — no refund needed.`
      );
      return;
    }

    // Guard: prevent duplicate refund processing
    if (
      payment.refundStatus === "PENDING_REFUND" ||
      payment.refundStatus === "REFUNDED"
    ) {
      console.log(
        `processRefund: Refund already in progress or completed for booking ${bookingId}.`
      );
      return;
    }

    if (!payment.chapaTransactionRef) {
      console.warn(
        `processRefund: No transaction reference for booking ${bookingId} — cannot refund.`
      );
      return;
    }

    // Step 1: Mark as pending immediately to prevent duplicate triggers
    await db.payment.update({
      where: { id: payment.id },
      data: { refundStatus: "PENDING_REFUND" },
    });

    console.log(
      `💸 Processing refund for booking ${bookingId}, ` +
        `tx_ref=${payment.chapaTransactionRef}, amount=${Number(payment.amount)} ETB`
    );

    // Step 2: Call Chapa refund API (or simulate in test mode)
    const refundResult = await chapaRefund(
      payment.chapaTransactionRef,
      Number(payment.amount)
    );

    if (refundResult.status === "success") {
      // Step 3: Mark as refunded
      await db.payment.update({
        where: { id: payment.id },
        data: {
          refundStatus: "REFUNDED",
          refundedAt: new Date(),
        },
      });

      console.log(`✅ Refund successful for booking ${bookingId}.`);

      // Step 4: Reverse commission
      await reverseCommission(bookingId);

      // Step 5: In-app notification — customer
      await createNotification({
        userId: booking.customerId,
        type: "PAYMENT_REFUNDED",
        title: "Refund Processed",
        message: `Your refund of ETB ${Number(payment.amount).toFixed(2)} for ${booking.service.name} is being processed. Allow 3–5 business days.`,
        link: `/bookings/${bookingId}`,
      });

      // Step 6: In-app notification — admins (financial oversight)
      const admins = await db.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
      });

      await Promise.all(
        admins.map((admin) =>
          createNotification({
            userId: admin.id,
            type: "REFUND_ISSUED",
            title: "Refund Issued",
            message: `A refund of ETB ${Number(payment.amount).toFixed(2)} was issued for a cancelled ${booking.service.name} booking.`,
            link: `/admin/finance`,
          })
        )
      );

      // Step 7: Refund confirmation email — fire-and-forget
      sendPaymentRefundedEmail(bookingId).catch((err) => {
        console.error("sendPaymentRefundedEmail error:", err);
      });
    } else {
      // Chapa refund API returned a failure
      console.error(
        `❌ Refund failed for booking ${bookingId}: ${refundResult.message}`
      );

      // Mark as not eligible so we don't retry indefinitely —
      // admin will be notified via REFUND_ISSUED to handle manually
      await db.payment.update({
        where: { id: payment.id },
        data: { refundStatus: "NOT_ELIGIBLE" },
      });

      // Notify admins of the failed refund for manual follow-up
      const admins = await db.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
      });

      await Promise.all(
        admins.map((admin) =>
          createNotification({
            userId: admin.id,
            type: "REFUND_ISSUED",
            title: "Refund Failed — Manual Action Required",
            message: `Automatic refund failed for a ${booking.service.name} booking. Chapa response: ${refundResult.message}`,
            link: `/admin/finance`,
          })
        )
      );
    }
  } catch (error) {
    console.error("processRefund error:", error);
    // Non-fatal at the call site — booking.ts calls this fire-and-forget
  }
}

// =============================================================================
// Initialize Payment
// =============================================================================

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

// =============================================================================
// Verify Payment
// =============================================================================

/**
 * Verifies a Chapa transaction and updates payment + booking status.
 *
 * Sends payment receipt email and BOOKING_CONFIRMED in-app notification
 * to the customer on successful verification.
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
        booking: {
          select: {
            id: true,
            status: true,
            customerId: true,
            business: { select: { name: true } },
            service: { select: { name: true } },
          },
        },
      },
    });

    if (!payment) {
      return { error: "Payment not found for this transaction." };
    }

    // Already verified — idempotent
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
      // Fire-and-forget: receipt email + BOOKING_CONFIRMED notification
      // -----------------------------------------------------------------------
      Promise.all([
        sendPaymentReceiptEmail(payment.booking.id),
        createNotification({
          userId: payment.booking.customerId,
          type: "BOOKING_CONFIRMED",
          title: "Booking Confirmed!",
          message: `Your payment was received and your ${payment.booking.service.name} appointment at ${payment.booking.business.name} is confirmed.`,
          link: `/bookings/${payment.booking.id}`,
        }),
      ]).catch((err) => {
        console.error("Payment confirmation notification error:", err);
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

// =============================================================================
// Verify Payment With Revalidation
// =============================================================================

/**
 * Wrapper around verifyPayment that includes cache revalidation.
 * Called from the payment-success page after the customer returns
 * from Chapa's checkout.
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
