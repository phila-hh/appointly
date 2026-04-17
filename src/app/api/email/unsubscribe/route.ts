/**
 * @file Email Unsubscribe API Route
 * @description One-click unsubscribe handler for optional email types.
 *
 * When a user clicks the unsubscribe link in an email:
 *   1. Extract and validate the signed token
 *   2. Update the user's email preferences in the database
 *   3. Redirect to the unsubscribe result page
 *
 * This route requires NO authentication — the signed token proves
 * identity without requiring a sign-in session.
 *
 * Only optional email types can be unsubscribed from:
 *   - bookingReminders
 *   - reviewRequests
 *   - marketingEmails
 *
 * Transactional emails (confirmation, receipt, cancellation) cannot
 * be unsubscribed from and do not include unsubscribe links.
 *
 * URL: GET /api/email/unsubscribe?token=...
 */

import { NextRequest, NextResponse } from "next/server";

import db from "@/lib/db";
import {
  validateUnsubscribeToken,
  parseEmailPreferences,
} from "@/lib/email-utils";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";

  // -------------------------------------------------------------------------
  // Validate token
  // -------------------------------------------------------------------------

  if (!token) {
    return NextResponse.redirect(
      `${baseUrl}/unsubscribe?status=error&message=Missing unsubscribe token.`
    );
  }

  const validated = validateUnsubscribeToken(token);

  if (!validated) {
    return NextResponse.redirect(
      `${baseUrl}/unsubscribe?status=error&message=Invalid or expired unsubscribe link.`
    );
  }

  const { userId, emailType } = validated;

  // -------------------------------------------------------------------------
  // Update user preferences
  // -------------------------------------------------------------------------

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, emailPreferences: true },
    });

    if (!user) {
      return NextResponse.redirect(
        `${baseUrl}/unsubscribe?status=error&message=Account not found.`
      );
    }

    // Parse existing preferences and update the specific type
    const currentPreferences = parseEmailPreferences(user.emailPreferences);
    const updatedPreferences = {
      ...currentPreferences,
      [emailType]: false,
    };

    await db.user.update({
      where: { id: userId },
      data: { emailPreferences: updatedPreferences },
    });

    // Human-readable label for the email type
    const emailTypeLabels: Record<string, string> = {
      bookingReminders: "appointment reminders",
      reviewRequests: "review request emails",
      marketingEmails: "marketing emails",
    };

    const typeLabel = emailTypeLabels[emailType] ?? emailType;

    return NextResponse.redirect(
      `${baseUrl}/unsubscribe?status=success&type=${encodeURIComponent(typeLabel)}`
    );
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return NextResponse.redirect(
      `${baseUrl}/unsubscribe?status=error&message=Something went wrong. Please try again.`
    );
  }
}
