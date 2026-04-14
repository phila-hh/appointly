/**
 * @file Seed bookings — massive variety of bookings covering all statuses,
 * edge cases, and date ranges (past, present, future)
 */

import {
  getPrisma,
  getDateThisMonth,
  getDateLastMonth,
  getDateNextMonth,
  addMinutesToTime,
} from "./helpers";
import type { SeededService } from "./services";
import type { SeededBusiness } from "./businesses";
import type { BookingStatus } from "@/generated/prisma/client";

export interface SeededBooking {
  id: string;
  customerId: string;
  businessId: string;
  serviceId: string;
  status: BookingStatus;
  totalPrice: number;
  date: Date;
}

interface BookingDef {
  customerIndex: number;
  businessIndex: number;
  serviceFilter: (s: SeededService) => boolean;
  day: number;
  month: "last" | "this" | "next";
  startTime: string;
  status: BookingStatus;
  notes?: string;
  isCancellable?: boolean;
  cancellationFee?: number;
}

export async function seedBookings(
  customerIds: string[],
  businesses: SeededBusiness[],
  services: SeededService[]
): Promise<SeededBooking[]> {
  const prisma = getPrisma();
  console.log("📅 Creating bookings...");

  const getServiceForBusiness = (
    bizIndex: number,
    filter?: (s: SeededService) => boolean
  ): SeededService => {
    const bizServices = services.filter(
      (s) => s.businessId === businesses[bizIndex].id && s.isActive
    );
    if (filter) {
      const filtered = bizServices.filter(filter);
      if (filtered.length > 0)
        return filtered[Math.floor(Math.random() * filtered.length)];
    }
    return bizServices[Math.floor(Math.random() * bizServices.length)];
  };

  const getDate = (month: "last" | "this" | "next", day: number): Date => {
    switch (month) {
      case "last":
        return getDateLastMonth(day);
      case "next":
        return getDateNextMonth(day);
      default:
        return getDateThisMonth(day);
    }
  };

  // Generate a comprehensive list of bookings
  const bookingDefs: BookingDef[] = [];

  const startTimes = [
    "08:00",
    "08:30",
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
    "18:00",
    "18:30",
    "19:00",
  ];

  const noteOptions = [
    null,
    "First time visit. Excited to try your services!",
    "Please be gentle, I have sensitive skin.",
    "Referred by a friend. Looking forward to it.",
    "Running a bit late, please hold my spot.",
    "Celebration booking — it's my birthday!",
    "Can I get a complimentary drink?",
    "Need to finish by noon, have another appointment.",
    "Allergic to certain products — will discuss on arrival.",
    "Bringing my child along, hope that's okay.",
    "Want the same style as last time.",
    "Please use organic/natural products only.",
    "ውድ ስራ ነው! ደስ ይለኛል (Great work! I'm happy)", // Amharic note edge case
    "Can I pay with mobile money (TeleBirr)?",
    "Emergency booking — really need this today.",
    "",
  ];

  // === COMPLETED bookings (mostly last month, some this month) ===
  // Create ~200 completed bookings spread across businesses and customers
  for (let i = 0; i < 200; i++) {
    const customerIdx = i % customerIds.length;
    const bizIdx = i % businesses.length;
    const day = (i % 28) + 1;
    const month = i < 120 ? "last" : "this";
    const timeIdx = i % startTimes.length;

    bookingDefs.push({
      customerIndex: customerIdx,
      businessIndex: bizIdx,
      serviceFilter: () => true,
      day,
      month,
      startTime: startTimes[timeIdx],
      status: "COMPLETED",
      notes: noteOptions[i % noteOptions.length] || undefined,
    });
  }

  // === CONFIRMED bookings (this month and next month) ===
  for (let i = 0; i < 80; i++) {
    const customerIdx = (i + 30) % customerIds.length;
    const bizIdx = (i + 5) % businesses.length;
    const day = (i % 28) + 1;
    const month = i < 40 ? "this" : "next";
    const timeIdx = (i + 3) % startTimes.length;

    bookingDefs.push({
      customerIndex: customerIdx,
      businessIndex: bizIdx,
      serviceFilter: () => true,
      day,
      month,
      startTime: startTimes[timeIdx],
      status: "CONFIRMED",
      notes: noteOptions[(i + 5) % noteOptions.length] || undefined,
    });
  }

  // === PENDING bookings (this month and next month) ===
  for (let i = 0; i < 60; i++) {
    const customerIdx = (i + 50) % customerIds.length;
    const bizIdx = (i + 10) % businesses.length;
    const day = (i % 28) + 1;
    const month = i < 20 ? "this" : "next";
    const timeIdx = (i + 7) % startTimes.length;

    bookingDefs.push({
      customerIndex: customerIdx,
      businessIndex: bizIdx,
      serviceFilter: () => true,
      day,
      month,
      startTime: startTimes[timeIdx],
      status: "PENDING",
      notes: noteOptions[(i + 8) % noteOptions.length] || undefined,
    });
  }

  // === CANCELLED bookings (spread across all months) ===
  for (let i = 0; i < 50; i++) {
    const customerIdx = (i + 70) % customerIds.length;
    const bizIdx = (i + 15) % businesses.length;
    const day = (i % 28) + 1;
    const month: "last" | "this" | "next" =
      i < 20 ? "last" : i < 40 ? "this" : "next";
    const timeIdx = (i + 11) % startTimes.length;

    bookingDefs.push({
      customerIndex: customerIdx,
      businessIndex: bizIdx,
      serviceFilter: () => true,
      day,
      month,
      startTime: startTimes[timeIdx],
      status: "CANCELLED",
      isCancellable: true,
      cancellationFee: i % 3 === 0 ? 100 : 0, // Some have cancellation fees
      notes:
        i % 4 === 0
          ? "Had an emergency, sorry for cancelling."
          : i % 4 === 1
            ? "Schedule conflict — will rebook soon."
            : undefined,
    });
  }

  // === NO_SHOW bookings (mostly last month) ===
  for (let i = 0; i < 30; i++) {
    const customerIdx = (i + 90) % customerIds.length;
    const bizIdx = (i + 20) % businesses.length;
    const day = (i % 28) + 1;
    const timeIdx = (i + 13) % startTimes.length;

    bookingDefs.push({
      customerIndex: customerIdx,
      businessIndex: bizIdx,
      serviceFilter: () => true,
      day,
      month: "last",
      startTime: startTimes[timeIdx],
      status: "NO_SHOW",
      notes: undefined,
    });
  }

  // === Edge case bookings ===
  // Multiple bookings same customer same business (loyal customer)
  for (let visit = 0; visit < 8; visit++) {
    bookingDefs.push({
      customerIndex: 0,
      businessIndex: 0,
      serviceFilter: () => true,
      day: visit * 3 + 1,
      month: "last",
      startTime: "10:00",
      status: "COMPLETED",
      notes: `Regular visit #${visit + 1}`,
    });
  }

  // Customer booking with non-cancellable flag
  bookingDefs.push({
    customerIndex: 5,
    businessIndex: 2,
    serviceFilter: () => true,
    day: 15,
    month: "next",
    startTime: "14:00",
    status: "CONFIRMED",
    isCancellable: false,
    notes: "Non-cancellable promotional booking.",
  });

  // Very early morning booking
  bookingDefs.push({
    customerIndex: 10,
    businessIndex: 5,
    serviceFilter: () => true,
    day: 10,
    month: "this",
    startTime: "07:00",
    status: "CONFIRMED",
    notes: "Early bird appointment.",
  });

  // Late evening booking
  bookingDefs.push({
    customerIndex: 15,
    businessIndex: 3,
    serviceFilter: () => true,
    day: 18,
    month: "this",
    startTime: "19:00",
    status: "PENDING",
    notes: "Can you stay open a bit late for me?",
  });

  // Now create all bookings
  const seededBookings: SeededBooking[] = [];

  for (const def of bookingDefs) {
    const service = getServiceForBusiness(def.businessIndex, def.serviceFilter);
    if (!service) continue;

    const date = getDate(def.month, def.day);
    const endTime = addMinutesToTime(def.startTime, service.duration);

    // Calculate cancellation deadline (24 hours before booking)
    const cancellationDeadline = new Date(date);
    cancellationDeadline.setDate(cancellationDeadline.getDate() - 1);

    try {
      const booking = await prisma.booking.create({
        data: {
          customerId: customerIds[def.customerIndex],
          businessId: businesses[def.businessIndex].id,
          serviceId: service.id,
          date,
          startTime: def.startTime,
          endTime,
          status: def.status,
          totalPrice: service.price,
          notes: def.notes,
          isCancellable:
            def.isCancellable !== undefined ? def.isCancellable : true,
          cancellationDeadline:
            def.status !== "COMPLETED" ? cancellationDeadline : null,
          cancellationFee: def.cancellationFee || 0,
        },
      });

      seededBookings.push({
        id: booking.id,
        customerId: booking.customerId,
        businessId: booking.businessId,
        serviceId: booking.serviceId,
        status: booking.status as BookingStatus,
        totalPrice: Number(booking.totalPrice),
        date: booking.date,
      });
    } catch {
      // Skip duplicate/conflict bookings silently
    }
  }

  console.log(`✅ Created ${seededBookings.length} bookings.\n`);
  return seededBookings;
}
