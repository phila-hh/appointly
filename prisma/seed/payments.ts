/**
 * @file Seed payments — payment records for bookings with all statuses
 */

import { getPrisma, chapaRef } from "./helpers";
import type { SeededBooking } from "./bookings";
import type { PaymentStatus } from "@/generated/prisma/client";

export async function seedPayments(bookings: SeededBooking[]): Promise<void> {
  const prisma = getPrisma();
  console.log("💳 Creating payments...");

  let count = 0;
  let refIndex = 1;

  for (const booking of bookings) {
    let paymentStatus: PaymentStatus;
    let txRef: string | null;

    switch (booking.status) {
      case "COMPLETED":
        paymentStatus = "SUCCEEDED";
        txRef = chapaRef(refIndex++);
        break;
      case "CONFIRMED":
        // Most confirmed have succeeded payments, some still pending
        if (refIndex % 5 === 0) {
          paymentStatus = "PENDING";
          txRef = null;
        } else {
          paymentStatus = "SUCCEEDED";
          txRef = chapaRef(refIndex++);
        }
        break;
      case "PENDING":
        // Mix of pending and no payment yet
        if (refIndex % 3 === 0) {
          paymentStatus = "PENDING";
          txRef = null;
        } else {
          paymentStatus = "PENDING";
          txRef = chapaRef(refIndex++);
        }
        break;
      case "CANCELLED":
        // Mix of refunded and failed
        if (refIndex % 2 === 0) {
          paymentStatus = "REFUNDED";
          txRef = chapaRef(refIndex++);
        } else {
          paymentStatus = "FAILED";
          txRef = chapaRef(refIndex++);
        }
        break;
      case "NO_SHOW":
        // Payment was succeeded but customer didn't show
        paymentStatus = "SUCCEEDED";
        txRef = chapaRef(refIndex++);
        break;
      default:
        paymentStatus = "PENDING";
        txRef = null;
    }

    try {
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          chapaTransactionRef: txRef,
          amount: booking.totalPrice,
          status: paymentStatus,
        },
      });
      count++;
    } catch {
      // Skip if booking already has a payment (unique constraint)
    }
  }

  console.log(`✅ Created ${count} payments.\n`);
}
