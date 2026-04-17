/**
 * @file Email Verification API Route
 * @description Handles email verification link clicks.
 *
 * When a user clicks the verification link in their email:
 *   1. Extract and validate the signed token
 *   2. Find the user by email
 *   3. Set emailVerified to current timestamp
 *   4. Send welcome email
 *   5. Redirect to verification result page
 *
 * URL: GET /api/auth/verify-email?token=...
 */

import { NextRequest, NextResponse } from "next/server";

import db from "@/lib/db";
import { validateVerificationToken } from "@/lib/email-utils";
import { sendEmail } from "@/lib/email";
import { renderWelcomeEmail } from "@/emails/welcome";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";

  // -------------------------------------------------------------------------
  // Validate token
  // -------------------------------------------------------------------------

  if (!token) {
    return NextResponse.redirect(
      `${baseUrl}/verify-email?status=error&message=Missing verification token.`
    );
  }

  const email = validateVerificationToken(token);

  if (!email) {
    return NextResponse.redirect(
      `${baseUrl}/verify-email?status=error&message=Invalid or expired verification link. Please request a new one.`
    );
  }

  // -------------------------------------------------------------------------
  // Find and update user
  // -------------------------------------------------------------------------

  try {
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.redirect(
        `${baseUrl}/verify-email?status=error&message=Account not found.`
      );
    }

    // Already verified — redirect to success anyway
    if (user.emailVerified) {
      return NextResponse.redirect(
        `${baseUrl}/verify-email?status=success&message=Email already verified. You can sign in.`
      );
    }

    // Mark email as verified
    await db.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });

    // Send welcome email (fire-and-forget)
    try {
      const html = await renderWelcomeEmail({
        userName: user.name ?? "there",
        userRole: user.role as "CUSTOMER" | "BUSINESS_OWNER",
      });

      await sendEmail({
        to: user.email,
        subject: "Welcome to Appointly! 🎉",
        html,
      });
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
    }

    return NextResponse.redirect(
      `${baseUrl}/verify-email?status=success&message=Email verified successfully! You can now sign in.`
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.redirect(
      `${baseUrl}/verify-email?status=error&message=Something went wrong. Please try again.`
    );
  }
}
