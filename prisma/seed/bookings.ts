/**
 * @file Seed bookings.
 *
 * Date window: 2025-07-01 → 2026-06-30
 *
 * Demo businesses get 80+ bookings each with maximum variety.
 * Regular businesses get 8-20 bookings each.
 * Demo customers get bookings spread across many businesses.
 */

import { getPrisma, d, addMinutes, TIME_SLOTS, pick } from "./helpers";
import type { SeededBusiness } from "./businesses";
import type { SeededService } from "./services";
import type { SeededStaff } from "./staff";
import type { BookingStatus } from "@/generated/prisma/client";

export interface SeededBooking {
  id: string;
  customerId: string;
  businessId: string;
  serviceId: string;
  staffId: string | null;
  status: BookingStatus;
  totalPrice: number;
  date: Date;
  isDemo: boolean;
}

// Pre-built date list across the window (2025-07 → 2026-06)
const WINDOW_DATES: Date[] = [];
for (let m = 0; m < 12; m++) {
  const year = m < 6 ? 2025 : 2026;
  const month = m < 6 ? 7 + m : 1 + (m - 6); // Jul2025..Dec2025, Jan2026..Jun2026
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  for (let day = 1; day <= daysInMonth; day++) {
    WINDOW_DATES.push(d(year, month, day));
  }
}

const NOTES = [
  null,
  null,
  null, // most bookings have no notes
  "First time visit. Looking forward to it!",
  "Please be gentle, I have sensitive skin.",
  "Referred by a friend. Excited to try your services.",
  "Running a bit late, please hold my appointment.",
  "It's my birthday! Celebrating with this booking.",
  "Can I pay with TeleBirr on arrival?",
  "Need to finish by noon — have another appointment.",
  "Allergic to latex — will discuss on arrival.",
  "Same style as last time please.",
  "Please use organic products only.",
  "ውድ ስራ ነው! ደስ ይለኛል — excited!",
  "Emergency booking. Really need this today.",
  "Can I bring my friend along to watch?",
  "Repeat customer — please note I prefer the corner seat.",
];

function noteFor(i: number): string | null {
  return NOTES[i % NOTES.length];
}

function statusForDate(date: Date, i: number): BookingStatus {
  const now = new Date();
  const isPast = date < now;
  if (isPast) {
    // Past bookings: mostly COMPLETED, some CANCELLED, some NO_SHOW
    const r = i % 10;
    if (r < 7) return "COMPLETED";
    if (r < 9) return "CANCELLED";
    return "NO_SHOW";
  } else {
    // Future bookings: CONFIRMED, PENDING, CANCELLED
    const r = i % 10;
    if (r < 5) return "CONFIRMED";
    if (r < 8) return "PENDING";
    return "CANCELLED";
  }
}

interface BookingRow {
  customerId: string;
  businessId: string;
  serviceId: string;
  staffId: string | null;
  date: Date;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  notes: string | null;
  totalPrice: number;
  isCancellable: boolean;
  cancellationFee: number;
  cancellationDeadline: Date | null;
}

