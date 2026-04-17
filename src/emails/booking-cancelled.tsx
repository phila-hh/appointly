/**
 * @file Booking Cancelled Email Template
 * @description Sent to both the customer and business owner when a
 * booking is cancelled.
 *
 * The `recipientType` prop controls the message variant:
 *   - "customer" → cancellation from their perspective
 *   - "business" → cancellation notification for the owner
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
  cancelledBy: "customer" | "business";
}

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
}: BookingCancelledEmailProps) {
  const isCustomer = recipientType === "customer";

  const cancelledByLabel =
    cancelledBy === "customer" ? "the customer" : "the business";

  const ctaLabel = isCustomer ? "Browse Services" : "View Dashboard";

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
            <Text style={heroParagraph}>
              Hi {recipientName},{" "}
              {isCustomer
                ? `your booking at ${businessName} has been cancelled by ${cancelledByLabel}.`
                : `a booking at ${businessName} has been cancelled by ${cancelledByLabel}.`}
            </Text>
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

          {/* Message */}
          <Section style={messageSection}>
            <Text style={messageText}>
              {isCustomer
                ? "We're sorry about the cancellation. You can browse other available services and book a new appointment at any time."
                : "The time slot is now available for new bookings."}
            </Text>
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

// Styles
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
const heroEmoji: React.CSSProperties = { fontSize: "48px", margin: "0 0 8px" };
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
const detailRow: React.CSSProperties = { padding: "8px 0" };
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
const messageSection: React.CSSProperties = { padding: "24px 32px 0" };
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
