/**
 * @file Seed staff members — 2-4 staff per eligible business
 * @description Creates staff members for businesses in categories where
 * multi-provider scheduling makes sense (barbershops, salons, spas, etc.).
 *
 * For each eligible business:
 *   1. Creates 2-4 staff members with Ethiopian names and titles
 *   2. Assigns 2-5 services from the business to each staff member
 *   3. Sets individual working hours (slight variations from business hours)
 *
 * Businesses in consulting, photography, and other categories are skipped
 * as they typically operate as single-provider businesses.
 */

import { getPrisma } from "./helpers";
import type { SeededBusiness } from "./businesses";
import type { DayOfWeek } from "@/generated/prisma/client";

/** Categories that typically have multiple staff members. */
const STAFF_ELIGIBLE_CATEGORIES = [
  "BARBERSHOP",
  "SALON",
  "SPA",
  "FITNESS",
  "DENTAL",
  "MEDICAL",
  "PET_SERVICES",
];

/** Staff templates grouped by business category. */
const STAFF_BY_CATEGORY: Record<
  string,
  Array<{ name: string; title: string; email?: string; phone?: string }>
> = {
  BARBERSHOP: [
    {
      name: "Yonas Tadesse",
      title: "Senior Barber",
      email: "yonas.barber@gmail.com",
      phone: "+251-911-500001",
    },
    {
      name: "Henok Girma",
      title: "Junior Barber",
      email: "henok.barber@gmail.com",
      phone: "+251-911-500002",
    },
    {
      name: "Samuel Demeke",
      title: "Master Barber",
      email: "samuel.barber@gmail.com",
      phone: "+251-911-500003",
    },
  ],
  SALON: [
    {
      name: "Hiwot Alemayehu",
      title: "Lead Stylist",
      email: "hiwot.stylist@gmail.com",
      phone: "+251-911-500004",
    },
    {
      name: "Bethlehem Worku",
      title: "Color Specialist",
      email: "bethlehem.stylist@gmail.com",
      phone: "+251-911-500005",
    },
    {
      name: "Rahel Teferi",
      title: "Braiding Expert",
      email: "rahel.stylist@gmail.com",
      phone: "+251-911-500006",
    },
    {
      name: "Kidist Hailu",
      title: "Junior Stylist",
      email: "kidist.stylist@gmail.com",
      phone: "+251-911-500007",
    },
  ],
  SPA: [
    {
      name: "Eyerusalem Bekele",
      title: "Senior Massage Therapist",
      email: "eyerusalem.spa@gmail.com",
      phone: "+251-922-500008",
    },
    {
      name: "Meseret Gebre",
      title: "Facial Specialist",
      email: "meseret.spa@gmail.com",
      phone: "+251-922-500009",
    },
    {
      name: "Tsion Abate",
      title: "Wellness Therapist",
      email: "tsion.spa@gmail.com",
      phone: "+251-922-500010",
    },
  ],
  FITNESS: [
    {
      name: "Dereje Mulugeta",
      title: "Head Coach",
      email: "dereje.coach@gmail.com",
      phone: "+251-922-500011",
    },
    {
      name: "Fasil Tesfaye",
      title: "Personal Trainer",
      email: "fasil.trainer@gmail.com",
      phone: "+251-922-500012",
    },
    {
      name: "Seble Negash",
      title: "Yoga Instructor",
      email: "seble.yoga@gmail.com",
      phone: "+251-922-500013",
    },
  ],
  DENTAL: [
    {
      name: "Dr. Biniam Assefa",
      title: "Lead Dentist",
      email: "biniam.dental@gmail.com",
      phone: "+251-911-500014",
    },
    {
      name: "Dr. Selam Tadesse",
      title: "Orthodontist",
      email: "selam.dental@gmail.com",
      phone: "+251-911-500015",
    },
  ],
  MEDICAL: [
    {
      name: "Dr. Amanuel Kebede",
      title: "General Practitioner",
      email: "amanuel.doctor@gmail.com",
      phone: "+251-911-500016",
    },
    {
      name: "Dr. Tigist Mengistu",
      title: "Pediatrician",
      email: "tigist.doctor@gmail.com",
      phone: "+251-911-500017",
    },
    {
      name: "Nurse Almaz Desta",
      title: "Senior Nurse",
      email: "almaz.nurse@gmail.com",
      phone: "+251-911-500018",
    },
  ],
  PET_SERVICES: [
    {
      name: "Dawit Getachew",
      title: "Lead Groomer",
      email: "dawit.groomer@gmail.com",
      phone: "+251-911-500019",
    },
    {
      name: "Mekdes Yilma",
      title: "Veterinary Assistant",
      email: "mekdes.vet@gmail.com",
      phone: "+251-911-500020",
    },
  ],
};

