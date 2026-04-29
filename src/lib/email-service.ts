/**
 * @file Email Service
 * @description High-level email sending functions for each email type.
 *
 * Each function in this file:
 *   1. Fetches all required data from the database
 *   2. Checks user email preferences (for optional email types)
 *   3. Renders the appropriate template
 *   4. Calls sendEmail() and returns the result
 *
 * These functions are called from server actions and API routes.
 * All functions are fire-and-forget safe — they never throw.
 *
 * Naming convention:
 *   - sendBookingConfirmationEmail(bookingId)
 *   - sendNewBookingNotificationEmail(bookingId)
 *   - sendPaymentReceiptEmail(bookingId)
 *   - sendBookingReminderEmail(bookingId)
 *   - sendBookingCancelledEmails(bookingId, cancelledBy, reason?)
 *   - sendReviewRequestEmail(bookingId)
 *   - sendBookingRescheduledEmail(bookingId, oldDate, oldStartTime, rescheduleCount)
 *   - sendPaymentRefundedEmail(bookingId)
 *   - sendBookingExpiringSoonEmail(bookingId)
 */

import { format } from "date-fns";

import db from "@/lib/db";
import { sendEmail } from "@/lib/email";
import {
  generateUnsubscribeToken,
  buildUnsubscribeUrl,
  isEmailTypeEnabled,
} from "@/lib/email-utils";
import { formatPrice } from "@/lib/utils";
import { formatTime24to12 } from "@/constants/time";
import { renderBookingConfirmationEmail } from "@/emails/booking-confirmation";
import { renderNewBookingNotificationEmail } from "@/emails/new-booking-notification";
import { renderPaymentReceiptEmail } from "@/emails/payment-receipt";
import { renderBookingReminderEmail } from "@/emails/booking-reminder";
import { renderBookingCancelledEmail } from "@/emails/booking-cancelled";
import { renderReviewRequestEmail } from "@/emails/review-request";
import { renderBookingRescheduledEmail } from "@/emails/booking-rescheduled";
import { renderPaymentRefundedEmail } from "@/emails/payment-refunded";
import { renderBookingExpiringSoonEmail } from "@/emails/booking-expiring-soon";

// =============================================================================
// Helpers
// =============================================================================

const BASE_URL = process.env.AUTH_URL ?? "http://localhost:3000";

/**
 * Platform support email shown in refund emails.
 * Customers contact Appointly — not the business — for payment issues.
 */
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? "support@appointly.com";

/**
 * Fetches a booking with all related data needed for email sending.
 * Centralized to avoid duplicating includes across email functions.
 */
async function getBookingForEmail(bookingId: string) {
  return db.booking.findUnique({
    where: { id: bookingId },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          emailPreferences: true,
        },
      },
      business: {
        select: {
          name: true,
          address: true,
          city: true,
          phone: true,
          email: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              emailPreferences: true,
            },
          },
        },
      },
      service: {
        select: { name: true, price: true },
      },
      staff: {
        select: { name: true },
      },
      payment: {
        select: {
          chapaTransactionRef: true,
          amount: true,
          refundStatus: true,
        },
      },
    },
  });
}

/**
 * Formats booking date and time for display in emails.
 */
function formatBookingDateTime(booking: {
  date: Date;
  startTime: string;
  endTime: string;
}) {
  const serviceDate = format(booking.date, "EEEE, MMMM d, yyyy");
  const serviceTime = `${formatTime24to12(booking.startTime)} – ${formatTime24to12(booking.endTime)}`;
  return { serviceDate, serviceTime };
}

// =============================================================================
// Existing Email Senders (unchanged)
// =============================================================================

/**
 * Sends booking confirmation to the customer after booking creation.
 * This is a transactional email — it cannot be unsubscribed from.
 *
 * @param bookingId - The newly created booking ID
 */
export async function sendBookingConfirmationEmail(
  bookingId: string
): Promise<void> {
  try {
    const booking = await getBookingForEmail(bookingId);
    if (!booking) return;

    const { serviceDate, serviceTime } = formatBookingDateTime(booking);
    const businessAddress = [booking.business.address, booking.business.city]
      .filter(Boolean)
      .join(", ");

    const html = await renderBookingConfirmationEmail({
      customerName: booking.customer.name ?? "there",
      businessName: booking.business.name,
      businessPhone: booking.business.phone,
      businessAddress: businessAddress || null,
      serviceName: booking.service.name,
      serviceDate,
      serviceTime,
      totalPrice: formatPrice(Number(booking.totalPrice)),
      staffName: booking.staff?.name ?? null,
      bookingId,
      payUrl: `${BASE_URL}/bookings/${bookingId}/pay`,
    });

    await sendEmail({
      to: booking.customer.email,
      subject: `Booking Confirmed — ${booking.service.name} at ${booking.business.name}`,
      html,
    });
  } catch (error) {
    console.error("sendBookingConfirmationEmail error:", error);
  }
}

