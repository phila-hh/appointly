/**
 * @file Email Verification Template
 * @description Email sent to users after credential-based sign-up
 * to verify their email address.
 *
 * Contains:
 *   - Appointly branding
 *   - Personalized greeting
 *   - Verification button with signed link
 *   - Expiry notice (24 hours)
 *   - Fallback text link
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
  Link,
} from "@react-email/components";
import { render } from "@react-email/components";

interface VerifyEmailProps {
  userName: string;
  verificationUrl: string;
}

export function VerifyEmailTemplate({
  userName,
  verificationUrl,
}: VerifyEmailProps) {
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
            <Text style={headingStyle}>Verify your email address</Text>

            <Text style={paragraphStyle}>Hi {userName},</Text>

            <Text style={paragraphStyle}>
              Thanks for signing up for Appointly! Please verify your email
              address by clicking the button below.
            </Text>

            <Section style={buttonContainerStyle}>
              <Button style={buttonStyle} href={verificationUrl}>
                Verify Email Address
              </Button>
            </Section>

            <Text style={smallTextStyle}>
              This link will expire in 24 hours. If you didn&apos;t create an
              Appointly account, you can safely ignore this email.
            </Text>

            <Hr style={hrStyle} />

            <Text style={fallbackTextStyle}>
              If the button above doesn&apos;t work, copy and paste this link
              into your browser:
            </Text>
            <Link href={verificationUrl} style={linkStyle}>
              {verificationUrl}
            </Link>
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

/**
 * Renders the verification email to an HTML string.
 * Used by the sendEmail function.
 */
export async function renderVerifyEmail(
  props: VerifyEmailProps
): Promise<string> {
  // React Email components render to string via the render utility,
  // but for simplicity we use a manual approach that works without
  // the full render pipeline.
  return render(VerifyEmailTemplate(props));
}

// =============================================================================
// Styles (inline CSS for email compatibility)
// =============================================================================

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

const contentStyle: React.CSSProperties = {
  padding: "32px",
};

const headingStyle: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#18181b",
  marginBottom: "16px",
};

const paragraphStyle: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#374151",
  marginBottom: "16px",
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

const fallbackTextStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#9ca3af",
  marginBottom: "4px",
};

const linkStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#2563eb",
  wordBreak: "break-all" as const,
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
