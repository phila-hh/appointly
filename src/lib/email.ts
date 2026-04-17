/**
 * @file Email Client
 * @description Resend email client and send utility functions.
 *
 * Provides a centralized email sending function that:
 *   - Creates the Resend client singleton
 *   - Wraps sends with error handling (never throws)
 *   - Logs all email attempts for debugging
 *   - Returns success/failure result
 *
 * All email sends in the application should go through `sendEmail()`.
 *
 * @see https://resend.com/docs/send-with-nextjs
 */

import { Resend } from "resend";

// =============================================================================
// Client Singleton
// =============================================================================

let _resend: Resend | null = null;

/**
 * Gets or creates the Resend client singleton.
 */
function getResendClient(): Resend | null {
  if (_resend) return _resend;

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("⚠️ RESEND_API_KEY not set — emails will not be sent.");
    return null;
  }

  _resend = new Resend(apiKey);
  return _resend;
}

// =============================================================================
// Types
// =============================================================================

/** Parameters for sending an email. */
export interface SendEmailParams {
  /** Recipient email address. */
  to: string;
  /** Email subject line. */
  subject: string;
  /** React Email component rendered to HTML, OR raw HTML string. */
  html: string;
  /** Optional plain-text fallback. */
  text?: string;
}

/** Result of an email send attempt. */
export interface SendEmailResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

// =============================================================================
// Constants
// =============================================================================

/**
 * The "from" address for all emails.
 * Must be a verified domain in Resend, or use the default onboarding address.
 */
const FROM_ADDRESS =
  process.env.EMAIL_FROM ?? "Appointly <onboarding@resend.dev>";

// =============================================================================
// Send Function
// =============================================================================

/**
 * Sends an email via Resend.
 *
 * This function NEVER throws. All errors are caught and returned
 * in the result object. Callers should check `result.success` but
 * should NOT block user-facing operations on email failure.
 *
 * @param params - Email parameters (to, subject, html)
 * @returns SendEmailResult with success status
 *
 * @example
 * ```ts
 * const result = await sendEmail({
 *   to: "user@example.com",
 *   subject: "Booking Confirmed",
 *   html: "<h1>Your booking is confirmed!</h1>",
 * });
 *
 * if (!result.success) {
 *   console.warn("Email failed:", result.error);
 *   // But don't block the booking!
 * }
 * ```
 */
export async function sendEmail(
  params: SendEmailParams
): Promise<SendEmailResult> {
  const { to, subject, html, text } = params;

  // Log all email attempts for debugging
  console.log(`📧 Sending email: "${subject}" → ${to}`);

  try {
    const resend = getResendClient();

    if (!resend) {
      console.warn("📧 Email skipped (no API key):", subject);
      return { success: false, error: "Email client not configured." };
    }

    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      console.error("📧 Email send failed:", error);
      return { success: false, error: error.message };
    }

    console.log(`📧 Email sent successfully: ${data?.id}`);
    return { success: true, messageId: data?.id };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown email error";
    console.error("📧 Email send error:", message);
    return { success: false, error: message };
  }
}
