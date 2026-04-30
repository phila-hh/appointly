/**
 * @file Booking Cancelled Email Template
 * @description Sent to both the customer and business owner when a
 * booking is cancelled.
 *
 * The `recipientType` prop controls the message variant:
 *   - "customer" → cancellation from their perspective
 *   - "business" → cancellation notification for the owner
 *
 * The `cancelledBy` prop controls the reason messaging:
 *   - "customer"  → customer initiated the cancellation
 *   - "business"  → business owner cancelled (reason box shown to customer)
 *   - "system"    → automatic cancellation due to non-payment (auto-cancel cron)
 *
 * When a business owner cancels a confirmed booking, the mandatory
 * cancellationReason is displayed in the customer-facing email so the
 * customer understands why their paid appointment was cancelled.
 */

import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Row,
  Column,
} from "@react-email/components";
import { render } from "@react-email/components";

// =============================================================================
// Types
// =============================================================================

export interface BookingCancelledEmailProps {
  recipientName: string;
  recipientType: "customer" | "business";
  businessName: string;
  customerName: string;
  serviceName: string;
  serviceDate: string;
  serviceTime: string;
  bookingId: string;
  ctaUrl: string;
  /** Who or what triggered the cancellation. */
  cancelledBy: "customer" | "business" | "system";
  /**
   * The reason provided by the business owner when cancelling a confirmed
   * booking. Only populated when cancelledBy === "business". Displayed
   * in the customer email so they understand why their appointment was
   * cancelled. Not shown in the business-facing variant.
   */
  cancellationReason?: string;
}

// =============================================================================
// Template
// =============================================================================

export function BookingCancelledEmail({
  recipientName,
  recipientType,
  businessName,
  customerName,
  serviceName,
  serviceDate,
  serviceTime,
  bookingId,
  ctaUrl,
  cancelledBy,
  cancellationReason,
}: BookingCancelledEmailProps) {
  const isCustomer = recipientType === "customer";

  const cancelledByLabel =
    cancelledBy === "customer"
      ? "the customer"
      : cancelledBy === "business"
        ? "the business"
        : "the system"; // "system" — auto-cancel due to non-payment

  const ctaLabel = isCustomer ? "Browse Services" : "View Dashboard";

  /**
   * Show the cancellation reason box when:
   *   - The recipient is the customer (not the business view)
   *   - The business cancelled (not the customer or system)
   *   - A reason was actually provided
   */
  const showReason =
    isCustomer && cancelledBy === "business" && !!cancellationReason;

  /**
   * Show the non-payment explanation box when the system auto-cancelled.
   * Only shown to customers — the business email has its own messaging.
   */
  const showNonPaymentNotice = isCustomer && cancelledBy === "system";

  /**
   * Hero paragraph — varies by who cancelled and who is reading.
   */
  function getHeroParagraph(): string {
    if (!isCustomer) {
      // Business owner view
      if (cancelledBy === "system") {
        return `Hi ${recipientName}, a booking at ${businessName} was automatically cancelled because payment was not received within 1 hour.`;
      }
      return `Hi ${recipientName}, a booking at ${businessName} has been cancelled by ${cancelledByLabel}.`;
    }

    // Customer view
    if (cancelledBy === "system") {
      return `Hi ${recipientName}, your booking at ${businessName} was automatically cancelled because payment was not completed within 1 hour of booking.`;
    }
    if (cancelledBy === "business") {
      return `Hi ${recipientName}, your booking at ${businessName} has been cancelled by the business.`;
    }
    return `Hi ${recipientName}, your booking at ${businessName} has been cancelled.`;
  }

  /**
   * Bottom message — actionable follow-up based on context.
   */
  function getMessageText(): string {
    if (!isCustomer) {
      return "The time slot is now available for new bookings.";
    }
    if (cancelledBy === "system") {
      return "The time slot has been released. You can book a new appointment at any time — just make sure to complete payment promptly to secure your slot.";
    }
    if (cancelledBy === "business") {
      return "We're sorry for the inconvenience. If you paid for this booking, a full refund will be processed within 3–5 business days. You can browse other available services and book a new appointment at any time.";
    }
    return "We're sorry about the cancellation. You can browse other available services and book a new appointment at any time.";
  }

  return (
    <Html>
      <Head />
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>📅 Appointly</Text>
          </Section>

          {/* Hero */}
          <Section style={heroSection}>
            <Text style={heroEmoji}>❌</Text>
            <Text style={heroHeading}>Booking Cancelled</Text>
            <Text style={heroParagraph}>{getHeroParagraph()}</Text>
          </Section>

          {/* Cancelled Booking Details */}
          <Section style={card}>
            <Text style={cardTitle}>Cancelled Booking</Text>

            {!isCustomer && (
              <>
                <Row style={detailRow}>
                  <Column style={detailLabel}>Customer</Column>
                  <Column style={detailValue}>{customerName}</Column>
                </Row>
                <Hr style={detailDivider} />
              </>
            )}

            <Row style={detailRow}>
              <Column style={detailLabel}>Service</Column>
              <Column style={detailValue}>{serviceName}</Column>
            </Row>
            <Hr style={detailDivider} />

            <Row style={detailRow}>
              <Column style={detailLabel}>Date</Column>
              <Column style={detailValue}>{serviceDate}</Column>
            </Row>
            <Hr style={detailDivider} />

            <Row style={detailRow}>
              <Column style={detailLabel}>Time</Column>
              <Column style={detailValue}>{serviceTime}</Column>
            </Row>
          </Section>

          {/* Non-payment notice — shown to customer when system auto-cancelled */}
          {showNonPaymentNotice && (
            <Section style={nonPaymentSection}>
              <Text style={nonPaymentText}>
                ⏰ <strong>Why was my booking cancelled?</strong>
                {"\n\n"}
                Bookings must be paid within <strong>1 hour</strong> of creation
                to hold the time slot. Because payment was not received in time,
                your slot was automatically released so other customers could
                book it.
              </Text>
            </Section>
          )}

          {/* Cancellation reason — shown to customer when business cancels */}
          {showReason && (
            <Section style={reasonSection}>
              <Text style={reasonLabel}>Reason for Cancellation</Text>
              <Text style={reasonText}>&ldquo;{cancellationReason}&rdquo;</Text>
            </Section>
          )}

          {/* Message */}
          <Section style={messageSection}>
            <Text style={messageText}>{getMessageText()}</Text>
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Button style={primaryButton} href={ctaUrl}>
              {ctaLabel}
            </Button>
          </Section>

          {/* Booking ID */}
          <Section style={{ padding: "0 32px 24px" }}>
            <Text style={bookingIdText}>Booking ID: {bookingId}</Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Appointly. All rights reserved.
            </Text>
            <Text style={footerText}>
              This is a transactional email and cannot be unsubscribed from.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export async function renderBookingCancelledEmail(
  props: BookingCancelledEmailProps
): Promise<string> {
  return render(<BookingCancelledEmail {...props} />);
}

// =============================================================================
// Styles — all identical to original
// =============================================================================

const body: React.CSSProperties = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
  margin: 0,
  padding: 0,
};
const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  maxWidth: "600px",
  borderRadius: "8px",
  overflow: "hidden",
  marginTop: "40px",
  marginBottom: "40px",
};
const header: React.CSSProperties = {
  backgroundColor: "#18181b",
  padding: "24px 32px",
};
const logo: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: "bold",
  margin: 0,
};
const heroSection: React.CSSProperties = {
  padding: "40px 32px 24px",
  textAlign: "center" as const,
};
const heroEmoji: React.CSSProperties = {
  fontSize: "48px",
  margin: "0 0 8px",
};
const heroHeading: React.CSSProperties = {
  fontSize: "28px",
  fontWeight: "bold",
  color: "#18181b",
  margin: "0 0 12px",
};
const heroParagraph: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#374151",
  margin: 0,
};
const card: React.CSSProperties = {
  margin: "0 32px",
  padding: "24px",
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
};
const cardTitle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#6b7280",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  marginBottom: "16px",
  marginTop: 0,
};
const detailRow: React.CSSProperties = {
  padding: "8px 0",
};
const detailLabel: React.CSSProperties = {
  fontSize: "14px",
  color: "#6b7280",
  width: "40%",
};
const detailValue: React.CSSProperties = {
  fontSize: "14px",
  color: "#374151",
  fontWeight: "500",
};
const detailDivider: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "4px 0",
};

