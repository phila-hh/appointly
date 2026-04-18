/**
 * @file Account Reactivated Email Template
 * @description Sent to a user or business owner when their account
 * or business listing has been reactivated by an admin.
 *
 * Contains:
 *   - Positive reactivation confirmation
 *   - What is restored
 *   - CTA to sign in / view business
 */

import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
} from "@react-email/components";
import { render } from "@react-email/components";

export interface AccountReactivatedEmailProps {
  recipientName: string;
  reactivationType: "account" | "business";
  businessName?: string | null;
  ctaUrl: string;
}

export function AccountReactivatedEmail({
  recipientName,
  reactivationType,
  businessName,
  ctaUrl,
}: AccountReactivatedEmailProps) {
  const isAccount = reactivationType === "account";

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
            <Text style={heroEmoji}>✅</Text>
            <Text style={heroHeading}>
              {isAccount
                ? "Account Reactivated"
                : "Business Listing Reactivated"}
            </Text>
            <Text style={heroParagraph}>
              Hi {recipientName}, great news! Your{" "}
              {isAccount
                ? "Appointly account"
                : `business listing "${businessName}"`}{" "}
              has been reactivated by our platform team.
            </Text>
          </Section>

          {/* What's restored */}
          <Section style={card}>
            <Text style={cardTitle}>What&apos;s Restored</Text>
            {isAccount ? (
              <>
                <Text style={restoreItem}>
                  ✓ Full access to your account and bookings
                </Text>
                <Text style={restoreItem}>
                  ✓ Ability to browse and book appointments
                </Text>
                <Text style={restoreItem}>
                  ✓ Your profile and history are intact
                </Text>
              </>
            ) : (
              <>
                <Text style={restoreItem}>
                  ✓ Your business is visible in public listings
                </Text>
                <Text style={restoreItem}>
                  ✓ Customers can discover and book your services
                </Text>
                <Text style={restoreItem}>
                  ✓ All your services and settings are preserved
                </Text>
              </>
            )}
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Text style={ctaText}>
              {isAccount
                ? "You can now sign in and continue using Appointly."
                : "Your business is live again. Log in to your dashboard to review your listings."}
            </Text>
            <Button style={primaryButton} href={ctaUrl}>
              {isAccount ? "Sign In" : "Go to Dashboard"}
            </Button>
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

export async function renderAccountReactivatedEmail(
  props: AccountReactivatedEmailProps
): Promise<string> {
  return render(<AccountReactivatedEmail {...props} />);
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
  backgroundColor: "#f0fdf4",
  padding: "40px 32px 24px",
  textAlign: "center" as const,
  borderBottom: "1px solid #dcfce7",
};
const heroEmoji: React.CSSProperties = { fontSize: "48px", margin: "0 0 8px" };
const heroHeading: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#15803d",
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
  backgroundColor: "#f0fdf4",
  borderRadius: "8px",
  border: "1px solid #dcfce7",
};
const cardTitle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#6b7280",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  marginBottom: "12px",
  marginTop: 0,
};
const restoreItem: React.CSSProperties = {
  fontSize: "14px",
  color: "#15803d",
  lineHeight: "24px",
  margin: "4px 0",
};
const ctaSection: React.CSSProperties = {
  padding: "32px",
  textAlign: "center" as const,
};
const ctaText: React.CSSProperties = {
  fontSize: "15px",
  color: "#374151",
  marginBottom: "20px",
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
