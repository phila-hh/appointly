/**
 * @file Chapa Webhook API Route Integration Tests
 * @description Tests for POST /api/webhooks/chapa
 *
 * Covers:
 *   - Missing tx_ref in payload → 400
 *   - Valid tx_ref → calls verifyPaymentAndRevalidate
 *   - Always returns 200 (even on internal errors) to prevent Chapa retry storms
 *   - Returns received: true in all success cases
 *
 * Note: verifyPaymentAndRevalidate is mocked here because it hits the
 * Chapa API and performs complex DB operations tested separately in payment tests.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

import { POST } from "@/app/api/webhooks/chapa/route";

// ── Mock the payment action ──────────────────────────────────────────────────

vi.mock("@/lib/actions/payment", () => ({
  verifyPaymentAndRevalidate: vi.fn(),
}));

import { verifyPaymentAndRevalidate } from "@/lib/actions/payment";
const mockVerify = vi.mocked(verifyPaymentAndRevalidate);

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Builds a Request object simulating a Chapa webhook POST.
 */
function buildWebhookRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost:3000/api/webhooks/chapa", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ────────────────────────────────────────────────────────────────────────────

describe("POST /api/webhooks/chapa", () => {
  // ── Missing tx_ref ──────────────────────────────────────────────────────

  it("returns 400 when tx_ref is missing from payload", async () => {
    const request = buildWebhookRequest({ event: "charge.success" });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Missing tx_ref");
  });

  // ── Successful webhook ──────────────────────────────────────────────────

  it("calls verifyPaymentAndRevalidate with the tx_ref from the payload", async () => {
    mockVerify.mockResolvedValue({ status: "SUCCEEDED" });

    const request = buildWebhookRequest({
      event: "charge.success",
      tx_ref: "appointly-abc123-1700000000",
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    expect(mockVerify).toHaveBeenCalledWith("appointly-abc123-1700000000");
  });

  it("returns received: true and the payment status on success", async () => {
    mockVerify.mockResolvedValue({ status: "SUCCEEDED" });

    const request = buildWebhookRequest({
      event: "charge.success",
      tx_ref: "appointly-test-ref",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(body.received).toBe(true);
    expect(body.status).toBe("SUCCEEDED");
  });

  // ── Verification failure ────────────────────────────────────────────────

  it("returns 200 with error field when verification fails", async () => {
    mockVerify.mockResolvedValue({ error: "Payment not found in Chapa" });

    const request = buildWebhookRequest({
      event: "charge.success",
      tx_ref: "appointly-bad-ref",
    });

    const response = await POST(request);

    // Still 200 — prevents Chapa retry storms
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.received).toBe(true);
    expect(body.error).toBeDefined();
  });

  // ── Internal errors return 200 ──────────────────────────────────────────

  it("returns 200 even when verifyPaymentAndRevalidate throws", async () => {
    mockVerify.mockRejectedValue(new Error("Database connection lost"));

    const request = buildWebhookRequest({
      event: "charge.success",
      tx_ref: "appointly-crash-ref",
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.received).toBe(true);
  });
});
