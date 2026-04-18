/**
 * @file Account Suspended Email Template
 * @description Sent to a user or business owner when their account
 * or business listing has been suspended by an admin.
 *
 * Contains:
 *   - Clear suspension notice
 *   - The reason provided by the admin
 *   - What access is restricted
 *   - How to appeal / contact support
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
} from "@react-email/components";
import { render } from "@react-email/components";

export interface AccountSuspendedEmailProps {
  recipientName: string;
  suspensionType: "account" | "business";
  businessName?: string | null;
  reason: string;
  supportEmail: string;
  appealUrl: string;
}

export function AccountSuspendedEmail({
  recipientName,
  suspensionType,
  businessName,
  reason,
  supportEmail,
  appealUrl,
}: AccountSuspendedEmailProps) {
  const isAccount = suspensionType === "account";

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
            <Text style={heroEmoji}>⚠️</Text>
            <Text style={heroHeading}>
              {isAccount ? "Account Suspended" : "Business Listing Suspended"}
            </Text>
            <Text style={heroParagraph}>
              Hi {recipientName}, we are writing to inform you that your{" "}
              {isAccount
                ? "Appointly account"
                : `business listing "${businessName}"`}{" "}
              has been suspended by our platform team.
            </Text>
          </Section>

          {/* Reason Card */}
          <Section style={card}>
            <Text style={cardTitle}>Reason for Suspension</Text>
            <Text style={reasonText}>{reason}</Text>
          </Section>

          {/* What this means */}
          <Section style={impactSection}>
            <Text style={impactTitle}>What This Means</Text>
            {isAccount ? (
              <>
                <Text style={impactItem}>
                  • You will not be able to sign in to your account.
                </Text>
                <Text style={impactItem}>
                  • Existing bookings may be affected.
                </Text>
                <Text style={impactItem}>
                  • Your profile and data are preserved.
                </Text>
              </>
            ) : (
              <>
                <Text style={impactItem}>
                  • Your business will not appear in public listings.
                </Text>
                <Text style={impactItem}>
                  • New bookings cannot be made for your business.
                </Text>
                <Text style={impactItem}>
                  • Existing confirmed bookings remain valid.
                </Text>
                <Text style={impactItem}>
                  • Your account and data are preserved.
                </Text>
              </>
            )}
          </Section>

          {/* Appeal */}
          <Section style={appealSection}>
            <Text style={appealTitle}>How to Appeal</Text>
            <Text style={appealText}>
              If you believe this action was taken in error, please contact our
              support team at <span style={emailHighlight}>{supportEmail}</span>{" "}
              or click the button below to submit an appeal.
            </Text>
            <Section style={ctaSection}>
              <Button style={primaryButton} href={appealUrl}>
                Contact Support
              </Button>
            </Section>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Appointly. All rights reserved.
            </Text>
            <Text style={footerText}>
              This is a transactional email regarding your account status.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export async function renderAccountSuspendedEmail(
  props: AccountSuspendedEmailProps
): Promise<string> {
  return render(<AccountSuspendedEmail {...props} />);
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
  backgroundColor: "#fff7ed",
  padding: "40px 32px 24px",
  textAlign: "center" as const,
  borderBottom: "1px solid #fed7aa",
};

const heroEmoji: React.CSSProperties = {
  fontSize: "48px",
  margin: "0 0 8px",
};

const heroHeading: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#9a3412",
  margin: "0 0 12px",
};

const heroParagraph: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#374151",
  margin: 0,
};

const card: React.CSSProperties = {
  margin: "24px 32px 0",
  padding: "20px 24px",
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
  borderLeft: "4px solid #ef4444",
};

const cardTitle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#6b7280",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  marginBottom: "8px",
  marginTop: 0,
};

const reasonText: React.CSSProperties = {
  fontSize: "15px",
  color: "#374151",
  lineHeight: "24px",
  margin: 0,
};

const impactSection: React.CSSProperties = {
  padding: "24px 32px 0",
};

const impactTitle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#18181b",
  marginBottom: "8px",
};

const impactItem: React.CSSProperties = {
  fontSize: "14px",
  color: "#374151",
  lineHeight: "22px",
  margin: "4px 0",
};

const appealSection: React.CSSProperties = {
  padding: "24px 32px",
};

const appealTitle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#18181b",
  marginBottom: "8px",
};

const appealText: React.CSSProperties = {
  fontSize: "14px",
  color: "#374151",
  lineHeight: "22px",
  marginBottom: "16px",
};

const emailHighlight: React.CSSProperties = {
  color: "#2563eb",
  fontWeight: "500",
};

const ctaSection: React.CSSProperties = {
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

const hr: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "0 32px",
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
