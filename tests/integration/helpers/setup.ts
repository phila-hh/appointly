/**
 * @file Integration Test Setup
 * @description Runs before every integration test file.
 * Unlike unit tests, we do NOT mock next/navigation or next/cache globally —
 * we mock only what each test file needs locally.
 * We DO mock external services (email, AI, Chapa) to avoid real network calls.
 */

import { vi, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock next/cache — prevents revalidatePath errors in server actions
// ---------------------------------------------------------------------------
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Mock next/navigation — redirect/notFound used in guards
// ---------------------------------------------------------------------------
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

// ---------------------------------------------------------------------------
// Mock email sending — no real SMTP in tests
// ---------------------------------------------------------------------------
vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

// ---------------------------------------------------------------------------
// Mock email template rendering — no React email rendering needed
// ---------------------------------------------------------------------------
vi.mock("@/emails/verify-email", () => ({
  renderVerifyEmail: vi.fn().mockResolvedValue("<html>verify</html>"),
}));

vi.mock("@/emails/welcome", () => ({
  renderWelcomeEmail: vi.fn().mockResolvedValue("<html>welcome</html>"),
}));

vi.mock("@/emails/booking-confirmation", () => ({
  renderBookingConfirmationEmail: vi
    .fn()
    .mockResolvedValue("<html>confirm</html>"),
}));

vi.mock("@/emails/new-booking-notification", () => ({
  renderNewBookingNotificationEmail: vi
    .fn()
    .mockResolvedValue("<html>notify</html>"),
}));

vi.mock("@/emails/booking-cancelled", () => ({
  renderBookingCancelledEmail: vi
    .fn()
    .mockResolvedValue("<html>cancelled</html>"),
}));

vi.mock("@/emails/review-request", () => ({
  renderReviewRequestEmail: vi.fn().mockResolvedValue("<html>review</html>"),
}));

vi.mock("@/emails/payout-processed", () => ({
  renderPayoutProcessedEmail: vi.fn().mockResolvedValue("<html>payout</html>"),
}));

vi.mock("@/emails/booking-reminder", () => ({
  renderBookingReminderEmail: vi
    .fn()
    .mockResolvedValue("<html>reminder</html>"),
}));

// ---------------------------------------------------------------------------
// Mock AI sentiment analysis — no real Hugging Face calls in tests
// ---------------------------------------------------------------------------
vi.mock("@/lib/ai", () => ({
  analyzeSentiment: vi.fn().mockResolvedValue({
    label: "positive",
    score: 0.95,
  }),
}));

// ---------------------------------------------------------------------------
// Mock Chapa — no real payment gateway calls in tests
// ---------------------------------------------------------------------------
vi.mock("@/lib/chapa", () => ({
  chapaInitialize: vi.fn().mockResolvedValue("https://checkout.chapa.co/test"),
  chapaVerify: vi.fn().mockResolvedValue({
    message: "Payment verified",
    status: "success",
    data: { status: "success", tx_ref: "test-ref" },
  }),
  generateTxRef: vi.fn((bookingId: string) => `appointly-test-${bookingId}`),
}));

// ---------------------------------------------------------------------------
// Mock email-service — actions call these; we verify behavior not emails
// ---------------------------------------------------------------------------
vi.mock("@/lib/email-service", () => ({
  sendBookingConfirmationEmail: vi.fn().mockResolvedValue(undefined),
  sendNewBookingNotificationEmail: vi.fn().mockResolvedValue(undefined),
  sendPaymentReceiptEmail: vi.fn().mockResolvedValue(undefined),
  sendBookingReminderEmail: vi.fn().mockResolvedValue(undefined),
  sendBookingCancelledEmails: vi.fn().mockResolvedValue(undefined),
  sendReviewRequestEmail: vi.fn().mockResolvedValue(undefined),
}));

// ---------------------------------------------------------------------------
// Clean up mocks after each test
// ---------------------------------------------------------------------------
afterEach(() => {
  vi.clearAllMocks();
});
