/**
 * @file Booking Confirmation Email Template
 * @description Sent to the customer immediately after a booking is created.
 *
 * Contains:
 *   - Booking summary (service, date, time, business)
 *   - Total price
 *   - Staff assignment (if applicable)
 *   - "Pay Now" CTA button
 *   - Business contact info
 *   - Add to calendar note
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

export interface BookingConfirmationEmailProps {
  customerName: string;
  businessName: string;
  businessPhone?: string | null;
  businessAddress?: string | null;
  serviceName: string;
  serviceDate: string; // e.g. "Saturday, June 14, 2025"
  serviceTime: string; // e.g. "10:00 AM – 10:30 AM"
  totalPrice: string; // e.g. "ETB 350.00"
  staffName?: string | null;
  bookingId: string;
  payUrl: string;
}

// =============================================================================
// Template
// =============================================================================

export function BookingConfirmationEmail({
  customerName,
  businessName,
  businessPhone,
  businessAddress,
  serviceName,
  serviceDate,
  serviceTime,
  totalPrice,
  staffName,
  bookingId,
  payUrl,
}: BookingConfirmationEmailProps) {
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
            <Text style={heroEmoji}>🎉</Text>
            <Text style={heroHeading}>Booking Received!</Text>
            <Text style={heroParagraph}>
              Hi {customerName}, your booking request has been submitted. Please
              complete payment to confirm your appointment.
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
                style={{ ...detailValue, fontWeight: "bold", color: "#18181b" }}
              >
                {totalPrice}
              </Column>
            </Row>
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Text style={ctaText}>
              Complete your payment to confirm this appointment.
            </Text>
            <Button style={primaryButton} href={payUrl}>
              Pay Now — {totalPrice}
            </Button>
          </Section>

          {/* Business Contact */}
          {(businessPhone || businessAddress) && (
            <Section style={infoSection}>
              <Text style={infoTitle}>Business Contact</Text>
              {businessAddress && (
                <Text style={infoText}>📍 {businessAddress}</Text>
              )}
              {businessPhone && (
                <Text style={infoText}>📞 {businessPhone}</Text>
              )}
            </Section>
          )}

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

export async function renderBookingConfirmationEmail(
  props: BookingConfirmationEmailProps
): Promise<string> {
  return render(<BookingConfirmationEmail {...props} />);
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

const infoSection: React.CSSProperties = {
  padding: "0 32px 24px",
};

const infoTitle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "600",
  color: "#6b7280",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  marginBottom: "8px",
};

const infoText: React.CSSProperties = {
  fontSize: "14px",
  color: "#374151",
  margin: "4px 0",
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
