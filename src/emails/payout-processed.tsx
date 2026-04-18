/**
 * @file Payout Processed Email Template
 * @description Sent to a business owner when their payout has been
 * marked as paid by an admin.
 *
 * Contains:
 *   - Payout confirmation with amount
 *   - Period covered
 *   - Transaction reference
 *   - Commission breakdown summary
 *   - CTA to view earnings dashboard
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

export interface PayoutProcessedEmailProps {
  businessOwnerName: string;
  businessName: string;
  period: string;
  netAmount: string;
  grossTotal: string;
  commissionTotal: string;
  commissionCount: number;
  reference: string;
  notes?: string | null;
  earningsUrl: string;
}

export function PayoutProcessedEmail({
  businessOwnerName,
  businessName,
  period,
  netAmount,
  grossTotal,
  commissionTotal,
  commissionCount,
  reference,
  notes,
  earningsUrl,
}: PayoutProcessedEmailProps) {
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
            <Text style={heroEmoji}>💰</Text>
            <Text style={heroHeading}>Payout Processed!</Text>
            <Text style={heroParagraph}>
              Hi {businessOwnerName}, your payout for{" "}
              <strong>{businessName}</strong> has been processed and transferred
              to your account.
            </Text>
          </Section>

          {/* Amount highlight */}
          <Section style={amountSection}>
            <Text style={amountLabel}>Amount Transferred</Text>
            <Text style={amountValue}>{netAmount}</Text>
            <Text style={amountPeriod}>Period: {period}</Text>
          </Section>

          {/* Breakdown card */}
          <Section style={card}>
            <Text style={cardTitle}>Payout Breakdown</Text>

            <Row style={detailRow}>
              <Column style={detailLabel}>Bookings Included</Column>
              <Column style={detailValue}>{commissionCount}</Column>
            </Row>
            <Hr style={detailDivider} />

            <Row style={detailRow}>
              <Column style={detailLabel}>Gross Revenue</Column>
              <Column style={detailValue}>{grossTotal}</Column>
            </Row>
            <Hr style={detailDivider} />

            <Row style={detailRow}>
              <Column style={detailLabel}>Platform Commission</Column>
              <Column style={{ ...detailValue, color: "#dc2626" }}>
                − {commissionTotal}
              </Column>
            </Row>
            <Hr style={detailDivider} />

            <Row style={detailRow}>
              <Column style={{ ...detailLabel, fontWeight: "600" }}>
                Net Payout
              </Column>
              <Column
                style={{
                  ...detailValue,
                  fontWeight: "700",
                  color: "#15803d",
                  fontSize: "16px",
                }}
              >
                {netAmount}
              </Column>
            </Row>
          </Section>

          {/* Reference */}
          <Section style={referenceSection}>
            <Text style={referenceTitle}>Transaction Reference</Text>
            <Text style={referenceValue}>{reference}</Text>
            {notes && <Text style={notesText}>Note: {notes}</Text>}
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Button style={primaryButton} href={earningsUrl}>
              View Earnings Dashboard
            </Button>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Appointly. All rights reserved.
            </Text>
            <Text style={footerText}>
              This is a transactional email confirming your payout.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export async function renderPayoutProcessedEmail(
  props: PayoutProcessedEmailProps
): Promise<string> {
  return render(<PayoutProcessedEmail {...props} />);
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
  backgroundColor: "#fefce8",
  padding: "40px 32px 24px",
  textAlign: "center" as const,
  borderBottom: "1px solid #fef08a",
};
const heroEmoji: React.CSSProperties = { fontSize: "48px", margin: "0 0 8px" };
const heroHeading: React.CSSProperties = {
  fontSize: "28px",
  fontWeight: "bold",
  color: "#18181b",
  margin: "0 0 12px",
};
const heroParagraph: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#374151",
  margin: 0,
};
const amountSection: React.CSSProperties = {
  padding: "32px",
  textAlign: "center" as const,
  backgroundColor: "#f0fdf4",
};
const amountLabel: React.CSSProperties = {
  fontSize: "13px",
  color: "#6b7280",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 8px",
};
const amountValue: React.CSSProperties = {
  fontSize: "42px",
  fontWeight: "bold",
  color: "#15803d",
  margin: "0 0 4px",
};
const amountPeriod: React.CSSProperties = {
  fontSize: "14px",
  color: "#6b7280",
  margin: 0,
};
const card: React.CSSProperties = {
  margin: "24px 32px 0",
  padding: "20px 24px",
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
};
const cardTitle: React.CSSProperties = {
  fontSize: "12px",
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
  width: "55%",
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
const referenceSection: React.CSSProperties = { padding: "16px 32px 0" };
const referenceTitle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#6b7280",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  marginBottom: "4px",
};
const referenceValue: React.CSSProperties = {
  fontSize: "13px",
  color: "#374151",
  fontFamily: "monospace",
  backgroundColor: "#f3f4f6",
  padding: "6px 10px",
  borderRadius: "4px",
  display: "inline-block" as const,
};
const notesText: React.CSSProperties = {
  fontSize: "13px",
  color: "#6b7280",
  marginTop: "8px",
};
const ctaSection: React.CSSProperties = {
  padding: "28px 32px",
  textAlign: "center" as const,
};
const primaryButton: React.CSSProperties = {
  backgroundColor: "#18181b",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 28px",
};
const hr: React.CSSProperties = { borderColor: "#e5e7eb", margin: "0 32px" };
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
