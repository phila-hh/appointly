/**
 * @file Payment Refunded Email Template
 * @description Sent to the customer when a refund has been successfully
 * initiated for a cancelled booking.
 *
 * Contains:
 *   - Green confirmation banner
 *   - Refunded amount and original booking details
 *   - Clear 3–5 business day timeline expectation
 *   - Appointly support contact as fallback (NOT the business —
 *     payments go to the platform, not the business directly)
 *   - Transaction reference for the customer's records
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
  Link,
} from "@react-email/components";
import { render } from "@react-email/components";

// =============================================================================
// Types
// =============================================================================

export interface PaymentRefundedEmailProps {
  customerName: string;
  businessName: string;
  serviceName: string;
  /** Formatted refund amount (e.g. "ETB 350.00") */
  refundAmount: string;
  /** Original Chapa transaction reference */
  transactionRef: string;
  bookingId: string;
  bookingUrl: string;
  /**
   * Platform support email — customers should contact Appointly, not the
   * business, because payments are held by the platform.
   */
  supportEmail: string;
}

// =============================================================================
// Template
// =============================================================================

export function PaymentRefundedEmail({
  businessName,
  serviceName,
  refundAmount,
  transactionRef,
  bookingId,
  bookingUrl,
  supportEmail,
}: PaymentRefundedEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>📅 Appointly</Text>
          </Section>

          {/* Success banner */}
          <Section style={successBanner}>
            <Text style={successEmoji}>💸</Text>
            <Text style={successHeading}>Refund Initiated</Text>
            <Text style={successSubheading}>
              Your refund of <strong>{refundAmount}</strong> is being processed.
            </Text>
          </Section>

          {/* Refund Details Card */}
          <Section style={card}>
            <Text style={cardTitle}>Refund Details</Text>

            <Row style={detailRow}>
              <Column style={detailLabel}>Amount</Column>
              <Column style={amountStyle}>{refundAmount}</Column>
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

          {/* Timeline expectation */}
          <Section style={timelineSection}>
            <Text style={timelineText}>
              ⏱️ <strong>When will I receive my refund?</strong>
              {"\n\n"}
              Refunds are typically processed within{" "}
              <strong>3–5 business days</strong>, depending on your bank or
              mobile money provider. The funds will be returned to the original
              payment method used for this booking.
            </Text>
          </Section>

          {/* Support contact */}
          <Section style={supportSection}>
            <Text style={supportText}>
              If your refund has not arrived after 5 business days, please
              contact <strong>Appointly Support</strong> — do not contact the
              business directly, as all payments are processed by Appointly.
              {"\n\n"}
              📧{" "}
              <Link href={`mailto:${supportEmail}`} style={supportLink}>
                {supportEmail}
              </Link>
            </Text>
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Button style={primaryButton} href={bookingUrl}>
              View Booking
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

export async function renderPaymentRefundedEmail(
  props: PaymentRefundedEmailProps
): Promise<string> {
  return render(<PaymentRefundedEmail {...props} />);
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

/** Refund amount — green and bold to reinforce it is money coming back */
const amountStyle: React.CSSProperties = {
  fontSize: "16px",
  color: "#15803d",
  fontWeight: "700",
};

const detailDivider: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "4px 0",
};

const timelineSection: React.CSSProperties = {
  padding: "16px 32px 0",
};

const timelineText: React.CSSProperties = {
  fontSize: "14px",
  color: "#374151",
  lineHeight: "22px",
  backgroundColor: "#eff6ff",
  padding: "16px",
  borderRadius: "6px",
  margin: 0,
  whiteSpace: "pre-line" as const,
};

const supportSection: React.CSSProperties = {
  padding: "16px 32px 0",
};

const supportText: React.CSSProperties = {
  fontSize: "14px",
  color: "#374151",
  lineHeight: "22px",
  backgroundColor: "#fffbeb",
  padding: "16px",
  borderRadius: "6px",
  margin: 0,
  whiteSpace: "pre-line" as const,
};

const supportLink: React.CSSProperties = {
  color: "#18181b",
  textDecoration: "underline",
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