/**
 * Ordered days of the week for iteration.
 */
const DAYS: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

/**
 * Adds 30 minutes to a time string in "HH:mm" format.
 */
function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

/**
 * Subtracts minutes from a time string in "HH:mm" format.
 */
function subtractMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = Math.max(0, h * 60 + m - minutes);
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

interface SeededStaff {
  id: string;
  businessId: string;
  name: string;
}

interface SeededService {
  id: string;
  businessId: string;
  name: string;
}

export async function seedStaff(
  businesses: SeededBusiness[],
  services: SeededService[]
): Promise<SeededStaff[]> {
  const prisma = getPrisma();
  console.log("👥 Creating staff members...");

  const allStaff: SeededStaff[] = [];
  let staffServiceCount = 0;
  let staffHoursCount = 0;

  for (const business of businesses) {
    // Skip categories that don't typically have multiple staff
    if (!STAFF_ELIGIBLE_CATEGORIES.includes(business.category)) continue;

    // Get staff templates for this category
    const templates = STAFF_BY_CATEGORY[business.category];
    if (!templates) continue;

    // Get services for this business
    const businessServices = services.filter(
      (s) => s.businessId === business.id
    );
    if (businessServices.length === 0) continue;

    // Get business hours for cross-referencing
    const businessHours = await prisma.businessHours.findMany({
      where: { businessId: business.id },
    });

    // Create 2-3 staff per business (use first N templates)
    const staffCount = Math.min(templates.length, 2 + (allStaff.length % 2));

    for (let i = 0; i < staffCount; i++) {
      const template = templates[i];

      // Create staff member
      const staff = await prisma.staff.create({
        data: {
          businessId: business.id,
          name: template.name,
          email: template.email || null,
          phone: template.phone || null,
          title: template.title,
          isActive: true,
        },
      });

      allStaff.push({
        id: staff.id,
        businessId: business.id,
        name: staff.name,
      });

      // Assign services — each staff gets 2-5 random services
      const serviceCount = Math.min(businessServices.length, 2 + (i % 4));
      const shuffledServices = [...businessServices].sort(
        () => Math.random() - 0.5
      );
      const assignedServices = shuffledServices.slice(0, serviceCount);

      for (const service of assignedServices) {
        await prisma.staffService.create({
          data: {
            staffId: staff.id,
            serviceId: service.id,
          },
        });
        staffServiceCount++;
      }

      // Set staff hours — slightly varied from business hours
      for (const day of DAYS) {
        const bizHours = businessHours.find((h) => h.dayOfWeek === day);

        if (!bizHours || bizHours.isClosed) {
          // Business is closed — staff is off
          await prisma.staffHours.create({
            data: {
              staffId: staff.id,
              dayOfWeek: day,
              openTime: "00:00",
              closeTime: "00:00",
              isClosed: true,
            },
          });
        } else {
          // Variation: first staff starts on time, second starts 30min later,
          // third ends 30min earlier, etc.
          let openTime = bizHours.openTime;
          let closeTime = bizHours.closeTime;

          if (i === 1) {
            // Second staff starts 30 min later
            openTime = addMinutes(bizHours.openTime, 30);
          } else if (i === 2) {
            // Third staff ends 30 min earlier
            closeTime = subtractMinutes(bizHours.closeTime, 30);
          }

          await prisma.staffHours.create({
            data: {
              staffId: staff.id,
              dayOfWeek: day,
              openTime,
              closeTime,
              isClosed: false,
            },
          });
        }
        staffHoursCount++;
      }
    }
  }

  console.log(`✅ Created ${allStaff.length} staff members.`);
  console.log(`   ├─ ${staffServiceCount} service assignments`);
  console.log(`   └─ ${staffHoursCount} schedule entries\n`);

  return allStaff;
}
