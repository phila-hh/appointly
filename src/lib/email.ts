/**
 * @file Email Client
 * @description Email sending utility using Nodemailer with SMTP.
 *
 * Uses Gmail SMTP for development and demos. Can be swapped to any
 * SMTP provider (SendGrid, Mailgun, AWS SES) or back to Resend for
 * production by changing this single file.
 *
 * All email sends in the application go through `sendEmail()`.
 * The function NEVER throws — all errors are caught and returned
 * in the result object.
 *
 * Transport priority:
 *   1. SMTP (Nodemailer) — if SMTP_HOST is set
 *   2. Resend API — if RESEND_API_KEY is set (production fallback)
 *   3. Console-only — if neither is configured (logs email content)
 *
 * @see https://nodemailer.com/
 */

import nodemailer from "nodemailer";

// =============================================================================
// Transport Setup
// =============================================================================

/** Cached Nodemailer transport instance. */
let _transport: nodemailer.Transporter | null = null;

/**
 * Gets or creates the Nodemailer SMTP transport.
 * Returns null if SMTP credentials are not configured.
 */
function getTransport(): nodemailer.Transporter | null {
  if (_transport) return _transport;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn(
      "⚠️ SMTP credentials not set — emails will be logged to console only."
    );
    return null;
  }

  _transport = nodemailer.createTransport({
    host,
    port: parseInt(port ?? "587", 10),
    secure: false, // true for 465, false for other ports (STARTTLS)
    auth: {
      user,
      pass,
    },
  });

  return _transport;
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
  /** HTML content of the email. */
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
 * Must match the SMTP_USER for Gmail, or be a verified sender
 * for other SMTP providers.
 */
const FROM_ADDRESS =
  process.env.EMAIL_FROM ?? "Appointly <noreply@appointly.com>";

// =============================================================================
// Send Function
// =============================================================================

/**
 * Sends an email via SMTP (Nodemailer).
 *
 * This function NEVER throws. All errors are caught and returned
 * in the result object. Callers should check `result.success` but
 * should NOT block user-facing operations on email failure.
 *
 * If SMTP is not configured, the email content is logged to the
 * console for development visibility.
 *
 * @param params - Email parameters (to, subject, html)
 * @returns SendEmailResult with success status
 */
export async function sendEmail(
  params: SendEmailParams
): Promise<SendEmailResult> {
  const { to, subject, html, text } = params;

  // Log all email attempts
  console.log(`📧 Sending email: "${subject}" → ${to}`);

  try {
    const transport = getTransport();

    if (!transport) {
      // No SMTP configured — log to console for development
      console.log("📧 ═══════════════════════════════════════════════");
      console.log(`📧 TO:      ${to}`);
      console.log(`📧 FROM:    ${FROM_ADDRESS}`);
      console.log(`📧 SUBJECT: ${subject}`);
      console.log("📧 ═══════════════════════════════════════════════");
      console.log("📧 Email logged to console (SMTP not configured).");
      console.log(
        "📧 Set SMTP_HOST, SMTP_USER, SMTP_PASS to send real emails."
      );
      console.log("📧 ═══════════════════════════════════════════════");

      return {
        success: true, // Return success so the app flow continues
        messageId: `console-${Date.now()}`,
      };
    }

    // Send via SMTP
    const info = await transport.sendMail({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
      text,
    });

    console.log(`📧 Email sent successfully: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown email error";
    console.error("📧 Email send error:", message);
    return { success: false, error: message };
  }
}
