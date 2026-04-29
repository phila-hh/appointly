/**
 * @file Chapa Payment Gateway Client
 * @description Typed wrapper around the Chapa REST API for payment processing.
 *
 * Chapa is a payment gateway that supports:
 *   - Telebiirr, CBE Birr, Amole, M-Pesa
 *   - Visa / Mastercard
 *   - Bank transfers
 *
 * Payment flow:
 *   1. Initialize transaction → receive checkout_url
 *   2. Redirect customer to Chapa's hosted checkout page
 *   3. Customer completes payment (Telebirr, card, etc.)
 *   4. Chapa redirects customer back to our return_url
 *   5. Verify transaction via API to confirm payment status
 *   6. Webhook fires asynchronously for server-side confirmation
 *
 * Refund flow:
 *   1. Cancellation triggers processRefund() in payment.ts
 *   2. chapaRefund() is called with the original tx_ref and amount
 *   3. Test mode: simulates success immediately (Chapa sandbox does not
 *      process real refunds — this is expected for FYP/test environments)
 *   4. Live mode: POSTs to Chapa's refund endpoint
 *   5. Refund typically takes 3–5 business days to reach the customer
 *
 * All API calls use the server-side secret key (CHAPA_SECRET_KEY).
 * This module is never imported in client components.
 *
 * @see https://developer.chapa.co/integrations/accept-payments/
 */

/** Base URL for the Chapa API */
const CHAPA_API_BASE = "https://api.chapa.co/v1";

/**
 * Retrieves the Chapa secret key from environment variables.
 * Throws if the key is not configured.
 */
function getSecretKey(): string {
  const key = process.env.CHAPA_SECRET_KEY;
  if (!key) {
    throw new Error("CHAPA_SECRET_KEY is not set. Add it to your .env file.");
  }
  return key;
}

/**
 * Returns true when running against the Chapa test/sandbox environment.
 * Test keys begin with "CHASECK_TEST_".
 * Used to simulate refund success without hitting a live endpoint.
 */
function isTestMode(): boolean {
  const key = process.env.CHAPA_SECRET_KEY ?? "";
  return key.startsWith("CHASECK_TEST_");
}

// =============================================================================
// Types
// =============================================================================

/** Parameters for initializing a Chapa transaction. */
export interface ChapaInitializeParams {
  /** Payment amount in ETB */
  amount: number;
  /** Customer's email address */
  email: string;
  /** Customer's first name */
  firstName: string;
  /** Customer's last name */
  lastName: string;
  /** Unique transaction reference (must be unique per transaction) */
  txRef: string;
  /** URL Chapa redirects the customer to after payment */
  returnUrl: string;
  /** URL Chapa sends webhook POST to after payment */
  callbackUrl: string;
  /** Title shown on Chapa's checkout page */
  title?: string;
  /** Description shown on Chapa's checkout page */
  description?: string;
}

/** Successful response from Chapa's initialize endpoint. */
export interface ChapaInitializeResponse {
  message: string;
  status: "success";
  data: {
    checkout_url: string;
  };
}

/** Response from Chapa's verify endpoint. */
export interface ChapaVerifyResponse {
  message: string;
  status: "success" | "failed";
  data: {
    first_name: string;
    last_name: string;
    email: string;
    currency: string;
    amount: number;
    charge: string;
    mode: string;
    method: string;
    type: string;
    status: "success" | "failed" | "pending";
    reference: string;
    tx_ref: string;
    created_at: string;
    updated_at: string;
  } | null;
}

/**
 * Response from Chapa's refund endpoint.
 *
 * In test mode this shape is simulated locally — no real API call is made.
 * In live mode this reflects the actual Chapa API response body.
 */
export interface ChapaRefundResponse {
  status: "success" | "failed";
  message: string;
}

