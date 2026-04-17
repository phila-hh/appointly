/**
 * @file New Booking Notification Email Template
 * @description Sent to the business owner when a customer creates a booking.
 *
 * Contains:
 *   - Customer details (name, email, phone)
 *   - Service, date, time
 *   - Customer notes (if any)
 *   - "View Booking" CTA
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

export interface NewBookingNotificationEmailProps {
  businessOwnerName: string;
  businessName: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  serviceName: string;
  serviceDate: string;
  serviceTime: string;
  totalPrice: string;
  staffName?: string | null;
  customerNotes?: string | null;
  bookingId: string;
  dashboardUrl: string;
}

export function NewBookingNotificationEmail({
  businessOwnerName,
  businessName,
  customerName,
  customerEmail,
  customerPhone,
  serviceName,
  serviceDate,
  serviceTime,
  totalPrice,
  staffName,
  customerNotes,
  bookingId,
  dashboardUrl,
}: NewBookingNotificationEmailProps) {
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
            <Text style={heroEmoji}>📋</Text>
            <Text style={heroHeading}>New Booking Request</Text>
            <Text style={heroParagraph}>
              Hi {businessOwnerName}, you have a new booking request for{" "}
              <strong>{businessName}</strong>.
            </Text>
          </Section>

          {/* Customer Info */}
          <Section style={card}>
            <Text style={cardTitle}>Customer</Text>
            <Row style={detailRow}>
              <Column style={detailLabel}>Name</Column>
              <Column style={detailValue}>{customerName}</Column>
            </Row>
            <Hr style={detailDivider} />
            <Row style={detailRow}>
              <Column style={detailLabel}>Email</Column>
              <Column style={detailValue}>{customerEmail}</Column>
            </Row>
            {customerPhone && (
              <>
                <Hr style={detailDivider} />
                <Row style={detailRow}>
                  <Column style={detailLabel}>Phone</Column>
                  <Column style={detailValue}>{customerPhone}</Column>
                </Row>
              </>
            )}
          </Section>

          {/* Booking Info */}
          <Section style={{ ...card, marginTop: "16px" }}>
            <Text style={cardTitle}>Booking Details</Text>

            <Row style={detailRow}>
              <Column style={detailLabel}>Service</Column>
              <Column style={detailValue}>{serviceName}</Column>
            </Row>
            <Hr style={detailDivider} />

            {staffName && (
              <>
                <Row style={detailRow}>
                  <Column style={detailLabel}>Staff</Column>
                  <Column style={detailValue}>{staffName}</Column>
                </Row>
                <Hr style={detailDivider} />
              </>
            )}

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
              <Column style={detailLabel}>Total</Column>
              <Column
                style={{
                  ...detailValue,
                  fontWeight: "bold",
                  color: "#18181b",
                }}
              >
                {totalPrice}
              </Column>
            </Row>
          </Section>

          {/* Customer Notes */}
          {customerNotes && (
            <Section style={{ ...card, marginTop: "16px" }}>
              <Text style={cardTitle}>Customer Notes</Text>
              <Text style={notesText}>{customerNotes}</Text>
            </Section>
          )}

          {/* CTA */}
          <Section style={ctaSection}>
            <Text style={ctaText}>
              Log in to your dashboard to confirm or manage this booking.
            </Text>
            <Button style={primaryButton} href={dashboardUrl}>
              View in Dashboard
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
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export async function renderNewBookingNotificationEmail(
  props: NewBookingNotificationEmailProps
): Promise<string> {
  return render(<NewBookingNotificationEmail {...props} />);
}

// Styles — shared with booking-confirmation
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
const notesText: React.CSSProperties = {
  fontSize: "14px",
  color: "#374151",
  fontStyle: "italic",
  margin: 0,
};
const ctaSection: React.CSSProperties = {
  padding: "32px",
  textAlign: "center" as const,
};
const ctaText: React.CSSProperties = {
  fontSize: "15px",
  color: "#374151",
  marginBottom: "16px",
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
  margin: 0,
};
