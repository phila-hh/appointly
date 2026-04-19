/**
 * @file Seed staff members, staff hours, and staff–service mappings.
 *
 * Demo businesses get 5 staff each.
 * Regular businesses get 1-2 staff.
 * Some businesses intentionally have NO staff (single-provider mode).
 */

import { getPrisma } from "./helpers";
import type { SeededBusiness } from "./businesses";
import type { SeededService } from "./services";
import type { DayOfWeek } from "@/generated/prisma/client";

export interface SeededStaff {
  id: string;
  businessId: string;
  name: string;
  isActive: boolean;
}

const WEEKDAYS: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
];
const ALL_DAYS: DayOfWeek[] = [...WEEKDAYS, "SATURDAY", "SUNDAY"];

async function createStaffWithHoursAndServices(
  prisma: ReturnType<typeof getPrisma>,
  data: {
    businessId: string;
    name: string;
    email?: string;
    phone?: string;
    title?: string;
    isActive?: boolean;
    workDays: DayOfWeek[];
    openTime: string;
    closeTime: string;
    serviceIds: string[];
  }
): Promise<SeededStaff> {
  const staff = await prisma.staff.create({
    data: {
      businessId: data.businessId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      title: data.title,
      isActive: data.isActive !== false,
    },
  });

  for (const day of ALL_DAYS) {
    const isWorkDay = data.workDays.includes(day);
    await prisma.staffHours.create({
      data: {
        staffId: staff.id,
        dayOfWeek: day,
        openTime: isWorkDay ? data.openTime : "00:00",
        closeTime: isWorkDay ? data.closeTime : "00:00",
        isClosed: !isWorkDay,
      },
    });
  }

  for (const serviceId of data.serviceIds) {
    await prisma.staffService.create({
      data: { staffId: staff.id, serviceId },
    });
  }

  return {
    id: staff.id,
    businessId: data.businessId,
    name: data.name,
    isActive: staff.isActive,
  };
}