export async function seedBookings(
  allCustomerIds: string[],
  demoCustomerIds: string[],
  businesses: SeededBusiness[],
  services: SeededService[],
  allStaff: SeededStaff[]
): Promise<SeededBooking[]> {
  const prisma = getPrisma();
  console.log("📅 Creating bookings...");

  const rows: (BookingRow & { isDemo: boolean })[] = [];

  const svcFor = (bizId: string) =>
    services.filter((s) => s.businessId === bizId && s.isActive);

  const staffFor = (bizId: string) =>
    allStaff.filter((s) => s.businessId === bizId && s.isActive);

  const pickStaff = (bizId: string): string | null => {
    const s = staffFor(bizId);
    return s.length > 0 ? pick(s).id : null;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // DEMO businesses — 90 bookings each, maximally varied
  // ─────────────────────────────────────────────────────────────────────────
  for (let bi = 0; bi < 3; bi++) {
    const biz = businesses[bi];
    const svcs = svcFor(biz.id);
    if (svcs.length === 0) continue;

    // 90 dates spread evenly across the 12-month window
    const step = Math.floor(WINDOW_DATES.length / 90);
    for (let i = 0; i < 90; i++) {
      const dateIdx = (i * step + bi * 30) % WINDOW_DATES.length;
      const date = WINDOW_DATES[dateIdx];
      const svc = svcs[i % svcs.length];
      const startTime = TIME_SLOTS[i % TIME_SLOTS.length];
      const endTime = addMinutes(startTime, svc.duration);
      const status = statusForDate(date, i);
      const note = noteFor(i);

      // Rotate through all customers — demo customers get ~30% share
      let custId: string;
      if (i % 3 === 0) {
        custId = demoCustomerIds[i % demoCustomerIds.length];
      } else {
        custId = allCustomerIds[i % allCustomerIds.length];
      }

      const cancDl = new Date(date);
      cancDl.setUTCDate(cancDl.getUTCDate() - 1);

      rows.push({
        customerId: custId,
        businessId: biz.id,
        serviceId: svc.id,
        staffId: pickStaff(biz.id),
        date,
        startTime,
        endTime,
        status,
        notes: note,
        totalPrice: svc.price,
        isCancellable: i % 15 !== 0, // edge: some non-cancellable
        cancellationFee: i % 7 === 0 ? 100 : 0,
        cancellationDeadline: ["CONFIRMED", "PENDING"].includes(status)
          ? cancDl
          : null,
        isDemo: true,
      });
    }
  }

  // Extra bookings for demo customers at DEMO businesses (high activity demo customers)
  // James Wilson — 40 extra bookings across all 3 demo businesses
  for (let i = 0; i < 40; i++) {
    const bizIdx = i % 3;
    const biz = businesses[bizIdx];
    const svcs = svcFor(biz.id);
    if (svcs.length === 0) continue;
    const dateIdx = (i * 9 + 10) % WINDOW_DATES.length;
    const date = WINDOW_DATES[dateIdx];
    const svc = svcs[i % svcs.length];
    const startTime = TIME_SLOTS[(i + 4) % TIME_SLOTS.length];
    const status = statusForDate(date, i + 3);
    rows.push({
      customerId: demoCustomerIds[0],
      businessId: biz.id,
      serviceId: svc.id,
      staffId: pickStaff(biz.id),
      date,
      startTime,
      endTime: addMinutes(startTime, svc.duration),
      status,
      notes: noteFor(i + 10),
      totalPrice: svc.price,
      isCancellable: true,
      cancellationFee: 0,
      cancellationDeadline: null,
      isDemo: true,
    });
  }

  // Sarah Chen — 35 extra bookings mostly at Spa and Salon businesses
  for (let i = 0; i < 35; i++) {
    const bizIdx =
      i % 2 === 0 ? 1 : Math.min(5 + (i % 4), businesses.length - 1);
    const biz = businesses[bizIdx];
    const svcs = svcFor(biz.id);
    if (svcs.length === 0) continue;
    const dateIdx = (i * 11 + 20) % WINDOW_DATES.length;
    const date = WINDOW_DATES[dateIdx];
    const svc = svcs[i % svcs.length];
    const startTime = TIME_SLOTS[(i + 6) % TIME_SLOTS.length];
    const status = statusForDate(date, i + 1);
    rows.push({
      customerId: demoCustomerIds[1],
      businessId: biz.id,
      serviceId: svc.id,
      staffId: pickStaff(biz.id),
      date,
      startTime,
      endTime: addMinutes(startTime, svc.duration),
      status,
      notes: noteFor(i + 5),
      totalPrice: svc.price,
      isCancellable: i % 10 !== 0,
      cancellationFee: i % 5 === 0 ? 200 : 0,
      cancellationDeadline: null,
      isDemo: true,
    });
  }

  // David Kim — 35 extra bookings heavy on Fitness and Barbershop
  for (let i = 0; i < 35; i++) {
    const bizIdx =
      i % 2 === 0
        ? 2
        : i % 3 === 1
          ? 0
          : Math.min(13 + (i % 3), businesses.length - 1);
    const biz = businesses[bizIdx];
    const svcs = svcFor(biz.id);
    if (svcs.length === 0) continue;
    const dateIdx = (i * 7 + 5) % WINDOW_DATES.length;
    const date = WINDOW_DATES[dateIdx];
    const svc = svcs[i % svcs.length];
    const startTime = TIME_SLOTS[(i + 2) % TIME_SLOTS.length];
    const status = statusForDate(date, i + 2);
    rows.push({
      customerId: demoCustomerIds[2],
      businessId: biz.id,
      serviceId: svc.id,
      staffId: pickStaff(biz.id),
      date,
      startTime,
      endTime: addMinutes(startTime, svc.duration),
      status,
      notes: noteFor(i),
      totalPrice: svc.price,
      isCancellable: true,
      cancellationFee: 0,
      cancellationDeadline: null,
      isDemo: true,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Regular businesses — 10-18 bookings each
  // ─────────────────────────────────────────────────────────────────────────
  for (let bi = 3; bi < businesses.length; bi++) {
    const biz = businesses[bi];
    const svcs = svcFor(biz.id);
    if (svcs.length === 0) continue;

    const count = 10 + (bi % 9); // 10-18
    for (let i = 0; i < count; i++) {
      const dateIdx = (bi * 7 + i * 13) % WINDOW_DATES.length;
      const date = WINDOW_DATES[dateIdx];
      const svc = svcs[i % svcs.length];
      const startTime = TIME_SLOTS[(bi + i) % TIME_SLOTS.length];
      const status = statusForDate(date, i);
      const custId = allCustomerIds[(bi + i * 3) % allCustomerIds.length];

      rows.push({
        customerId: custId,
        businessId: biz.id,
        serviceId: svc.id,
        staffId: pickStaff(biz.id),
        date,
        startTime,
        endTime: addMinutes(startTime, svc.duration),
        status,
        notes: noteFor(bi + i),
        totalPrice: svc.price,
        isCancellable: true,
        cancellationFee: 0,
        cancellationDeadline: null,
        isDemo: false,
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Persist
  // ─────────────────────────────────────────────────────────────────────────
  const seeded: SeededBooking[] = [];
  for (const row of rows) {
    try {
      const b = await prisma.booking.create({
        data: {
          customerId: row.customerId,
          businessId: row.businessId,
          serviceId: row.serviceId,
          staffId: row.staffId,
          date: row.date,
          startTime: row.startTime,
          endTime: row.endTime,
          status: row.status,
          notes: row.notes,
          totalPrice: row.totalPrice,
          isCancellable: row.isCancellable,
          cancellationFee: row.cancellationFee,
          cancellationDeadline: row.cancellationDeadline,
        },
      });
      seeded.push({
        id: b.id,
        customerId: b.customerId,
        businessId: b.businessId,
        serviceId: b.serviceId,
        staffId: b.staffId,
        status: b.status as BookingStatus,
        totalPrice: Number(b.totalPrice),
        date: b.date,
        isDemo: row.isDemo,
      });
    } catch {
      // skip
    }
  }

  const statusCounts = seeded.reduce(
    (acc, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  console.log(`✅ Created ${seeded.length} bookings.`);
  console.log(`   ${JSON.stringify(statusCounts)}\n`);
  return seeded;
}
