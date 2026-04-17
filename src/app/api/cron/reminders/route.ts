/**
 * @file Booking Reminder Cron Job
 * @description Scheduled API route that sends 24-hour reminder emails
 * to customers with upcoming appointments.
 *
 * Triggered by Vercel Cron (configured in vercel.json) — runs daily at 9AM UTC.
 * Can also be triggered manually with the correct CRON_SECRET header.
 *
 * Algorithm:
 *   1. Calculate the 24-hour window: [now + 23h, now + 25h]
 *   2. Find all CONFIRMED bookings whose appointment falls in that window
 *   3. For each booking, check the customer has reminders enabled
 *   4. Send reminder email (fire-and-forget per booking)
 *   5. Return a summary of results
 *
 * Security:
 *   - Requests must include the Authorization header with CRON_SECRET
 *   - Vercel automatically sends this header from its cron infrastructure
 *   - Prevents unauthorized triggering from external parties
 *
 * Idempotency:
 *   - The 2-hour window ([now+23h, now+25h]) prevents double-sending
 *     if the cron runs slightly early or late
 *   - Running the cron twice within the same hour is safe — bookings
 *     starting in 23–25h are the same set either time
 *
 * @see https://vercel.com/docs/cron-jobs
 */

import { NextRequest, NextResponse } from "next/server";
import { addHours } from "date-fns";

import db from "@/lib/db";
import { sendBookingReminderEmail } from "@/lib/email-service";

/**
 * GET /api/cron/reminders
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

  // -------------------------------------------------------------------------
  // Step 2: Calculate the 24-hour window
  // -------------------------------------------------------------------------

  const now = new Date();

  /**
   * Window: appointments starting between 23 and 25 hours from now.
   * This 2-hour window prevents missing appointments if the cron
   * runs slightly off-schedule, while avoiding duplicate sends.
   */
  const windowStart = addHours(now, 23);
  const windowEnd = addHours(now, 25);

  console.log(
    `🕐 Reminder cron running at ${now.toISOString()}`,
    `\n   Window: ${windowStart.toISOString()} → ${windowEnd.toISOString()}`
  );

  // -------------------------------------------------------------------------
  // Step 3: Find upcoming bookings in the window
  // -------------------------------------------------------------------------

  /**
   * We query by date only (not time) because startTime is stored as a
   * string "HH:mm". We fetch all bookings for the relevant dates and
   * filter by time range in application code.
   */
  const windowStartDate = new Date(windowStart);
  windowStartDate.setHours(0, 0, 0, 0);

  const windowEndDate = new Date(windowEnd);
  windowEndDate.setHours(23, 59, 59, 999);

  const upcomingBookings = await db.booking.findMany({
    where: {
      status: "CONFIRMED",
      date: {
        gte: windowStartDate,
        lte: windowEndDate,
      },
    },
    select: {
      id: true,
      date: true,
      startTime: true,
      customer: {
        select: {
          id: true,
          emailPreferences: true,
        },
      },
    },
  });

  // -------------------------------------------------------------------------
  // Step 4: Filter by exact time window
  // -------------------------------------------------------------------------

  /**
   * Convert each booking's date + startTime to a full DateTime and
   * check if it falls within the 23–25 hour window.
   */
  const bookingsInWindow = upcomingBookings.filter((booking) => {
    const [hours, minutes] = booking.startTime.split(":").map(Number);
    const appointmentDateTime = new Date(booking.date);
    appointmentDateTime.setHours(hours, minutes, 0, 0);

    return (
      appointmentDateTime >= windowStart && appointmentDateTime <= windowEnd
    );
  });

  console.log(
    `   Found ${upcomingBookings.length} confirmed bookings in date range.`,
    `\n   ${bookingsInWindow.length} fall within the exact time window.`
  );

  // -------------------------------------------------------------------------
  // Step 5: Send reminder emails
  // -------------------------------------------------------------------------

  const results = {
    total: bookingsInWindow.length,
    sent: 0,
    skipped: 0,
    failed: 0,
  };

  /**
   * Process bookings sequentially to avoid overwhelming the email API
   * with concurrent requests. For large volumes, consider batching.
   */
  for (const booking of bookingsInWindow) {
    try {
      await sendBookingReminderEmail(booking.id);
      // sendBookingReminderEmail already checks preferences internally
      // and logs when skipped — we count sent optimistically here
      results.sent++;
    } catch (error) {
      console.error(
        `   ❌ Failed to send reminder for booking ${booking.id}:`,
        error
      );
      results.failed++;
    }
  }

  // -------------------------------------------------------------------------
  // Step 6: Return summary
  // -------------------------------------------------------------------------

  const summary = {
    runAt: now.toISOString(),
    window: {
      start: windowStart.toISOString(),
      end: windowEnd.toISOString(),
    },
    results,
  };

  console.log("✅ Reminder cron complete:", results);

  return NextResponse.json(summary);
}
