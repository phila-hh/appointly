/**
 * @file Welcome Email Template
 * @description Sent to new users after successful email verification.
 *
 * Contains:
 *   - Appointly branding
 *   - Welcome message with role-specific guidance
 *   - Quick start steps
 *   - CTA button (Browse Services or Set Up Business)
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

interface WelcomeEmailProps {
  userName: string;
  userRole: "CUSTOMER" | "BUSINESS_OWNER";
}

export function WelcomeEmailTemplate({
  userName,
  userRole,
}: WelcomeEmailProps) {
  const isBusinessOwner = userRole === "BUSINESS_OWNER";

  const ctaUrl = isBusinessOwner
    ? `${process.env.AUTH_URL ?? "http://localhost:3000"}/dashboard/setup`
    : `${process.env.AUTH_URL ?? "http://localhost:3000"}/browse`;

  const ctaText = isBusinessOwner ? "Set Up Your Business" : "Browse Services";

  return (
    <Html>
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={logoStyle}>📅 Appointly</Text>
          </Section>

          {/* Content */}
          <Section style={contentStyle}>
            <Text style={headingStyle}>Welcome to Appointly! 🎉</Text>

            <Text style={paragraphStyle}>Hi {userName},</Text>

            <Text style={paragraphStyle}>
              {isBusinessOwner
                ? "Your account has been created and your email is verified. You're all set to list your business and start receiving bookings from customers."
                : "Your account has been created and your email is verified. You're all set to discover local service providers and book appointments."}
            </Text>

            {/* Quick start steps */}
            <Text style={subheadingStyle}>Getting Started</Text>

            {isBusinessOwner ? (
              <>
                <Text style={stepStyle}>
                  1️⃣ <strong>Set up your business</strong> — Add your name,
                  description, and contact info
                </Text>
                <Text style={stepStyle}>
                  2️⃣ <strong>Add services</strong> — List what you offer with
                  prices and durations
                </Text>
                <Text style={stepStyle}>
                  3️⃣ <strong>Set your hours</strong> — Define when customers can
                  book
                </Text>
                <Text style={stepStyle}>
                  4️⃣ <strong>Start receiving bookings</strong> — Customers can
                  find and book with you
                </Text>
              </>
            ) : (
              <>
                <Text style={stepStyle}>
                  1️⃣ <strong>Browse services</strong> — Discover local
                  businesses in your area
                </Text>
                <Text style={stepStyle}>
                  2️⃣ <strong>Book an appointment</strong> — Choose a service,
                  pick a date and time
                </Text>
                <Text style={stepStyle}>
                  3️⃣ <strong>Pay securely</strong> — Complete payment via Chapa
                </Text>
                <Text style={stepStyle}>
                  4️⃣ <strong>Leave a review</strong> — Share your experience
                  with the community
                </Text>
              </>
            )}

            <Section style={buttonContainerStyle}>
              <Button style={buttonStyle} href={ctaUrl}>
                {ctaText}
              </Button>
            </Section>

            <Hr style={hrStyle} />

            <Text style={smallTextStyle}>
              If you have any questions, feel free to reach out. We&apos;re here
              to help!
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              © {new Date().getFullYear()} Appointly. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export async function renderWelcomeEmail(
  props: WelcomeEmailProps
): Promise<string> {
  return render(WelcomeEmailTemplate(props));
}

// Styles (same as verify-email for consistency)
const bodyStyle: React.CSSProperties = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
  margin: 0,
  padding: 0,
};
const containerStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  maxWidth: "600px",
  borderRadius: "8px",
  overflow: "hidden",
  marginTop: "40px",
  marginBottom: "40px",
};
const headerStyle: React.CSSProperties = {
  backgroundColor: "#18181b",
  padding: "24px 32px",
};
const logoStyle: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: "bold",
  margin: 0,
};
const contentStyle: React.CSSProperties = { padding: "32px" };
const headingStyle: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#18181b",
  marginBottom: "16px",
};
const subheadingStyle: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#18181b",
  marginTop: "24px",
  marginBottom: "12px",
};
const paragraphStyle: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#374151",
  marginBottom: "16px",
};
const stepStyle: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#374151",
  marginBottom: "8px",
  paddingLeft: "4px",
};
const buttonContainerStyle: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "32px 0",
};
const buttonStyle: React.CSSProperties = {
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
const smallTextStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#6b7280",
  lineHeight: "22px",
};
const hrStyle: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
};
const footerStyle: React.CSSProperties = {
  padding: "24px 32px",
  backgroundColor: "#f9fafb",
};
const footerTextStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#9ca3af",
  textAlign: "center" as const,
  margin: 0,
};
