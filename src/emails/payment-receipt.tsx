/**
 * @file Payment Receipt Email Template
 * @description Sent to the customer after a successful payment.
 *
 * Contains:
 *   - Payment confirmation banner
 *   - Booking summary
 *   - Transaction reference
 *   - "View Booking" CTA
 *   - Calendar reminder note
 *   - Unsubscribe link (N/A — transactional, cannot be disabled)
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

export interface PaymentReceiptEmailProps {
  customerName: string;
  businessName: string;
  businessAddress?: string | null;
  businessPhone?: string | null;
  serviceName: string;
  serviceDate: string;
  serviceTime: string;
  totalPrice: string;
  staffName?: string | null;
  transactionRef: string;
  bookingId: string;
  bookingUrl: string;
}

export function PaymentReceiptEmail({
  customerName,
  businessName,
  businessAddress,
  businessPhone,
  serviceName,
  serviceDate,
  serviceTime,
  totalPrice,
  staffName,
  transactionRef,
  bookingId,
  bookingUrl,
}: PaymentReceiptEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>📅 Appointly</Text>
          </Section>

          {/* Payment success banner */}
          <Section style={successBanner}>
            <Text style={successEmoji}>✅</Text>
            <Text style={successHeading}>Payment Confirmed!</Text>
            <Text style={successSubheading}>
              Your appointment is confirmed at <strong>{businessName}</strong>.
            </Text>
          </Section>

          {/* Receipt Card */}
          <Section style={card}>
            <Text style={cardTitle}>Receipt</Text>

            <Row style={detailRow}>
              <Column style={detailLabel}>Customer</Column>
              <Column style={detailValue}>{customerName}</Column>
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
              <Column style={detailLabel}>Amount Paid</Column>
              <Column
                style={{
                  ...detailValue,
                  fontWeight: "bold",
                  color: "#16a34a",
                  fontSize: "16px",
                }}
              >
                {totalPrice}
              </Column>
            </Row>
            <Hr style={detailDivider} />

            <Row style={detailRow}>
              <Column style={detailLabel}>Transaction</Column>
              <Column
                style={{ ...detailValue, fontSize: "12px", color: "#9ca3af" }}
              >
                {transactionRef}
              </Column>
            </Row>
          </Section>

          {/* Business contact info */}
          {(businessAddress || businessPhone) && (
            <Section style={{ ...card, marginTop: "16px" }}>
              <Text style={cardTitle}>Where to Go</Text>
              {businessAddress && (
                <Text style={infoText}>📍 {businessAddress}</Text>
              )}
              {businessPhone && (
                <Text style={infoText}>📞 {businessPhone}</Text>
              )}
            </Section>
          )}

          {/* Reminder note */}
          <Section style={reminderSection}>
            <Text style={reminderText}>
              💡 You&apos;ll receive a reminder email 24 hours before your
              appointment. If you need to make changes, please contact the
              business directly.
            </Text>
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Button style={primaryButton} href={bookingUrl}>
              View Booking Details
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

export async function renderPaymentReceiptEmail(
  props: PaymentReceiptEmailProps
): Promise<string> {
  return render(<PaymentReceiptEmail {...props} />);
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
const successBanner: React.CSSProperties = {
  backgroundColor: "#f0fdf4",
  padding: "40px 32px 24px",
  textAlign: "center" as const,
  borderBottom: "1px solid #dcfce7",
};
const successEmoji: React.CSSProperties = {
  fontSize: "48px",
  margin: "0 0 8px",
};
const successHeading: React.CSSProperties = {
  fontSize: "28px",
  fontWeight: "bold",
  color: "#15803d",
  margin: "0 0 8px",
};
const successSubheading: React.CSSProperties = {
  fontSize: "16px",
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
const infoText: React.CSSProperties = {
  fontSize: "14px",
  color: "#374151",
  margin: "4px 0",
};
const reminderSection: React.CSSProperties = { padding: "16px 32px" };
const reminderText: React.CSSProperties = {
  fontSize: "14px",
  color: "#6b7280",
  lineHeight: "22px",
  backgroundColor: "#fffbeb",
  padding: "12px 16px",
  borderRadius: "6px",
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