export async function seedStaff(
  businesses: SeededBusiness[],
  services: SeededService[]
): Promise<SeededStaff[]> {
  const prisma = getPrisma();
  console.log("👷 Creating staff members...");

  const svcIds = (bizId: string) =>
    services
      .filter((s) => s.businessId === bizId && s.isActive)
      .map((s) => s.id);

  const allStaff: SeededStaff[] = [];

  // ── DEMO 0: Habesha Cuts Barbershop (5 staff) ───────────────────────────
  const b0 = businesses[0];
  const b0Svcs = svcIds(b0.id);
  const b0Staff = await Promise.all([
    createStaffWithHoursAndServices(prisma, {
      businessId: b0.id,
      name: "Gebrehiwet Tsegay",
      email: "gebrehiwet.hc@gmail.com",
      phone: "+251-914-600001",
      title: "Master Barber",
      workDays: WEEKDAYS,
      openTime: "09:00",
      closeTime: "18:00",
      serviceIds: b0Svcs,
    }),
    createStaffWithHoursAndServices(prisma, {
      businessId: b0.id,
      name: "Hagos Berhe",
      email: "hagos.hc@gmail.com",
      phone: "+251-914-600002",
      title: "Senior Barber",
      workDays: [...WEEKDAYS, "SATURDAY"],
      openTime: "09:00",
      closeTime: "19:00",
      serviceIds: b0Svcs,
    }),
    createStaffWithHoursAndServices(prisma, {
      businessId: b0.id,
      name: "Kidane Abrha",
      email: "kidane.hc@gmail.com",
      phone: "+251-914-600003",
      title: "Junior Barber",
      workDays: [...WEEKDAYS, "SATURDAY"],
      openTime: "10:00",
      closeTime: "19:00",
      serviceIds: b0Svcs.slice(0, 5),
    }),
    createStaffWithHoursAndServices(prisma, {
      businessId: b0.id,
      name: "Tsegay Kahsay",
      email: "tsegay.hc@gmail.com",
      phone: "+251-914-600004",
      title: "Beard Specialist",
      workDays: ["TUESDAY", "THURSDAY", "SATURDAY", "SUNDAY"],
      openTime: "09:00",
      closeTime: "17:00",
      serviceIds: b0Svcs.slice(2, 6),
    }),
    createStaffWithHoursAndServices(prisma, {
      businessId: b0.id,
      name: "Fissehaye Weldu",
      email: "fissehaye.hc@gmail.com",
      phone: "+251-914-600005",
      title: "Junior Barber",
      workDays: WEEKDAYS,
      openTime: "11:00",
      closeTime: "20:00",
      serviceIds: b0Svcs.slice(0, 4),
      isActive: false,
    }),
  ]);
  allStaff.push(...b0Staff);

  // ── DEMO 1: Axum Wellness Spa (5 staff) ─────────────────────────────────
  const b1 = businesses[1];
  const b1Svcs = svcIds(b1.id);
  const b1Staff = await Promise.all([
    createStaffWithHoursAndServices(prisma, {
      businessId: b1.id,
      name: "Letekidan Hailu",
      email: "letekidan.spa@gmail.com",
      phone: "+251-914-600006",
      title: "Lead Therapist",
      workDays: [...WEEKDAYS, "SATURDAY"],
      openTime: "10:00",
      closeTime: "20:00",
      serviceIds: b1Svcs,
    }),
    createStaffWithHoursAndServices(prisma, {
      businessId: b1.id,
      name: "Rigat Gebremariam",
      email: "rigat.spa@gmail.com",
      phone: "+251-914-600007",
      title: "Massage Therapist",
      workDays: [...WEEKDAYS, "SATURDAY"],
      openTime: "10:00",
      closeTime: "20:00",
      serviceIds: b1Svcs.slice(0, 5),
    }),
    createStaffWithHoursAndServices(prisma, {
      businessId: b1.id,
      name: "Sennait Desta",
      email: "sennait.spa@gmail.com",
      phone: "+251-914-600008",
      title: "Facialist & Esthetician",
      workDays: [...WEEKDAYS, "SATURDAY"],
      openTime: "11:00",
      closeTime: "19:00",
      serviceIds: b1Svcs.slice(2, 7),
    }),
    createStaffWithHoursAndServices(prisma, {
      businessId: b1.id,
      name: "Tirhas Abrha",
      email: "tirhas.spa@gmail.com",
      phone: "+251-914-600009",
      title: "Aromatherapist",
      workDays: ["WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"],
      openTime: "10:00",
      closeTime: "18:00",
      serviceIds: b1Svcs.slice(5, 8),
    }),
    createStaffWithHoursAndServices(prisma, {
      businessId: b1.id,
      name: "Almaz Kahsay",
      email: "almaz.spa@gmail.com",
      phone: "+251-914-600010",
      title: "Junior Therapist",
      workDays: WEEKDAYS,
      openTime: "12:00",
      closeTime: "20:00",
      serviceIds: b1Svcs.slice(0, 4),
    }),
  ]);
  allStaff.push(...b1Staff);

  // ── DEMO 2: Tigray Fitness Hub (5 staff) ────────────────────────────────
  const b2 = businesses[2];
  const b2Svcs = svcIds(b2.id);
  const b2Staff = await Promise.all([
    createStaffWithHoursAndServices(prisma, {
      businessId: b2.id,
      name: "Amanuel Tsegay",
      email: "amanuel.gym@gmail.com",
      phone: "+251-914-600011",
      title: "Head Coach & PT",
      workDays: [...WEEKDAYS, "SATURDAY"],
      openTime: "06:00",
      closeTime: "20:00",
      serviceIds: b2Svcs,
    }),
    createStaffWithHoursAndServices(prisma, {
      businessId: b2.id,
      name: "Rahwa Berhe",
      email: "rahwa.gym@gmail.com",
      phone: "+251-914-600012",
      title: "Yoga Instructor",
      workDays: [...WEEKDAYS, "SATURDAY", "SUNDAY"],
      openTime: "07:00",
      closeTime: "15:00",
      serviceIds: b2Svcs.slice(2, 5),
    }),
    createStaffWithHoursAndServices(prisma, {
      businessId: b2.id,
      name: "Goitom Gebrehiwet",
      email: "goitom.gym@gmail.com",
      phone: "+251-914-600013",
      title: "CrossFit Coach",
      workDays: [...WEEKDAYS, "SATURDAY"],
      openTime: "06:00",
      closeTime: "14:00",
      serviceIds: b2Svcs.slice(3, 6),
    }),
    createStaffWithHoursAndServices(prisma, {
      businessId: b2.id,
      name: "Medhin Kahsay",
      email: "medhin.gym@gmail.com",
      phone: "+251-914-600014",
      title: "Nutritionist",
      workDays: ["MONDAY", "WEDNESDAY", "FRIDAY"],
      openTime: "10:00",
      closeTime: "17:00",
      serviceIds: b2Svcs.slice(5, 7),
    }),
    createStaffWithHoursAndServices(prisma, {
      businessId: b2.id,
      name: "Yemane Hailu",
      email: "yemane.gym@gmail.com",
      phone: "+251-914-600015",
      title: "Personal Trainer",
      workDays: [...WEEKDAYS, "SATURDAY"],
      openTime: "08:00",
      closeTime: "18:00",
      serviceIds: b2Svcs.slice(0, 4),
    }),
  ]);
  allStaff.push(...b2Staff);

  // ── Regular businesses — 2 staff for first 20, 1 for next 20, rest none ──
  for (let i = 3; i < businesses.length; i++) {
    const biz = businesses[i];
    const svcs = svcIds(biz.id);
    if (svcs.length === 0) continue;

    if (i < 23) {
      const s1 = await createStaffWithHoursAndServices(prisma, {
        businessId: biz.id,
        name: `Staff A - ${biz.name.split(" ")[0]}`,
        title: "Senior Staff",
        workDays: [...WEEKDAYS, "SATURDAY"],
        openTime: "09:00",
        closeTime: "18:00",
        serviceIds: svcs,
      });
      const s2 = await createStaffWithHoursAndServices(prisma, {
        businessId: biz.id,
        name: `Staff B - ${biz.name.split(" ")[0]}`,
        title: "Junior Staff",
        workDays: WEEKDAYS,
        openTime: "10:00",
        closeTime: "17:00",
        serviceIds: svcs.slice(0, Math.ceil(svcs.length / 2)),
      });
      allStaff.push(s1, s2);
    } else if (i < 43) {
      const s1 = await createStaffWithHoursAndServices(prisma, {
        businessId: biz.id,
        name: `Staff - ${biz.name.split(" ")[0]}`,
        title: "Staff",
        workDays: [...WEEKDAYS, "SATURDAY"],
        openTime: "09:00",
        closeTime: "18:00",
        serviceIds: svcs,
      });
      allStaff.push(s1);
    }
    // businesses 43-54: no staff (single-provider mode)
  }

  console.log(
    `✅ Created ${allStaff.length} staff members with hours and service assignments.\n`
  );
  return allStaff;
}
