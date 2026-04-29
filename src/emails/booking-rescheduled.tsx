/**
 * @file Booking Rescheduled Email Template
 * @description Sent to both the customer and the business owner when a
 * confirmed booking is rescheduled by the customer.
 *
 * Contains:
 *   - Old appointment date/time (crossed out visually via muted color)
 *   - New appointment date/time (highlighted)
 *   - Remaining reschedule allowance ("1 of 2 reschedules used")
 *   - "View Booking" CTA
 *   - Two variants via recipientType prop:
 *       "customer" → reassuring tone, shows booking link
 *       "business" → informational tone, shows dashboard link
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

export interface BookingRescheduledEmailProps {
  /** Name of the recipient (customer or business owner) */
  recipientName: string;
  /** Determines the tone and CTA of the email */
  recipientType: "customer" | "business";
  businessName: string;
  /** Customer's name — shown in the business variant */
  customerName: string;
  serviceName: string;
  /** Previous appointment date (e.g. "Monday, June 9, 2025") */
  oldDate: string;
  /** Previous appointment time (e.g. "10:00 AM – 10:30 AM") */
  oldTime: string;
  /** New appointment date (e.g. "Wednesday, June 11, 2025") */
  newDate: string;
  /** New appointment time (e.g. "2:00 PM – 2:30 PM") */
  newTime: string;
  /** How many times this booking has been rescheduled (1 or 2) */
  rescheduleCount: number;
  bookingId: string;
  /** Deep-link for the CTA button */
  ctaUrl: string;
}

// =============================================================================
// Template
// =============================================================================

export function BookingRescheduledEmail({
  recipientName,
  recipientType,
  businessName,
  customerName,
  serviceName,
  oldDate,
  oldTime,
  newDate,
  newTime,
  rescheduleCount,
  bookingId,
  ctaUrl,
}: BookingRescheduledEmailProps) {
  const isCustomer = recipientType === "customer";

  /**
   * Remaining reschedules = 2 - rescheduleCount.
   * We show this to set expectations — if 0 remain the customer is
   * informed they must contact the business for further changes.
   */
  const remainingReschedules = 2 - rescheduleCount;

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
            <Text style={heroEmoji}>🔄</Text>
            <Text style={heroHeading}>Appointment Rescheduled</Text>
            <Text style={heroParagraph}>
              {isCustomer
                ? `Hi ${recipientName}, your appointment has been moved to a new date and time.`
                : `Hi ${recipientName}, ${customerName} has rescheduled their appointment at ${businessName}.`}
            </Text>
          </Section>

          {/* Schedule Change Card */}
          <Section style={card}>
            <Text style={cardTitle}>Schedule Change</Text>

            {/* Old date/time — muted to indicate it is no longer active */}
            <Row style={detailRow}>
              <Column style={detailLabel}>Was</Column>
              <Column style={oldValueStyle}>
                {oldDate}
                {"\n"}
                {oldTime}
              </Column>
            </Row>
            <Hr style={detailDivider} />

            {/* New date/time — highlighted */}
            <Row style={detailRow}>
              <Column style={detailLabel}>Now</Column>
              <Column style={newValueStyle}>
                {newDate}
                {"\n"}
                {newTime}
              </Column>
            </Row>
            <Hr style={detailDivider} />

            <Row style={detailRow}>
              <Column style={detailLabel}>Service</Column>
              <Column style={detailValue}>{serviceName}</Column>
            </Row>
            <Hr style={detailDivider} />

            <Row style={detailRow}>
              <Column style={detailLabel}>Business</Column>
              <Column style={detailValue}>{businessName}</Column>
            </Row>
          </Section>

          {/* Reschedule allowance notice — shown to customers only */}
          {isCustomer && (
            <Section style={noticeSection}>
              <Text
                style={
                  remainingReschedules === 0
                    ? { ...noticeText, ...noticeTextWarning }
                    : noticeText
                }
              >
                {remainingReschedules === 0
                  ? `⚠️ You have used all 2 reschedules for this booking. To make further changes, please contact ${businessName} directly.`
                  : `ℹ️ Reschedule ${rescheduleCount} of 2 used. You have ${remainingReschedules} reschedule${remainingReschedules === 1 ? "" : "s"} remaining for this booking.`}
              </Text>
            </Section>
          )}

          {/* CTA */}
          <Section style={ctaSection}>
            <Button style={primaryButton} href={ctaUrl}>
              {isCustomer ? "View Booking Details" : "View in Dashboard"}
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

export async function renderBookingRescheduledEmail(
  props: BookingRescheduledEmailProps
): Promise<string> {
  return render(<BookingRescheduledEmail {...props} />);
}

// =============================================================================
// Styles
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

/** Old date/time — muted color to visually indicate it is superseded */
const oldValueStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#9ca3af",
  whiteSpace: "pre-line" as const,
};

/** New date/time — bold and dark to draw attention */
const newValueStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#18181b",
  fontWeight: "700",
  whiteSpace: "pre-line" as const,
};

const detailDivider: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "4px 0",
};

const noticeSection: React.CSSProperties = {
  padding: "16px 32px 0",
};

const noticeText: React.CSSProperties = {
  fontSize: "14px",
  color: "#374151",
  lineHeight: "22px",
  backgroundColor: "#eff6ff",
  padding: "12px 16px",
  borderRadius: "6px",
  margin: 0,
};

/** Applied on top of noticeText when 0 reschedules remain */
const noticeTextWarning: React.CSSProperties = {
  backgroundColor: "#fef3c7",
  color: "#92400e",
};

const ctaSection: React.CSSProperties = {
  padding: "32px",
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
