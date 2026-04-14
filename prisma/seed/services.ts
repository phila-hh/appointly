/**
 * @file Seed services — 5-10 services per business (prices in ETB)
 */

import { getPrisma } from "./helpers";
import type { SeededBusiness } from "./businesses";
import type { BusinessCategory } from "@/generated/prisma/client";

export interface SeededService {
  id: string;
  businessId: string;
  name: string;
  price: number;
  duration: number;
  isActive: boolean;
}

interface ServiceDef {
  name: string;
  description: string;
  price: number;
  duration: number;
  isActive?: boolean;
}

function getServicesForCategory(category: BusinessCategory): ServiceDef[] {
  const catalog: Record<BusinessCategory, ServiceDef[]> = {
    BARBERSHOP: [
      {
        name: "Classic Haircut",
        description:
          "Traditional haircut with scissors and clippers. Includes wash, cut, and style.",
        price: 350,
        duration: 30,
      },
      {
        name: "Fade Haircut",
        description:
          "Precision fade with seamless blending. Low, mid, or high fade options.",
        price: 450,
        duration: 45,
      },
      {
        name: "Beard Trim & Shape",
        description:
          "Professional beard trimming, shaping, and conditioning with hot towel.",
        price: 200,
        duration: 20,
      },
      {
        name: "Haircut + Beard Combo",
        description:
          "Full haircut plus beard trim and shape. Our most popular package.",
        price: 550,
        duration: 60,
      },
      {
        name: "Hot Towel Shave",
        description:
          "Luxurious straight razor shave with hot towel and aftershave balm.",
        price: 300,
        duration: 30,
      },
      {
        name: "Kids Haircut",
        description:
          "Haircut for children under 12. Patient, gentle service in a fun atmosphere.",
        price: 200,
        duration: 25,
      },
      {
        name: "Hair Wash & Style",
        description: "Shampoo, conditioning treatment, and blow-dry styling.",
        price: 250,
        duration: 30,
      },
      {
        name: "Hair Coloring",
        description:
          "Professional hair coloring with premium products. Consultation included.",
        price: 800,
        duration: 60,
        isActive: false,
      },
    ],
    SALON: [
      {
        name: "Ethiopian Braiding",
        description:
          "Traditional Ethiopian cornrow braiding patterns. Multiple styles available.",
        price: 1500,
        duration: 120,
      },
      {
        name: "Hair Relaxer Treatment",
        description:
          "Chemical straightening treatment with deep conditioning follow-up.",
        price: 1200,
        duration: 90,
      },
      {
        name: "Keratin Treatment",
        description:
          "Smooth, frizz-free hair for up to 3 months. Uses premium keratin formula.",
        price: 3500,
        duration: 150,
      },
      {
        name: "Manicure",
        description:
          "Nail shaping, cuticle care, hand massage, and polish application.",
        price: 400,
        duration: 30,
      },
      {
        name: "Pedicure",
        description: "Foot soak, exfoliation, nail care, massage, and polish.",
        price: 500,
        duration: 45,
      },
      {
        name: "Bridal Makeup Package",
        description:
          "Full bridal makeup with trial session, day-of application, and touch-up kit.",
        price: 5000,
        duration: 180,
      },
      {
        name: "Eyebrow Threading",
        description: "Precise eyebrow shaping using the threading technique.",
        price: 150,
        duration: 15,
      },
      {
        name: "Gel Nail Extensions",
        description: "Full set of gel nail extensions with design options.",
        price: 1200,
        duration: 75,
      },
      {
        name: "Lash Extensions",
        description:
          "Individual lash extensions for a natural or dramatic look.",
        price: 2000,
        duration: 90,
      },
    ],
    SPA: [
      {
        name: "Swedish Massage",
        description: "Full-body relaxation massage with long, flowing strokes.",
        price: 2000,
        duration: 60,
      },
      {
        name: "Deep Tissue Massage",
        description:
          "Intensive massage targeting deep muscle layers. Ideal for chronic pain.",
        price: 2500,
        duration: 60,
      },
      {
        name: "Express Facial",
        description:
          "Quick revitalizing facial with cleanse, exfoliation, and hydrating mask.",
        price: 1200,
        duration: 30,
      },
      {
        name: "Luxury Facial",
        description:
          "Premium facial with deep cleansing, anti-aging serum, and collagen mask.",
        price: 3500,
        duration: 75,
      },
      {
        name: "Hot Stone Massage",
        description:
          "Therapeutic massage using heated basalt stones for deep relaxation.",
        price: 2800,
        duration: 90,
      },
      {
        name: "Ethiopian Coffee Scrub",
        description:
          "Signature body scrub using locally sourced Ethiopian coffee grounds.",
        price: 1800,
        duration: 45,
      },
      {
        name: "Couples Massage",
        description:
          "Side-by-side relaxation massage for two in our couples suite.",
        price: 4500,
        duration: 60,
      },
      {
        name: "Aromatherapy Session",
        description:
          "Essential oil-infused massage tailored to your wellness needs.",
        price: 2200,
        duration: 60,
      },
      {
        name: "Body Wrap Treatment",
        description:
          "Detoxifying body wrap with herbal infusions and moisturizing follow-up.",
        price: 2000,
        duration: 60,
        isActive: false,
      },
    ],
    FITNESS: [
      {
        name: "Personal Training Session",
        description:
          "One-on-one training with certified personal trainer. Custom workout plan.",
        price: 1500,
        duration: 60,
      },
      {
        name: "Group Fitness Class",
        description:
          "High-energy group workout. Options include HIIT, aerobics, and dance fitness.",
        price: 300,
        duration: 45,
      },
      {
        name: "Yoga Class",
        description:
          "Guided yoga session suitable for all levels. Mats provided.",
        price: 400,
        duration: 60,
      },
      {
        name: "CrossFit WOD",
        description:
          "Workout of the Day led by certified CrossFit coach. All equipment provided.",
        price: 500,
        duration: 60,
      },
      {
        name: "Body Assessment",
        description:
          "Comprehensive fitness assessment including BMI, body fat %, and strength tests.",
        price: 800,
        duration: 45,
      },
      {
        name: "Monthly Membership",
        description:
          "Unlimited gym access for one month. Includes locker and shower facilities.",
        price: 3000,
        duration: 30,
      },
      {
        name: "Nutrition Consultation",
        description: "Personalized meal plan and nutrition coaching session.",
        price: 1200,
        duration: 45,
      },
    ],
    DENTAL: [
      {
        name: "Dental Cleaning",
        description:
          "Professional teeth cleaning, polishing, and fluoride treatment.",
        price: 800,
        duration: 30,
      },
      {
        name: "Dental Filling",
        description:
          "Tooth-colored composite filling for cavities. Pain-free with local anesthesia.",
        price: 1500,
        duration: 45,
      },
      {
        name: "Root Canal Treatment",
        description:
          "Endodontic treatment to save an infected tooth. Multi-visit procedure.",
        price: 5000,
        duration: 90,
      },
      {
        name: "Teeth Whitening",
        description:
          "In-office professional teeth whitening. Visible results in one session.",
        price: 3500,
        duration: 60,
      },
      {
        name: "Dental X-Ray",
        description:
          "Digital panoramic or periapical X-ray for diagnostic purposes.",
        price: 500,
        duration: 15,
      },
      {
        name: "Tooth Extraction",
        description:
          "Simple or surgical tooth extraction under local anesthesia.",
        price: 2000,
        duration: 30,
      },
      {
        name: "Orthodontic Consultation",
        description:
          "Braces or aligner consultation with treatment plan and cost estimate.",
        price: 1000,
        duration: 45,
      },
      {
        name: "Dental Implant Consultation",
        description: "Assessment for dental implant eligibility with 3D scan.",
        price: 1500,
        duration: 60,
      },
    ],
    MEDICAL: [
      {
        name: "General Consultation",
        description:
          "Doctor consultation for general health concerns. Includes basic examination.",
        price: 500,
        duration: 30,
      },
      {
        name: "Pediatric Check-up",
        description:
          "Wellness check for children. Growth assessment, vaccination review.",
        price: 600,
        duration: 30,
      },
      {
        name: "Blood Test Package",
        description:
          "Complete blood count, liver function, kidney function, and blood sugar.",
        price: 1500,
        duration: 15,
      },
      {
        name: "Vaccination",
        description:
          "Adult or child vaccination. Includes consultation and administration.",
        price: 800,
        duration: 15,
      },
      {
        name: "ECG / Heart Check",
        description:
          "Electrocardiogram screening with cardiologist interpretation.",
        price: 1200,
        duration: 30,
      },
      {
        name: "Ultrasound Scan",
        description:
          "Diagnostic ultrasound for abdominal, pelvic, or obstetric purposes.",
        price: 2000,
        duration: 30,
      },
      {
        name: "Dermatology Consultation",
        description:
          "Skin condition assessment and treatment plan. Biopsy if needed.",
        price: 700,
        duration: 30,
      },
    ],
    TUTORING: [
      {
        name: "Mathematics Tutoring (1hr)",
        description:
          "One-on-one math tutoring for grade 9-12. Covers algebra, geometry, calculus.",
        price: 500,
        duration: 60,
      },
      {
        name: "Physics Tutoring (1hr)",
        description:
          "Physics tutoring covering mechanics, thermodynamics, and electromagnetism.",
        price: 500,
        duration: 60,
      },
      {
        name: "Chemistry Tutoring (1hr)",
        description:
          "Chemistry tutoring for organic, inorganic, and physical chemistry.",
        price: 500,
        duration: 60,
      },
      {
        name: "English Language (1hr)",
        description:
          "English tutoring for grammar, writing, reading comprehension, and speaking.",
        price: 400,
        duration: 60,
      },
      {
        name: "University Entrance Prep (2hr)",
        description:
          "Intensive preparation session for Ethiopian university entrance exams.",
        price: 800,
        duration: 120,
      },
      {
        name: "Coding Basics (1hr)",
        description:
          "Introduction to programming with Python. Project-based learning for beginners.",
        price: 600,
        duration: 60,
      },
      {
        name: "SAT/ACT Prep Session",
        description:
          "Targeted test prep for students applying to international universities.",
        price: 1000,
        duration: 90,
      },
    ],
    CONSULTING: [
      {
        name: "Business Strategy Session",
        description:
          "One-on-one strategy consultation covering market analysis and growth planning.",
        price: 5000,
        duration: 90,
      },
      {
        name: "Legal Document Review",
        description:
          "Review and annotation of contracts, agreements, or legal filings.",
        price: 3000,
        duration: 60,
      },
      {
        name: "Tax Advisory Session",
        description:
          "Ethiopian tax law consultation. VAT, income tax, and compliance planning.",
        price: 2500,
        duration: 60,
      },
      {
        name: "IT Infrastructure Audit",
        description:
          "Assessment of current IT systems with security and efficiency recommendations.",
        price: 8000,
        duration: 120,
      },
      {
        name: "HR Policy Consultation",
        description:
          "Development or review of HR policies, employment contracts, and handbooks.",
        price: 4000,
        duration: 90,
      },
      {
        name: "Startup Mentoring Session",
        description:
          "Guidance for early-stage startups on product-market fit, fundraising, and scaling.",
        price: 3000,
        duration: 60,
      },
    ],
    PHOTOGRAPHY: [
      {
        name: "Portrait Session",
        description:
          "Studio or outdoor portrait photography. 10 edited digital photos included.",
        price: 2500,
        duration: 60,
      },
      {
        name: "Wedding Photography Package",
        description:
          "Full-day wedding coverage. 200+ edited photos, online gallery, and USB.",
        price: 25000,
        duration: 480,
      },
      {
        name: "Event Coverage (Half Day)",
        description:
          "4-hour professional event photography. Corporate events, birthdays, etc.",
        price: 8000,
        duration: 240,
      },
      {
        name: "Product Photography (Per Item)",
        description:
          "Professional product photos on white background. E-commerce ready.",
        price: 500,
        duration: 30,
      },
      {
        name: "Passport/ID Photos",
        description:
          "Standard passport and ID photos. Printed and digital copies.",
        price: 200,
        duration: 15,
      },
      {
        name: "Family Photo Session",
        description:
          "Outdoor or studio family portraits. Up to 6 family members.",
        price: 3500,
        duration: 90,
      },
      {
        name: "Drone Photography",
        description:
          "Aerial photography and videography for events, real estate, or landscapes.",
        price: 5000,
        duration: 60,
      },
    ],
    AUTOMOTIVE: [
      {
        name: "Oil Change",
        description:
          "Engine oil and filter replacement. Synthetic and conventional options.",
        price: 1500,
        duration: 30,
      },
      {
        name: "Brake Inspection & Service",
        description:
          "Brake pad inspection, replacement, and brake fluid check.",
        price: 2500,
        duration: 60,
      },
      {
        name: "Engine Diagnostics",
        description:
          "Computer-aided engine diagnostics with OBD scanner. Fault code reading.",
        price: 800,
        duration: 45,
      },
      {
        name: "Tire Rotation & Balance",
        description: "Four-tire rotation and wheel balancing for even wear.",
        price: 1000,
        duration: 45,
      },
      {
        name: "AC Service & Recharge",
        description:
          "Air conditioning system check, gas recharge, and filter replacement.",
        price: 2000,
        duration: 60,
      },
      {
        name: "Full Vehicle Inspection",
        description:
          "Comprehensive 50-point vehicle inspection with detailed report.",
        price: 1500,
        duration: 90,
      },
      {
        name: "Car Wash & Detailing",
        description:
          "Interior and exterior deep cleaning. Waxing and polishing included.",
        price: 800,
        duration: 60,
      },
      {
        name: "Battery Replacement",
        description:
          "Battery testing and replacement. Includes new battery and installation.",
        price: 3000,
        duration: 30,
        isActive: false,
      },
    ],
    HOME_SERVICES: [
      {
        name: "Standard Home Cleaning",
        description:
          "Complete cleaning of a standard 2-bedroom apartment. Kitchen, bath, floors.",
        price: 1500,
        duration: 120,
      },
      {
        name: "Deep Cleaning",
        description:
          "Intensive deep clean including windows, appliances, and hard-to-reach areas.",
        price: 3000,
        duration: 240,
      },
      {
        name: "Plumbing Repair",
        description:
          "Pipe repair, leak fixing, faucet installation, and drain unclogging.",
        price: 1000,
        duration: 60,
      },
      {
        name: "Electrical Repair",
        description:
          "Socket installation, wiring repair, light fixture mounting, and troubleshooting.",
        price: 1200,
        duration: 60,
      },
      {
        name: "Painting (Per Room)",
        description:
          "Interior wall painting for one room. Paint and supplies included.",
        price: 2500,
        duration: 180,
      },
      {
        name: "Furniture Assembly",
        description: "Assembly of flat-pack furniture. Price per item.",
        price: 500,
        duration: 60,
      },
      {
        name: "Pest Control",
        description:
          "Treatment for cockroaches, bed bugs, or termites. Safe, effective chemicals.",
        price: 2000,
        duration: 90,
      },
    ],
    PET_SERVICES: [
      {
        name: "Pet Grooming - Small Dog",
        description:
          "Bath, haircut, nail trim, and ear cleaning for small breeds.",
        price: 800,
        duration: 60,
      },
      {
        name: "Pet Grooming - Large Dog",
        description:
          "Full grooming service for large breeds. Includes de-shedding treatment.",
        price: 1200,
        duration: 90,
      },
      {
        name: "Veterinary Check-up",
        description:
          "General health examination, weight check, and vaccination review.",
        price: 1000,
        duration: 30,
      },
      {
        name: "Pet Vaccination",
        description:
          "Core vaccinations for dogs and cats. Includes health certificate.",
        price: 600,
        duration: 15,
      },
      {
        name: "Pet Boarding (Per Day)",
        description:
          "Overnight boarding in a clean, supervised facility. Meals included.",
        price: 500,
        duration: 1440,
      },
      {
        name: "Pet Dental Cleaning",
        description:
          "Professional dental scaling and polishing under sedation.",
        price: 2500,
        duration: 60,
      },
    ],
    OTHER: [
      {
        name: "Event Planning Consultation",
        description:
          "Initial meeting to discuss event vision, budget, and timeline.",
        price: 1000,
        duration: 60,
      },
      {
        name: "Wedding Planning Package",
        description:
          "Full wedding planning service from engagement to reception.",
        price: 30000,
        duration: 120,
      },
      {
        name: "Custom Habesha Kemis",
        description:
          "Traditional Ethiopian dress tailored to your measurements and design choice.",
        price: 8000,
        duration: 60,
      },
      {
        name: "Business Card Printing (100)",
        description: "100 premium business cards. Design assistance included.",
        price: 500,
        duration: 30,
      },
      {
        name: "Banner Printing",
        description:
          "Large format banner printing on vinyl or fabric. Custom sizes.",
        price: 1500,
        duration: 30,
      },
      {
        name: "Corporate Event Coordination",
        description:
          "End-to-end coordination of corporate events. Venue, catering, AV setup.",
        price: 15000,
        duration: 90,
      },
    ],
  };

  return catalog[category] || catalog.OTHER;
}

export async function seedServices(
  businesses: SeededBusiness[]
): Promise<SeededService[]> {
  const prisma = getPrisma();
  console.log("💈 Creating services...");

  const allServices: SeededService[] = [];

  for (const biz of businesses) {
    const defs = getServicesForCategory(biz.category);
    for (const def of defs) {
      const svc = await prisma.service.create({
        data: {
          businessId: biz.id,
          name: def.name,
          description: def.description,
          price: def.price,
          duration: def.duration,
          isActive: def.isActive !== undefined ? def.isActive : true,
        },
      });
      allServices.push({
        id: svc.id,
        businessId: svc.businessId,
        name: svc.name,
        price: Number(svc.price),
        duration: svc.duration,
        isActive: svc.isActive,
      });
    }
  }

  console.log(`✅ Created ${allServices.length} services.\n`);
  return allServices;
}
