/**
 * @file Auto-Cancel Cron Job
 * @description Scheduled API route that automatically cancels unpaid bookings
 * after 1 hour and sends a 15-minute warning email before cancellation.
 *
 * Triggered by Vercel Cron every 5 minutes (configured in vercel.json).
 * Can also be triggered manually with the correct Authorization header.
 *
 * Algorithm (three passes per run):
 *
 *   Pass 1 — Auto-cancel:
 *     Find PENDING bookings where:
 *       - payment.status != "SUCCEEDED" (not paid)
 *       - createdAt <= now - 60 minutes (past the 1-hour window)
 *     Action: cancel booking, create in-app notification for customer,
 *             revalidate affected paths
 *
 *   Pass 2 — Expiry warning:
 *     Find PENDING bookings where:
 *       - payment.status != "SUCCEEDED" (not paid)
 *       - createdAt <= now - 45 minutes (15 minutes before auto-cancel)
 *       - createdAt > now - 60 minutes (not yet in the cancel window)
 *       - warningEmailSentAt IS NULL (warning not yet sent)
 *     Action: send expiring-soon email, set warningEmailSentAt = now()
 *
 *   Pass 3 — Notification cleanup:
 *     Delete all notifications older than 30 days.
 *     Piggybacked on this cron to avoid a separate scheduled job.
 *
 * Security:
 *   - Requests must include Authorization: Bearer ${CRON_SECRET}
 *   - Vercel automatically sends this header from its cron infrastructure
 *
 * Idempotency:
 *   - Auto-cancel: PENDING → CANCELLED transition is idempotent (already-
 *     cancelled bookings are excluded by the status filter)
 *   - Warning email: warningEmailSentAt flag prevents duplicate sends even
 *     if the cron runs twice within the same 5-minute window
 *
 * @see https://vercel.com/docs/cron-jobs
 */

import { NextRequest, NextResponse } from "next/server";
import { subMinutes, subDays } from "date-fns";

import db from "@/lib/db";
import { sendBookingExpiringSoonEmail } from "@/lib/email-service";
import { createNotification } from "@/lib/actions/notification";
import { revalidatePath } from "next/cache";

// =============================================================================
// Route Handler
// =============================================================================

/**
 * GET /api/cron/auto-cancel
 *
 * Vercel Cron sends GET requests. The Authorization header contains
 * `Bearer ${CRON_SECRET}` automatically.
 */
export async function GET(request: NextRequest) {
  // -------------------------------------------------------------------------
  // Step 1: Authorize the request
  // -------------------------------------------------------------------------

  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn("⚠️ CRON_SECRET not set — cron endpoint is unprotected.");
  }

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const now = new Date();

  console.log(`🕐 Auto-cancel cron running at ${now.toISOString()}`);

  // -------------------------------------------------------------------------
  // Pass 1: Auto-cancel bookings older than 60 minutes
  // -------------------------------------------------------------------------

  /**
   * The auto-cancel threshold: bookings created more than 60 minutes ago
   * that still have not been paid are cancelled automatically.
   */
  const cancelThreshold = subMinutes(now, 60);

  const bookingsToCancel = await db.booking.findMany({
    where: {
      status: "PENDING",
      createdAt: { lte: cancelThreshold },
      payment: {
        status: { not: "SUCCEEDED" },
      },
    },
    select: {
      id: true,
      customerId: true,
      business: {
        select: { name: true },
      },
      service: {
        select: { name: true },
      },
    },
  });

  const cancelResults = {
    attempted: bookingsToCancel.length,
    cancelled: 0,
    failed: 0,
  };

  for (const booking of bookingsToCancel) {
    try {
      await db.booking.update({
        where: { id: booking.id },
        data: { status: "CANCELLED" },
      });

      // In-app notification — customer needs to know their slot was released
      await createNotification({
        userId: booking.customerId,
        type: "BOOKING_CANCELLED",
        title: "Booking Expired",
        message: `Your unpaid ${booking.service.name} booking at ${booking.business.name} was automatically cancelled. The slot has been released.`,
        link: `/bookings/${booking.id}`,
      });

      cancelResults.cancelled++;

      console.log(
        `   ✅ Auto-cancelled booking ${booking.id} (payment not received within 1 hour).`
      );
    } catch (error) {
      cancelResults.failed++;
      console.error(
        `   ❌ Failed to auto-cancel booking ${booking.id}:`,
        error
      );
    }
  }

  // Revalidate booking pages once after all cancellations (batch revalidation)
  if (cancelResults.cancelled > 0) {
    revalidatePath("/bookings");
    revalidatePath("/dashboard/bookings");
  }

  // -------------------------------------------------------------------------
  // Pass 2: Send 15-minute warning emails (bookings 45–60 minutes old)
  // -------------------------------------------------------------------------

  /**
   * Warning window: bookings created between 45 and 60 minutes ago.
   *   - lte warningThreshold  → at least 45 minutes old
   *   - gt  cancelThreshold   → not yet past the 60-minute cancel point
   *
   * The warningEmailSentAt IS NULL guard ensures we send each warning
   * exactly once, even if the cron runs multiple times within the window.
   */
  const warningThreshold = subMinutes(now, 45);

  const bookingsToWarn = await db.booking.findMany({
    where: {
      status: "PENDING",
      createdAt: {
        lte: warningThreshold,
        gt: cancelThreshold,
      },
      warningEmailSentAt: null,
      payment: {
        status: { not: "SUCCEEDED" },
      },
    },
    select: {
      id: true,
    },
  });

  const warnResults = {
    attempted: bookingsToWarn.length,
    sent: 0,
    failed: 0,
  };

  for (const booking of bookingsToWarn) {
    try {
      // Send the urgency email
      await sendBookingExpiringSoonEmail(booking.id);

      // Mark warning as sent — prevents duplicate emails on subsequent runs
      await db.booking.update({
        where: { id: booking.id },
        data: { warningEmailSentAt: now },
      });

      warnResults.sent++;

      console.log(`   📧 Expiry warning sent for booking ${booking.id}.`);
    } catch (error) {
      warnResults.failed++;
      console.error(
        `   ❌ Failed to send warning for booking ${booking.id}:`,
        error
      );
    }
  }

  // -------------------------------------------------------------------------
  // Pass 3: Clean up notifications older than 30 days
  // -------------------------------------------------------------------------

  const notificationCutoff = subDays(now, 30);

  let deletedNotificationCount = 0;

  try {
    const deleteResult = await db.notification.deleteMany({
      where: {
        createdAt: { lte: notificationCutoff },
      },
    });

    deletedNotificationCount = deleteResult.count;

    if (deletedNotificationCount > 0) {
      console.log(
        `   🗑️  Cleaned up ${deletedNotificationCount} notification(s) older than 30 days.`
      );
    }
  } catch (error) {
    console.error("   ❌ Notification cleanup failed:", error);
  }

  // -------------------------------------------------------------------------
  // Return summary
  // -------------------------------------------------------------------------

  const summary = {
    runAt: now.toISOString(),
    autoCancelled: cancelResults,
    warningEmails: warnResults,
    notificationsDeleted: deletedNotificationCount,
  };

  console.log("✅ Auto-cancel cron complete:", summary);

  return NextResponse.json(summary);
}