/**
 * Sends a new booking notification to the business owner after booking
 * creation. This is a transactional email — cannot be unsubscribed from.
 *
 * @param bookingId - The newly created booking ID
 */
export async function sendNewBookingNotificationEmail(
  bookingId: string
): Promise<void> {
  try {
    const booking = await getBookingForEmail(bookingId);
    if (!booking) return;

    const { serviceDate, serviceTime } = formatBookingDateTime(booking);

    const html = await renderNewBookingNotificationEmail({
      businessOwnerName: booking.business.owner.name ?? "there",
      businessName: booking.business.name,
      customerName: booking.customer.name ?? "Customer",
      customerEmail: booking.customer.email,
      customerPhone: booking.customer.phone,
      serviceName: booking.service.name,
      serviceDate,
      serviceTime,
      totalPrice: formatPrice(Number(booking.totalPrice)),
      staffName: booking.staff?.name ?? null,
      customerNotes: booking.notes,
      bookingId,
      dashboardUrl: `${BASE_URL}/dashboard/bookings`,
    });

    await sendEmail({
      to: booking.business.owner.email,
      subject: `New Booking — ${booking.customer.name ?? "A customer"} booked ${booking.service.name}`,
      html,
    });
  } catch (error) {
    console.error("sendNewBookingNotificationEmail error:", error);
  }
}

/**
 * Sends a payment receipt to the customer after successful payment.
 * This is a transactional email — cannot be unsubscribed from.
 *
 * @param bookingId - The booking that was paid for
 */
export async function sendPaymentReceiptEmail(
  bookingId: string
): Promise<void> {
  try {
    const booking = await getBookingForEmail(bookingId);
    if (!booking) return;

    const { serviceDate, serviceTime } = formatBookingDateTime(booking);
    const businessAddress = [booking.business.address, booking.business.city]
      .filter(Boolean)
      .join(", ");

    const html = await renderPaymentReceiptEmail({
      customerName: booking.customer.name ?? "there",
      businessName: booking.business.name,
      businessAddress: businessAddress || null,
      businessPhone: booking.business.phone,
      serviceName: booking.service.name,
      serviceDate,
      serviceTime,
      totalPrice: formatPrice(Number(booking.totalPrice)),
      staffName: booking.staff?.name ?? null,
      transactionRef: booking.payment?.chapaTransactionRef ?? "N/A",
      bookingId,
      bookingUrl: `${BASE_URL}/bookings/${bookingId}`,
    });

    await sendEmail({
      to: booking.customer.email,
      subject: `Payment Receipt — ${booking.service.name} at ${booking.business.name}`,
      html,
    });
  } catch (error) {
    console.error("sendPaymentReceiptEmail error:", error);
  }
}

/**
 * Sends a 24-hour reminder to the customer before their appointment.
 * This is an optional email — user can disable via email preferences.
 *
 * @param bookingId - The upcoming booking ID
 */
export async function sendBookingReminderEmail(
  bookingId: string
): Promise<void> {
  try {
    const booking = await getBookingForEmail(bookingId);
    if (!booking) return;

    if (
      !isEmailTypeEnabled(booking.customer.emailPreferences, "bookingReminders")
    ) {
      console.log(
        `📧 Booking reminder skipped — user ${booking.customer.id} has reminders disabled.`
      );
      return;
    }

    const { serviceDate, serviceTime } = formatBookingDateTime(booking);
    const businessAddress = [booking.business.address, booking.business.city]
      .filter(Boolean)
      .join(", ");

    const unsubToken = generateUnsubscribeToken(
      booking.customer.id,
      "bookingReminders"
    );
    const unsubscribeUrl = buildUnsubscribeUrl(unsubToken);

    const html = await renderBookingReminderEmail({
      customerName: booking.customer.name ?? "there",
      businessName: booking.business.name,
      businessAddress: businessAddress || null,
      businessPhone: booking.business.phone,
      serviceName: booking.service.name,
      serviceDate,
      serviceTime,
      staffName: booking.staff?.name ?? null,
      bookingId,
      bookingUrl: `${BASE_URL}/bookings/${bookingId}`,
      unsubscribeUrl,
    });

    await sendEmail({
      to: booking.customer.email,
      subject: `Reminder: ${booking.service.name} tomorrow at ${formatTime24to12(booking.startTime)}`,
      html,
    });
  } catch (error) {
    console.error("sendBookingReminderEmail error:", error);
  }
}