/** Error response from Chapa API. */
export interface ChapaErrorResponse {
  message: string;
  status: "failed";
  data: null;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Initialize a new payment transaction with Chapa.
 *
 * Creates a hosted checkout session. The returned `checkout_url` is where
 * the customer should be redirected to complete their payment.
 *
 * @param params - Transaction initialization parameters
 * @returns The checkout URL on success
 * @throws Error if the API call fails
 *
 * @example
 * ```ts
 * const checkoutUrl = await chapaInitialize({
 *   amount: 350,
 *   email: "customer@example.com",
 *   firstName: "James",
 *   lastName: "Wilson",
 *   txRef: "appointly-abc123-1700000000",
 *   returnUrl: "https://appointly.com/bookings/abc123/payment-success",
 *   callbackUrl: "https://appointly.com/api/webhooks/chapa",
 * });
 * // → "https://checkout.chapa.co/checkout/payment/..."
 * ```
 */
export async function chapaInitialize(
  params: ChapaInitializeParams
): Promise<string> {
  const secretKey = getSecretKey();

  const body = {
    amount: params.amount.toString(),
    currency: "ETB",
    email: params.email,
    first_name: params.firstName,
    last_name: params.lastName,
    tx_ref: params.txRef,
    return_url: params.returnUrl,
    callback_url: params.callbackUrl,
    "customization[title]": params.title ?? "Appointly Payment",
    "customization[description]":
      params.description ?? "Payment for appointment booking",
  };

  const response = await fetch(`${CHAPA_API_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok || data.status !== "success") {
    console.error("Chapa initialize error:", data);
    throw new Error(
      (data as ChapaErrorResponse).message ??
        "Failed to initialize payment with Chapa."
    );
  }

  const result = data as ChapaInitializeResponse;
  return result.data.checkout_url;
}

/**
 * Verifies a transaction with Chapa using the transaction reference.
 *
 * Should be called:
 *   1. When the customer returns from Chapa's checkout page (return_url)
 *   2. When a webhook is received from Chapa (callback_url)
 *
 * NEVER trust client-side success indicators alone — always verify
 * server-side through this endpoint.
 *
 * @param txRef - The unique transaction reference used during initialization
 * @returns The verification response with payment details
 * @throws Error if the API call fails
 *
 * @example
 * ```ts
 * const result = await chapaVerify("appointly-abc123-1700000000");
 * if (result.data?.status === "success") {
 *   // Payment confirmed — update booking status
 * }
 * ```
 */
export async function chapaVerify(txRef: string): Promise<ChapaVerifyResponse> {
  const secretKey = getSecretKey();

  const response = await fetch(
    `${CHAPA_API_BASE}/transaction/verify/${txRef}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("Chapa verify error:", data);
    throw new Error(
      (data as ChapaErrorResponse).message ??
        "Failed to verify payment with Chapa."
    );
  }

  return data as ChapaVerifyResponse;
}

/**
 * Requests a refund for a previously completed Chapa transaction.
 *
 * Test mode behaviour:
 *   When CHAPA_SECRET_KEY begins with "CHASECK_TEST_", no real API call
 *   is made. The function waits 100ms to simulate network latency and
 *   returns a synthetic success response. This is the expected behaviour
 *   for FYP / sandbox environments — Chapa's test environment does not
 *   process real refunds.
 *
 * Live mode behaviour:
 *   POSTs to Chapa's refund endpoint with the original transaction
 *   reference and the refund amount. Chapa typically processes refunds
 *   within 3–5 business days.
 *
 * Future-proofing:
 *   Switching from test to live mode requires only updating the
 *   CHAPA_SECRET_KEY environment variable. No code changes needed.
 *
 * @param txRef  - The original transaction reference to refund
 * @param amount - The amount to refund in ETB (full refund only for now)
 * @returns ChapaRefundResponse with status and message
 *
 * @example
 * ```ts
 * const result = await chapaRefund("appointly-abc123-1700000000", 350);
 * if (result.status === "success") {
 *   // Update payment record as refunded
 * }
 * ```
 */
export async function chapaRefund(
  txRef: string,
  amount: number
): Promise<ChapaRefundResponse> {
  // -------------------------------------------------------------------------
  // Test mode: simulate success — Chapa sandbox does not process refunds
  // -------------------------------------------------------------------------
  if (isTestMode()) {
    console.log(
      `💸 [TEST MODE] Simulating refund for tx_ref=${txRef}, amount=${amount} ETB`
    );

    // Simulate realistic network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      status: "success",
      message: "Refund simulated successfully (test mode).",
    };
  }

  // -------------------------------------------------------------------------
  // Live mode: call the real Chapa refund endpoint
  // -------------------------------------------------------------------------
  const secretKey = getSecretKey();

  const response = await fetch(`${CHAPA_API_BASE}/refund`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tx_ref: txRef,
      amount: amount.toString(),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Chapa refund error:", data);
    // Return a failed response rather than throwing — the caller
    // (processRefund in payment.ts) handles the failure gracefully
    return {
      status: "failed",
      message:
        (data as ChapaErrorResponse).message ??
        "Refund request failed with Chapa.",
    };
  }

  return {
    status: "success",
    message: data.message ?? "Refund processed successfully.",
  };
}

/**
 * Generate a unique transaction reference for a booking.
 *
 * Format: appointly-{shortBookingId}-{timestamp}
 * This ensures uniqueness even if the same booking is retried.
 *
 * @param bookingId - The booking this payment is for
 * @returns A unique tx_ref string
 */
export function generateTxRef(bookingId: string): string {
  const timestamp = Date.now();
  // Take last 8 characters of bookingId to keep it readable
  const shortId = bookingId.slice(-8);
  return `appointly-${shortId}-${timestamp}`;
}
