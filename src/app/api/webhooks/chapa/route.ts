/**
 * @file Chapa Webhook Handler
 * @description API route that receives webhook events from Chapa.
 *
 * When a payment is completed on Chapa's side, Chapa sends a POST
 * request to our callback_url with the transaction details.
 *
 * This handler:
 *   1. Receives the webhook payload
 *   2. Extracts the transaction reference (tx_ref)
 *   3. Verifies the transaction via Chapa's verify API
 *   4. Updates payments and booking records if verified
 *
 * This handler is IDEMPOTENT — processing the same webhook twice
 * produces the same result (safe for Chapa's retry mechanism).
 *
 * Note: During local development Chapa cannot reach localhost.
 * Webhooks will only work when deployed on a public URL, or when
 * using a tunneling tool like ngrok. The return_url verification
 * (payment success page) handles payment confirmation during dev.
 *
 * @see https://developer.chapa.co/docs/webhooks/
 */

import { NextResponse } from "next/server";

import { verifyPaymentAndRevalidate } from "@/lib/actions/payment";

/**
 * POST /api/webhooks/chapa
 *
 * Receives webhook event from Chapa after a payment is processed.
 *
 * Expected payload:
 * ```json
 * {
 *   "event": "charge.success",
 *   "tx_ref": "appointly-abc123-1700000000",
 *   ...additional payment data
 * }
 * ```
 */
export async function POST(request: Request) {
  try {
    // Parse the webhook payload
    const body = await request.json();

    console.log("Chapa webhook received:", {
      event: body.event,
      tx_ref: body.tx_ref,
    });

    // Extract the transaction reference
    const txRef = body.tx_ref as string | undefined;

    if (!txRef) {
      console.error("Webhook missing tx_ref");
      return NextResponse.json({ error: "Missing tx_ref" }, { status: 400 });
    }

    // Verify the transaction via Chapa's API
    // This is the authoritative check — we never trust the webhook payload alone
    const result = await verifyPaymentAndRevalidate(txRef);

    if (result.error) {
      console.error("Webhook verification failed:", result.error);
      // Return 200 anyway to prevent Chapa from verifying endlessly
      // The error is logged for investigation
      return NextResponse.json({ received: true, error: result.error });
    }

    console.log("Webhook processed successfully:", {
      tx_ref: txRef,
      status: result.status,
    });

    // Return 200 to acknowledge receipt
    return NextResponse.json({
      received: true,
      status: result.status,
    });
  } catch (error) {
    console.error("Webhook handler error:", error);
    // Return 200 even on errors to prevent retry storms
    return NextResponse.json(
      { received: true, error: "Internal processing error." },
      { status: 200 }
    );
  }
}
