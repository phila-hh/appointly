/**
 * @file Seed commissions — generated for every SUCCEEDED payment.
 *
 * Commission rate: 10% (matches platform settings).
 * Commission amount = grossAmount * rate
 * Net amount = grossAmount - commissionAmount
 *
 * Status distribution:
 *   - Older bookings (2025-07 to 2025-12): PAID_OUT
 *   - Recent bookings (2026-01 to 2026-03): INCLUDED_IN_PAYOUT
 *   - Latest bookings (2026-04 to 2026-06): PENDING
 */

import { getPrisma, etb } from "./helpers";
import type { SeededBooking } from "./bookings";
import type { CommissionStatus } from "@/generated/prisma/client";

export interface SeededCommission {
  id: string;
  bookingId: string;
  businessId: string;
  status: CommissionStatus;
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
}

export async function seedCommissions(
  bookings: SeededBooking[]
): Promise<SeededCommission[]> {
  const prisma = getPrisma();
  console.log("💰 Creating commissions...");

  const RATE = 0.1;

  // Only bookings with SUCCEEDED payments (COMPLETED + most CONFIRMED + NO_SHOW)
  const eligibleStatuses = ["COMPLETED", "NO_SHOW"] as const;
  const eligible = bookings.filter((b) =>
    (eligibleStatuses as readonly string[]).includes(b.status)
  );

  const results: SeededCommission[] = [];

  for (const booking of eligible) {
    const gross = etb(booking.totalPrice);
    const commission = etb(gross * RATE);
    const net = etb(gross - commission);

    // Determine status based on booking date
    const bookingYear = booking.date.getUTCFullYear();
    const bookingMonth = booking.date.getUTCMonth() + 1; // 1-indexed

    let status: CommissionStatus;
    if (bookingYear === 2025) {
      status = "PAID_OUT";
    } else if (bookingMonth <= 3) {
      status = "INCLUDED_IN_PAYOUT";
    } else {
      status = "PENDING";
    }

    try {
      const c = await prisma.commission.create({
        data: {
          bookingId: booking.id,
          businessId: booking.businessId,
          grossAmount: gross,
          commissionRate: RATE,
          commissionAmount: commission,
          netAmount: net,
          status,
        },
      });
      results.push({
        id: c.id,
        bookingId: c.bookingId,
        businessId: c.businessId,
        status: c.status as CommissionStatus,
        grossAmount: Number(c.grossAmount),
        commissionAmount: Number(c.commissionAmount),
        netAmount: Number(c.netAmount),
      });
    } catch {
      // skip
    }
  }

  console.log(`✅ Created ${results.length} commissions.\n`);
  return results;
}