/**
 * Sends cancellation notifications to both the customer and business owner.
 * This is a transactional email — cannot be unsubscribed from.
 *
 * When the business cancels, the reason (if provided) is included in both
 * emails so the customer understands why their paid appointment was cancelled.
 *
 * @param bookingId    - The cancelled booking ID
 * @param cancelledBy  - Who initiated the cancellation
 * @param reason       - Optional reason (required when business cancels CONFIRMED)
 */
export async function sendBookingCancelledEmails(
  bookingId: string,
  cancelledBy: "customer" | "business",
  reason?: string
): Promise<void> {
  try {
    const booking = await getBookingForEmail(bookingId);
    if (!booking) return;

    const { serviceDate, serviceTime } = formatBookingDateTime(booking);

    // Send to customer
    const customerHtml = await renderBookingCancelledEmail({
      recipientName: booking.customer.name ?? "there",
      recipientType: "customer",
      businessName: booking.business.name,
      customerName: booking.customer.name ?? "Customer",
      serviceName: booking.service.name,
      serviceDate,
      serviceTime,
      bookingId,
      ctaUrl: `${BASE_URL}/browse`,
      cancelledBy,
      cancellationReason: reason,
    });

    await sendEmail({
      to: booking.customer.email,
      subject: `Booking Cancelled — ${booking.service.name} at ${booking.business.name}`,
      html: customerHtml,
    });

    // Send to business owner
    const businessHtml = await renderBookingCancelledEmail({
      recipientName: booking.business.owner.name ?? "there",
      recipientType: "business",
      businessName: booking.business.name,
      customerName: booking.customer.name ?? "Customer",
      serviceName: booking.service.name,
      serviceDate,
      serviceTime,
      bookingId,
      ctaUrl: `${BASE_URL}/dashboard/bookings`,
      cancelledBy,
      cancellationReason: reason,
    });

    await sendEmail({
      to: booking.business.owner.email,
      subject: `Booking Cancelled — ${booking.customer.name ?? "Customer"} cancelled ${booking.service.name}`,
      html: businessHtml,
    });
  } catch (error) {
    console.error("sendBookingCancelledEmails error:", error);
  }
}

/**
 * Sends a review request to the customer after a booking is completed.
 * This is an optional email — user can disable via email preferences.
 *
 * @param bookingId - The completed booking ID
 */
export async function sendReviewRequestEmail(bookingId: string): Promise<void> {
  try {
    const booking = await getBookingForEmail(bookingId);
    if (!booking) return;

    if (
      !isEmailTypeEnabled(booking.customer.emailPreferences, "reviewRequests")
    ) {
      console.log(
        `📧 Review request skipped — user ${booking.customer.id} has review requests disabled.`
      );
      return;
    }

    const serviceDate = format(booking.date, "MMMM d, yyyy");

    const unsubToken = generateUnsubscribeToken(
      booking.customer.id,
      "reviewRequests"
    );
    const unsubscribeUrl = buildUnsubscribeUrl(unsubToken);

    const html = await renderReviewRequestEmail({
      customerName: booking.customer.name ?? "there",
      businessName: booking.business.name,
      serviceName: booking.service.name,
      serviceDate,
      bookingId,
      reviewUrl: `${BASE_URL}/bookings/${bookingId}/review`,
      unsubscribeUrl,
    });

    await sendEmail({
      to: booking.customer.email,
      subject: `How was your appointment at ${booking.business.name}? Leave a review`,
      html,
    });
  } catch (error) {
    console.error("sendReviewRequestEmail error:", error);
  }
}

// =============================================================================
// New Email Senders
// =============================================================================

/**
 * Sends rescheduling confirmation emails to both the customer and the
 * business owner when a booking is moved to a new date and time.
 *
 * Both parties receive a variant of the same email:
 *   - Customer: reassuring tone, shows new booking details, reschedule count
 *   - Business: informational tone, shows customer name and dashboard link
 *
 * This is a transactional email — cannot be unsubscribed from.
 *
 * @param bookingId       - The rescheduled booking ID
 * @param oldDate         - The original appointment date (before reschedule)
 * @param oldStartTime    - The original start time in HH:mm format
 * @param rescheduleCount - How many times the booking has now been rescheduled
 */
