/**
 * @file Booking Reminder Email Template
 * @description Sent to the customer 24 hours before their appointment.
 *
 * Contains:
 *   - Appointment summary
 *   - Business location
 *   - "View Booking" CTA
 *   - What to bring / preparation notes
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
  Hr,
  Row,
  Column,
  Link,
} from "@react-email/components";
import { render } from "@react-email/components";

export interface BookingReminderEmailProps {
  customerName: string;
  businessName: string;
  businessAddress?: string | null;
  businessPhone?: string | null;
  serviceName: string;
  serviceDate: string;
  serviceTime: string;
  staffName?: string | null;
  bookingId: string;
  bookingUrl: string;
  unsubscribeUrl: string;
}

export function BookingReminderEmail({
  customerName,
  businessName,
  businessAddress,
  businessPhone,
  serviceName,
  serviceDate,
  serviceTime,
  staffName,
  bookingId,
  bookingUrl,
  unsubscribeUrl,
}: BookingReminderEmailProps) {
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
            <Text style={heroEmoji}>⏰</Text>
            <Text style={heroHeading}>Appointment Reminder</Text>
            <Text style={heroParagraph}>
              Hi {customerName}, just a friendly reminder that you have an
              appointment tomorrow!
            </Text>
          </Section>

          {/* Appointment Details */}
          <Section style={card}>
            <Text style={cardTitle}>Your Appointment</Text>

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
                  <Column style={detailLabel}>With</Column>
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
              <Column
                style={{
                  ...detailValue,
                  fontWeight: "bold",
                  color: "#18181b",
                }}
              >
                {serviceTime}
              </Column>
            </Row>
          </Section>

          {/* Location */}
          {(businessAddress || businessPhone) && (
            <Section style={{ ...card, marginTop: "16px" }}>
              <Text style={cardTitle}>Getting There</Text>
              {businessAddress && (
                <Text style={infoText}>📍 {businessAddress}</Text>
              )}
              {businessPhone && (
                <Text style={infoText}>📞 {businessPhone}</Text>
              )}
            </Section>
          )}

          {/* Tip */}
          <Section style={tipSection}>
            <Text style={tipText}>
              💡 <strong>Tip:</strong> Please arrive 5 minutes early to ensure
              your appointment starts on time. If you need to cancel or
              reschedule, please do so as soon as possible.
            </Text>
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Button style={primaryButton} href={bookingUrl}>
              View Booking Details
            </Button>
          </Section>

          {/* Booking ID */}
          <Section style={{ padding: "0 32px 16px" }}>
            <Text style={bookingIdText}>Booking ID: {bookingId}</Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Appointly. All rights reserved.
            </Text>
            <Text style={footerText}>
              Don&apos;t want reminder emails?{" "}
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

export async function renderBookingReminderEmail(
  props: BookingReminderEmailProps
): Promise<string> {
  return render(<BookingReminderEmail {...props} />);
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
const infoText: React.CSSProperties = {
  fontSize: "14px",
  color: "#374151",
  margin: "4px 0",
};
const tipSection: React.CSSProperties = { padding: "16px 32px" };
const tipText: React.CSSProperties = {
  fontSize: "14px",
  color: "#374151",
  lineHeight: "22px",
  backgroundColor: "#eff6ff",
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
const unsubscribeLink: React.CSSProperties = {
  color: "#9ca3af",
  textDecoration: "underline",
};