/** Non-payment explanation — blue info box for system auto-cancellations */
const nonPaymentSection: React.CSSProperties = {
  margin: "16px 32px 0",
  padding: "16px",
  backgroundColor: "#eff6ff",
  borderRadius: "8px",
  border: "1px solid #bfdbfe",
};
const nonPaymentText: React.CSSProperties = {
  fontSize: "14px",
  color: "#1e40af",
  lineHeight: "22px",
  margin: 0,
  whiteSpace: "pre-line" as const,
};

/** Reason box — amber background for business-initiated cancellations */
const reasonSection: React.CSSProperties = {
  margin: "16px 32px 0",
  padding: "16px",
  backgroundColor: "#fffbeb",
  borderRadius: "8px",
  border: "1px solid #fde68a",
};
const reasonLabel: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#92400e",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 8px",
};
const reasonText: React.CSSProperties = {
  fontSize: "14px",
  color: "#374151",
  lineHeight: "22px",
  margin: 0,
  fontStyle: "italic",
};
const messageSection: React.CSSProperties = {
  padding: "24px 32px 0",
};
const messageText: React.CSSProperties = {
  fontSize: "15px",
  color: "#374151",
  lineHeight: "24px",
  margin: 0,
};
const ctaSection: React.CSSProperties = {
  padding: "24px 32px",
  textAlign: "center" as const,
};
const primaryButton: React.CSSProperties = {
  backgroundColor: "#18181b",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 32px",
};
const bookingIdText: React.CSSProperties = {
  fontSize: "12px",
  color: "#9ca3af",
  textAlign: "center" as const,
};
const footer: React.CSSProperties = {
  padding: "24px 32px",
  backgroundColor: "#f9fafb",
};
const footerText: React.CSSProperties = {
  fontSize: "12px",
  color: "#9ca3af",
  textAlign: "center" as const,
  margin: "4px 0",
};
