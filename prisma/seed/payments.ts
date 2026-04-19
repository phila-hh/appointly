/**
 * @file Seed payments — one payment record per booking.
 *
 * Status mapping:
 *   COMPLETED  → SUCCEEDED
 *   CONFIRMED  → SUCCEEDED (80%) or PENDING (20%)
 *   PENDING    → PENDING (60%) or PENDING with ref (40%)
 *   CANCELLED  → REFUNDED (50%) or FAILED (50%)
 *   NO_SHOW    → SUCCEEDED (customer paid but didn't show)
 */

import { getPrisma, chapaRef } from "./helpers";
import type { SeededBooking } from "./bookings";
import type { PaymentStatus } from "@/generated/prisma/client";

export async function seedPayments(bookings: SeededBooking[]): Promise<void> {
  const prisma = getPrisma();
  console.log("💳 Creating payments...");

  let count = 0;
  let idx = 0;

  for (const booking of bookings) {
    idx++;
    let status: PaymentStatus;
    let txRef: string | null = null;

    switch (booking.status) {
      case "COMPLETED":
        status = "SUCCEEDED";
        txRef = chapaRef();
        break;
      case "CONFIRMED":
        status = idx % 5 === 0 ? "PENDING" : "SUCCEEDED";
        txRef = status === "SUCCEEDED" ? chapaRef() : null;
        break;
      case "PENDING":
        status = "PENDING";
        txRef = idx % 3 === 0 ? chapaRef() : null; // some initiated but not completed
        break;
      case "CANCELLED":
        if (idx % 2 === 0) {
          status = "REFUNDED";
          txRef = chapaRef();
        } else {
          status = "FAILED";
          txRef = idx % 4 === 0 ? chapaRef() : null;
        }
        break;
      case "NO_SHOW":
        status = "SUCCEEDED"; // they paid, just didn't show
        txRef = chapaRef();
        break;
      default:
        status = "PENDING";
    }

    try {
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          chapaTransactionRef: txRef,
          amount: booking.totalPrice,
          status,
        },
      });
      count++;
    } catch {
      // skip (unique constraint)
    }
  }

  console.log(`✅ Created ${count} payments.\n`);
}
