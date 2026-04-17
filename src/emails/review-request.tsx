/**
 * @file Review Request Email Template
 * @description Sent to the customer after a booking is marked COMPLETED.
 *
 * Contains:
 *   - Thank you message
 *   - Star rating prompt
 *   - "Leave a Review" CTA
 *   - Unsubscribe link (optional email — user can disable)
 */

import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Link,
} from "@react-email/components";
import { render } from "@react-email/components";

export interface ReviewRequestEmailProps {
  customerName: string;
  businessName: string;
  serviceName: string;
  serviceDate: string;
  bookingId: string;
  reviewUrl: string;
  unsubscribeUrl: string;
}

export function ReviewRequestEmail({
  customerName,
  businessName,
  serviceName,
  serviceDate,
  bookingId,
  reviewUrl,
  unsubscribeUrl,
}: ReviewRequestEmailProps) {
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
            <Text style={heroEmoji}>⭐</Text>
            <Text style={heroHeading}>How was your appointment?</Text>
            <Text style={heroParagraph}>
              Hi {customerName}, we hope your <strong>{serviceName}</strong>{" "}
              appointment at <strong>{businessName}</strong> on {serviceDate}{" "}
              went well!
            </Text>
          </Section>

          {/* Review CTA */}
          <Section style={reviewSection}>
            <Text style={reviewSubtitle}>
              Your feedback helps other customers make better choices and helps{" "}
              {businessName} improve their services.
            </Text>

            {/* Star rating visual (decorative, clicking any goes to review page) */}
            <Section style={starsSection}>
              {["⭐", "⭐", "⭐", "⭐", "⭐"].map((star, i) => (
                <Text key={i} style={starStyle}>
                  {star}
                </Text>
              ))}
            </Section>

            <Text style={reviewPrompt}>Takes less than a minute!</Text>

            <Button style={primaryButton} href={reviewUrl}>
              Leave a Review
            </Button>
          </Section>

          {/* Thank you note */}
          <Section style={thankYouSection}>
            <Text style={thankYouText}>
              Thank you for choosing Appointly. We look forward to seeing you
              again!
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Appointly. All rights reserved.
            </Text>
            <Text style={footerText}>Booking ID: {bookingId}</Text>
            <Text style={footerText}>
              Don&apos;t want review request emails?{" "}
              <Link href={unsubscribeUrl} style={unsubscribeLink}>
                Unsubscribe
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export async function renderReviewRequestEmail(
  props: ReviewRequestEmailProps
): Promise<string> {
  return render(<ReviewRequestEmail {...props} />);
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
const reviewSection: React.CSSProperties = {
  padding: "0 32px 32px",
  textAlign: "center" as const,
};
const reviewSubtitle: React.CSSProperties = {
  fontSize: "15px",
  color: "#374151",
  lineHeight: "24px",
  marginBottom: "24px",
};
const starsSection: React.CSSProperties = { marginBottom: "8px" };
const starStyle: React.CSSProperties = {
  display: "inline",
  fontSize: "32px",
  margin: "0 4px",
};
const reviewPrompt: React.CSSProperties = {
  fontSize: "13px",
  color: "#6b7280",
  marginBottom: "20px",
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
const thankYouSection: React.CSSProperties = { padding: "0 32px 32px" };
const thankYouText: React.CSSProperties = {
  fontSize: "15px",
  color: "#374151",
  textAlign: "center" as const,
  lineHeight: "24px",
  backgroundColor: "#f9fafb",
  padding: "16px",
  borderRadius: "8px",
  margin: 0,
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
const unsubscribeLink: React.CSSProperties = {
  color: "#9ca3af",
  textDecoration: "underline",
};
