/**
 * @file Booking Expiring Soon Email Template
 * @description Sent to the customer 15 minutes before their unpaid booking
 * is automatically cancelled by the auto-cancel cron job.
 *
 * Contains:
 *   - Urgent orange/amber banner
 *   - Booking details (service, date, time)
 *   - Clear countdown message ("Your slot will be released in ~15 minutes")
 *   - Large "Pay Now" CTA button
 *   - Note that the slot will be released if payment is not completed
 *
 * This is a transactional email — it cannot be unsubscribed from.
 * It is only sent once per booking (warningEmailSentAt flag prevents duplicates).
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

export interface BookingExpiringSoonEmailProps {
  customerName: string;
  businessName: string;
  serviceName: string;
  /** Formatted appointment date (e.g. "Monday, June 9, 2025") */
  serviceDate: string;
  /** Formatted appointment time (e.g. "10:00 AM – 10:30 AM") */
  serviceTime: string;
  /** Amount due (e.g. "ETB 350.00") */
  totalPrice: string;
  /** Direct payment URL */
  payUrl: string;
  bookingId: string;
}

// =============================================================================
// Template
// =============================================================================

export function BookingExpiringSoonEmail({
  customerName,
  businessName,
  serviceName,
  serviceDate,
  serviceTime,
  totalPrice,
  payUrl,
  bookingId,
}: BookingExpiringSoonEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>📅 Appointly</Text>
          </Section>

          {/* Urgency banner */}
          <Section style={urgencyBanner}>
            <Text style={urgencyEmoji}>⏰</Text>
            <Text style={urgencyHeading}>Your slot expires soon!</Text>
            <Text style={urgencySubheading}>
              Hi {customerName}, your booking at <strong>{businessName}</strong>{" "}
              will be automatically released in approximately{" "}
              <strong>15 minutes</strong> if payment is not completed.
            </Text>
          </Section>

          {/* Booking Details Card */}
          <Section style={card}>
            <Text style={cardTitle}>Booking Details</Text>

            <Row style={detailRow}>
              <Column style={detailLabel}>Business</Column>
              <Column style={detailValue}>{businessName}</Column>
            </Row>
            <Hr style={detailDivider} />

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
            <Hr style={detailDivider} />

            <Row style={detailRow}>
              <Column style={detailLabel}>Amount Due</Column>
              <Column
                style={{ ...detailValue, fontWeight: "bold", color: "#18181b" }}
              >
                {totalPrice}
              </Column>
            </Row>
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Text style={ctaText}>
              Complete your payment now to secure this appointment.
            </Text>
            <Button style={urgentButton} href={payUrl}>
              Pay Now — {totalPrice}
            </Button>
            <Text style={releaseNote}>
              If payment is not received, your slot will be released and made
              available to other customers.
            </Text>
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

export async function renderBookingExpiringSoonEmail(
  props: BookingExpiringSoonEmailProps
): Promise<string> {
  return render(<BookingExpiringSoonEmail {...props} />);
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

/** Amber/orange urgency banner — distinct from the green success or blue info banners */
const urgencyBanner: React.CSSProperties = {
  backgroundColor: "#fffbeb",
  padding: "40px 32px 24px",
  textAlign: "center" as const,
  borderBottom: "2px solid #f59e0b",
};

const urgencyEmoji: React.CSSProperties = {
  fontSize: "48px",
  margin: "0 0 8px",
};

const urgencyHeading: React.CSSProperties = {
  fontSize: "28px",
  fontWeight: "bold",
  color: "#92400e",
  margin: "0 0 12px",
};

const urgencySubheading: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#374151",
  margin: 0,
};

const card: React.CSSProperties = {
  margin: "24px 32px 0",
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

const ctaSection: React.CSSProperties = {
  padding: "32px",
  textAlign: "center" as const,
};

const ctaText: React.CSSProperties = {
  fontSize: "15px",
  color: "#374151",
  marginBottom: "16px",
  marginTop: 0,
};

/** Amber button — matches urgency banner, distinct from the standard black CTA */
const urgentButton: React.CSSProperties = {
  backgroundColor: "#d97706",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "700",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 36px",
};

const releaseNote: React.CSSProperties = {
  fontSize: "13px",
  color: "#6b7280",
  marginTop: "16px",
  marginBottom: 0,
  lineHeight: "20px",
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