export async function sendBookingRescheduledEmail(
  bookingId: string,
  oldDate: Date,
  oldStartTime: string,
  rescheduleCount: number
): Promise<void> {
  try {
    const booking = await getBookingForEmail(bookingId);
    if (!booking) return;

    const { serviceDate: newDate, serviceTime: newTime } =
      formatBookingDateTime(booking);

    const oldDateFormatted = format(oldDate, "EEEE, MMMM d, yyyy");
    const oldTimeFormatted = formatTime24to12(oldStartTime);

    // Customer email
    const customerHtml = await renderBookingRescheduledEmail({
      recipientName: booking.customer.name ?? "there",
      recipientType: "customer",
      businessName: booking.business.name,
      customerName: booking.customer.name ?? "Customer",
      serviceName: booking.service.name,
      oldDate: oldDateFormatted,
      oldTime: oldTimeFormatted,
      newDate,
      newTime,
      rescheduleCount,
      bookingId,
      ctaUrl: `${BASE_URL}/bookings/${bookingId}`,
    });

    await sendEmail({
      to: booking.customer.email,
      subject: `Appointment Rescheduled — ${booking.service.name} at ${booking.business.name}`,
      html: customerHtml,
    });

    // Business owner email
    const businessHtml = await renderBookingRescheduledEmail({
      recipientName: booking.business.owner.name ?? "there",
      recipientType: "business",
      businessName: booking.business.name,
      customerName: booking.customer.name ?? "Customer",
      serviceName: booking.service.name,
      oldDate: oldDateFormatted,
      oldTime: oldTimeFormatted,
      newDate,
      newTime,
      rescheduleCount,
      bookingId,
      ctaUrl: `${BASE_URL}/dashboard/bookings`,
    });

    await sendEmail({
      to: booking.business.owner.email,
      subject: `Booking Rescheduled — ${booking.customer.name ?? "Customer"} moved their ${booking.service.name}`,
      html: businessHtml,
    });
  } catch (error) {
    console.error("sendBookingRescheduledEmail error:", error);
  }
}

/**
 * Sends a refund confirmation email to the customer after a refund has
 * been successfully initiated via Chapa.
 *
 * Instructs the customer to contact Appointly support — not the business —
 * if the refund is not received within 5 business days.
 *
 * This is a transactional email — cannot be unsubscribed from.
 *
 * @param bookingId - The cancelled booking ID that was refunded
 */
export async function sendPaymentRefundedEmail(
  bookingId: string
): Promise<void> {
  try {
    const booking = await getBookingForEmail(bookingId);
    if (!booking) return;

    // Only send if the payment was actually refunded
    if (booking.payment?.refundStatus !== "REFUNDED") {
      console.log(
        `📧 Refund email skipped — booking ${bookingId} refund status is ${booking.payment?.refundStatus ?? "null"}.`
      );
      return;
    }

    const html = await renderPaymentRefundedEmail({
      customerName: booking.customer.name ?? "there",
      businessName: booking.business.name,
      serviceName: booking.service.name,
      refundAmount: formatPrice(
        Number(booking.payment?.amount ?? booking.totalPrice)
      ),
      transactionRef: booking.payment?.chapaTransactionRef ?? "N/A",
      bookingId,
      bookingUrl: `${BASE_URL}/bookings/${bookingId}`,
      supportEmail: SUPPORT_EMAIL,
    });

    await sendEmail({
      to: booking.customer.email,
      subject: `Refund Initiated — ${booking.service.name} at ${booking.business.name}`,
      html,
    });
  } catch (error) {
    console.error("sendPaymentRefundedEmail error:", error);
  }
}

/**
 * Sends an urgency email to the customer 15 minutes before their unpaid
 * booking is automatically cancelled by the auto-cancel cron job.
 *
 * Only sent if:
 *   - The booking payment status is still PENDING (not already paid)
 *   - The booking status is still PENDING (not already cancelled)
 *
 * The warningEmailSentAt guard in the cron prevents this from being
 * called more than once per booking.
 *
 * This is a transactional email — cannot be unsubscribed from.
 *
 * @param bookingId - The pending booking approaching auto-cancellation
 */
export async function sendBookingExpiringSoonEmail(
  bookingId: string
): Promise<void> {
  try {
    const booking = await getBookingForEmail(bookingId);
    if (!booking) return;

    // Guard: only send for still-pending, unpaid bookings
    if (
      booking.status !== "PENDING" ||
      booking.payment?.refundStatus === "REFUNDED"
    ) {
      return;
    }

    const { serviceDate, serviceTime } = formatBookingDateTime(booking);

    const html = await renderBookingExpiringSoonEmail({
      customerName: booking.customer.name ?? "there",
      businessName: booking.business.name,
      serviceName: booking.service.name,
      serviceDate,
      serviceTime,
      totalPrice: formatPrice(Number(booking.totalPrice)),
      payUrl: `${BASE_URL}/bookings/${bookingId}/pay`,
      bookingId,
    });

    await sendEmail({
      to: booking.customer.email,
      subject: `⚠️ Act now — your ${booking.service.name} booking expires in 15 minutes`,
      html,
    });
  } catch (error) {
    console.error("sendBookingExpiringSoonEmail error:", error);
  }
}
