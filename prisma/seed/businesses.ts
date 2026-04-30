/**
 * @file Seed businesses — Tigray-localized.
 * Updated: adds `announcement` and `announcementExpiresAt` fields.
 *
 * Index 0,1,2 are DEMO businesses (owned by demoOwners[0,1,2]):
 *   0 → Habesha Cuts Barbershop  (BARBERSHOP) — Mekelle
 *   1 → Axum Wellness Spa        (SPA)         — Mekelle
 *   2 → Tigray Fitness Hub       (FITNESS)     — Mekelle
 */

import { getPrisma, slugify, d } from "./helpers";
import type { SeededUsers } from "./users";
import { BusinessCategory } from "@/generated/prisma/client";

export interface SeededBusiness {
  id: string;
  name: string;
  slug: string;
  category: string;
  ownerId: string;
  isDemo: boolean;
}

export async function seedBusinesses(
  users: SeededUsers
): Promise<SeededBusiness[]> {
  const prisma = getPrisma();
  console.log("🏪 Creating businesses...");

  type BizDef = {
    name: string;
    category: string;
    description: string;
    phone: string;
    email: string;
    website: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    isActive?: boolean;
    announcement?: string;
    announcementExpiresAt?: Date;
  };

  const S = "Tigray";

  // Future dates for announcements
  const future30 = d(2026, 7, 30);
  const future60 = d(2026, 8, 30);
  const future14 = d(2026, 7, 14);
  const future7 = d(2026, 7, 7);
  const past = d(2026, 6, 1); // expired announcement edge case

  const allDefs: BizDef[] = [
    // ── DEMO 0: Habesha Cuts Barbershop ───────────────────────────────────
    {
      name: "Habesha Cuts Barbershop",
      category: "BARBERSHOP",
      description:
        "Mekelle's premier barbershop near Hawelti. Expert barbers delivering precision fades, beard grooming, hot towel shaves, and classic cuts. Walk-ins welcome, appointments preferred. Serving the community since 2018.",
      phone: "+251-914-500001",
      email: "info@habeshcuts.example.com",
      website: "https://habeshcuts.example.com",
      address: "Hawelti, near Yohannes IV Statue",
      city: "Mekelle",
      state: S,
      zipCode: "7100",
      announcement:
        "🎉 Grand Summer Sale! Get 20% off all services every Tuesday and Wednesday throughout July. Book now to secure your spot!",
      announcementExpiresAt: future30,
    },
    // ── DEMO 1: Axum Wellness Spa ─────────────────────────────────────────
    {
      name: "Axum Wellness Spa",
      category: "SPA",
      description:
        "A full-service wellness spa in Adi Haki, Mekelle. Swedish massage, deep tissue therapy, luxury facials, Ethiopian coffee scrubs, and couples packages by certified therapists in a tranquil setting.",
      phone: "+251-914-500002",
      email: "hello@axumwellness.example.com",
      website: "https://axumwellness.example.com",
      address: "Adi Haki, Axum Hotel Building, Ground Floor",
      city: "Mekelle",
      state: S,
      zipCode: "7100",
      announcement:
        "✨ New treatment alert! Our signature Ethiopian Honey & Rose body wrap is now available. Limited slots — book yours today before they fill up!",
      announcementExpiresAt: future60,
    },
    // ── DEMO 2: Tigray Fitness Hub ────────────────────────────────────────
    {
      name: "Tigray Fitness Hub",
      category: "FITNESS",
      description:
        "Modern gym and wellness center in Kedamay Weyane, Mekelle. Personal training, CrossFit, yoga, group fitness, nutrition consultations, and body assessments. State-of-the-art equipment, certified coaches.",
      phone: "+251-914-500003",
      email: "contact@tigrayfitness.example.com",
      website: "https://tigrayfitness.example.com",
      address: "Kedamay Weyane, near Ayder Hospital",
      city: "Mekelle",
      state: S,
      zipCode: "7100",
      announcement:
        "💪 Ramadan hours in effect. We open at 16:00 and close at 23:00 throughout the holy month. Free nutrition consultation with every new membership!",
      announcementExpiresAt: future14,
    },

    // ── Regular businesses (52, indexes 3–54) ─────────────────────────────
    // BARBERSHOP
    {
      name: "Adwa Mens Grooming",
      category: "BARBERSHOP",
      description:
        "Traditional barbershop in the heart of Adwa. Classic cuts, modern styles, and professional grooming for the distinguished gentleman of Adwa.",
      phone: "+251-914-500004",
      email: "adwa.grooming@gmail.com",
      website: "https://adwagrooming.example.com",
      address: "Main Road, near Adwa Market",
      city: "Adwa",
      state: S,
      zipCode: "7200",
      announcement:
        "New walk-in hours! We now accept walk-ins until 20:00 on weekdays.",
      announcementExpiresAt: future7,
    },
    {
      name: "Kings Barbershop Axum",
      category: "BARBERSHOP",
      description:
        "Axum's finest barbershop. Expert cuts, razor lineups, and beard care in the shadow of the ancient Obelisks. Walk-ins welcome.",
      phone: "+251-914-500005",
      email: "kings.axum@gmail.com",
      website: "https://kingsaxum.example.com",
      address: "Near Axum Obelisk, Tsion Road",
      city: "Axum",
      state: S,
      zipCode: "7210",
    },
    {
      name: "Blade Masters Adigrat",
      category: "BARBERSHOP",
      description:
        "Premium fades and grooming in Adigrat. Consistent quality every visit. Serving students and professionals since 2019.",
      phone: "+251-914-500006",
      email: "blademasters.adigrat@gmail.com",
      website: "https://blademastersadigrat.example.com",
      address: "Near Adigrat University Main Gate",
      city: "Adigrat",
      state: S,
      zipCode: "7400",
    },
    // SALON
    {
      name: "Selam Beauty Salon",
      category: "SALON",
      description:
        "Full-service beauty salon in Mekelle. Tigrinya braiding, keratin treatments, nail art, and bridal packages. Decades of combined experience.",
      phone: "+251-914-500007",
      email: "selam.beauty.mk@gmail.com",
      website: "https://selambeautymk.example.com",
      address: "Kebelle 16, near Romanat Square",
      city: "Mekelle",
      state: S,
      zipCode: "7100",
      announcement:
        "Bridal season special! Book your full bridal package before the end of the month and get a complimentary eyebrow threading session.",
      announcementExpiresAt: future30,
    },
    {
      name: "Genet Hair Studio",
      category: "SALON",
      description:
        "Modern hair studio near Ayder. Natural hair care, coloring, and styling with premium products imported and locally sourced.",
      phone: "+251-914-500008",
      email: "genet.studio.mk@gmail.com",
      website: "https://genetstudiomk.example.com",
      address: "Ayder Subcity, behind CBE branch",
      city: "Mekelle",
      state: S,
      zipCode: "7100",
    },
    {
      name: "Queen Sheba Salon Axum",
      category: "SALON",
      description:
        "Royal treatment salon in Axum. Traditional and modern hairstyles, skincare, and bridal services. Inspired by the legendary Queen of Sheba.",
      phone: "+251-914-500009",
      email: "queensheba.salon@gmail.com",
      website: "https://queenshebasalon.example.com",
      address: "Tsion Mariam Road, near Sabean Hotel",
      city: "Axum",
      state: S,
      zipCode: "7210",
    },
    {
      name: "Lalibela Beauty Center",
      category: "SALON",
      description:
        "Hair, nail, and makeup services in a luxurious Wukro setting. Bridal packages with advance booking. Serving all of eastern Tigray.",
      phone: "+251-914-500010",
      email: "lalibela.beauty.wk@gmail.com",
      website: "https://lalibelabeautywk.example.com",
      address: "Main Road, near Wukro Hotel",
      city: "Wukro",
      state: S,
      zipCode: "7300",
    },
    // SPA
    {
      name: "Yeha Retreat Spa",
      category: "SPA",
      description:
        "Luxury spa inspired by the ancient Yeha temple. Hot springs therapy, aromatherapy, and signature Ethiopian coffee scrubs in Mekelle.",
      phone: "+251-914-500011",
      email: "yeha.spa@gmail.com",
      website: "https://yehaspa.example.com",
      address: "Semien Sub-City, near Planet Hotel",
      city: "Mekelle",
      state: S,
      zipCode: "7100",
      announcement:
        "Weekday serenity deal: Book any 60-minute massage Monday–Thursday and receive a complimentary express facial. Valid this month only.",
      announcementExpiresAt: future30,
    },
    {
      name: "Blue Nile Day Spa Shire",
      category: "SPA",
      description:
        "Shire's premier day spa. Hot stone massage, anti-aging facials, and couples packages in a serene Inda Selassie setting.",
      phone: "+251-914-500012",
      email: "bluenile.shire@gmail.com",
      website: "https://bluenileshire.example.com",
      address: "Main Street, near Shire Hospital",
      city: "Shire",
      state: S,
      zipCode: "7500",
    },
    {
      name: "Debre Damo Wellness Center",
      category: "SPA",
      description:
        "Combining ancient Tigrayan wellness traditions with modern spa techniques. Herbal steam baths, traditional massage, and aromatherapy.",
      phone: "+251-914-500013",
      email: "debredamo.wellness@gmail.com",
      website: "https://debredamowellness.example.com",
      address: "Near Adigrat Bus Terminal",
      city: "Adigrat",
      state: S,
      zipCode: "7400",
    },
    // FITNESS
    {
      name: "Habesha CrossFit Mekelle",
      category: "FITNESS",
      description:
        "CrossFit box in Mekelle for serious athletes and beginners. Certified coaches, Olympic lifting platforms, and a supportive community.",
      phone: "+251-914-500014",
      email: "habesha.crossfit.mk@gmail.com",
      website: "https://habeshacrossfitmk.example.com",
      address: "Quiha Road, near Mekelle University",
      city: "Mekelle",
      state: S,
      zipCode: "7100",
      announcement:
        "New 5:30 AM early-bird CrossFit class starting this Monday! Limited to 12 athletes. Book your spot now before it fills up.",
      announcementExpiresAt: future14,
    },
    {
      name: "Yoga Tigray Studio",
      category: "FITNESS",
      description:
        "Dedicated yoga and meditation studio. Vinyasa, Hatha, Yin, and prenatal yoga. Private sessions and corporate wellness programs available.",
      phone: "+251-914-500015",
      email: "yoga.tigray@gmail.com",
      website: "https://yogatigray.example.com",
      address: "Adi Haki, Tsion Building, 3rd Floor",
      city: "Mekelle",
      state: S,
      zipCode: "7100",
    },
    {
      name: "Adwa Active Life Gym",
      category: "FITNESS",
      description:
        "Full-service gym with cardio, weights, sauna, and group classes. Personal training by appointment. Adwa's fitness destination.",
      phone: "+251-914-500016",
      email: "adwa.activelife@gmail.com",
      website: "https://adwaactivelife.example.com",
      address: "Near Adwa Heroes Monument",
      city: "Adwa",
      state: S,
      zipCode: "7200",
    },
    // DENTAL
    {
      name: "Mekelle Dental Care",
      category: "DENTAL",
      description:
        "Comprehensive dental clinic in Hawelti. Cleanings, fillings, root canals, orthodontics, and cosmetic dentistry. Digital X-rays and modern sterilization.",
      phone: "+251-914-500017",
      email: "mekelle.dental@gmail.com",
      website: "https://mekelledental.example.com",
      address: "Hawelti, near Mekelle Hospital",
      city: "Mekelle",
      state: S,
      zipCode: "7100",
      announcement:
        "Free dental check-up week! Walk in any day this week for a complimentary basic check-up. No appointment needed. Spaces are limited.",
      announcementExpiresAt: future7,
    },
    {
      name: "Bright Smile Dental Axum",
      category: "DENTAL",
      description:
        "Family-friendly dental practice in Axum. Teeth whitening, implants, and emergency dental services available. Gentle care for all ages.",
      phone: "+251-914-500018",
      email: "brightsmile.axum@gmail.com",
      website: "https://brightsmileaxum.example.com",
      address: "Near Axum Airport Road",
      city: "Axum",
      state: S,
      zipCode: "7210",
    },
    {
      name: "Adigrat Dental Center",
      category: "DENTAL",
      description:
        "Leading dental facility in Adigrat. University-affiliated dentists providing affordable quality care from basic cleaning to oral surgery.",
      phone: "+251-914-500019",
      email: "adigrat.dental@gmail.com",
      website: "https://adigratdental.example.com",
      address: "Near Adigrat University Health Center",
      city: "Adigrat",
      state: S,
      zipCode: "7400",
    },
    {
      name: "Wukro Family Dentistry",
      category: "DENTAL",
      description:
        "Warm, welcoming dental practice in Wukro. Preventive care, pediatric dentistry, and cosmetic treatments. Most insurance plans accepted.",
      phone: "+251-914-500020",
      email: "wukro.dentistry@gmail.com",
      website: "https://wukrodentistry.example.com",
      address: "Near Wukro Cherkos Church",
      city: "Wukro",
      state: S,
      zipCode: "7300",
    },
    // MEDICAL
    {
      name: "Ayder Medical Clinic",
      category: "MEDICAL",
      description:
        "General practice clinic near Ayder Hospital. Consultations, lab tests, vaccinations, and chronic disease management. Board-certified physicians.",
      phone: "+251-914-500021",
      email: "ayder.clinic@gmail.com",
      website: "https://aydermedical.example.com",
      address: "Ayder Subcity, near Ayder Referral Hospital",
      city: "Mekelle",
      state: S,
      zipCode: "7100",
    },
    {
      name: "Quiha Health Center",
      category: "MEDICAL",
      description:
        "Multi-specialty center near Quiha. Internal medicine, pediatrics, OB/GYN, dermatology. Online appointment booking available 24/7.",
      phone: "+251-914-500022",
      email: "quiha.health@gmail.com",
      website: "https://quihahealth.example.com",
      address: "Quiha Town, near Quiha Military Base",
      city: "Mekelle",
      state: S,
      zipCode: "7100",
    },
    {
      name: "Adwa Community Clinic",
      category: "MEDICAL",
      description:
        "Community clinic providing primary care, preventive screenings, maternal health, and minor surgical procedures in historic Adwa.",
      phone: "+251-914-500023",
      email: "adwa.clinic@gmail.com",
      website: "https://adwaclinic.example.com",
      address: "Main Square, near Adwa Administration",
      city: "Adwa",
      state: S,
      zipCode: "7200",
    },
    // TUTORING
    {
      name: "Tigray Tutors Academy",
      category: "TUTORING",
      description:
        "Academic tutoring for grade 9-12 students and university entrance exam preparation. Mathematics, Physics, Chemistry, and English.",
      phone: "+251-914-500024",
      email: "tigray.tutors@gmail.com",
      website: "https://tigraytutors.example.com",
      address: "Kedamay Weyane, near Mekelle University",
      city: "Mekelle",
      state: S,
      zipCode: "7100",
      announcement:
        "Summer intensive program now enrolling! 6-week crash course covering all university entrance exam subjects. Register before spots run out.",
      announcementExpiresAt: future30,
    },
    {
      name: "Bright Minds Mekelle",
      category: "TUTORING",
      description:
        "One-on-one and small group tutoring. STEM subjects, SAT/ACT prep, and coding bootcamps for young learners in Tigray's capital.",
      phone: "+251-914-500025",
      email: "brightminds.mk@gmail.com",
      website: "https://brightmindsmk.example.com",
      address: "Romanat Square, Science Building, 2nd Floor",
      city: "Mekelle",
      state: S,
      zipCode: "7100",
    },
    {
      name: "Tigrinya Language School",
      category: "TUTORING",
      description:
        "Language instruction for foreigners and diaspora. Beginner to advanced Tigrinya, Amharic, and English courses. Cultural immersion included.",
      phone: "+251-914-500026",
      email: "tigrinya.school@gmail.com",
      website: "https://tigrinyaschool.example.com",
      address: "Adi Haki, near Alliance Francaise",
      city: "Mekelle",
      state: S,
      zipCode: "7100",
    },
    {
      name: "Axum Study Hub",
      category: "TUTORING",
      description:
        "After-school tutoring and weekend intensive sessions. Qualified teachers from Axum University serving primary and secondary students.",
      phone: "+251-914-500027",
      email: "axum.studyhub@gmail.com",
      website: "https://axumstudyhub.example.com",
      address: "Near Axum University Main Gate",
      city: "Axum",
      state: S,
      zipCode: "7210",
    },
    // CONSULTING
    {
      name: "Tigray Business Consulting",
      category: "CONSULTING",
      description:
        "Management consulting for Tigrayan businesses. Strategy, operations, HR, and digital transformation. Serving startups to established enterprises.",
      phone: "+251-914-500028",
      email: "tigray.consulting@gmail.com",
      website: "https://tigrayconsulting.example.com",
      address: "Hawelti, Dedebit Building, 5th Floor",
      city: "Mekelle",
      state: S,
      zipCode: "7100",
    },
    {
      name: "Mereb Legal Advisors",
      category: "CONSULTING",
      description:
        "Legal consulting specializing in Ethiopian and Tigrayan business law, investment licensing, tax advisory, and contract drafting. Bilingual service.",
      phone: "+251-914-500029",
      email: "mereb.legal@gmail.com",
      website: "https://mereblegal.example.com",
      address: "Kedamay Weyane, near Tigray Courts",
      city: "Mekelle",
      state: S,
      zipCode: "7100",
    },
    {
      name: "TechMekelle IT Consulting",
      category: "CONSULTING",
      description:
        "IT consulting and software development. Cloud migration, cybersecurity, ERP implementation, and mobile app development for Tigrayan businesses.",
      phone: "+251-914-500030",
      email: "techmekelle@gmail.com",
      website: "https://techmekelle.example.com",
      address: "Ayder Subcity, ICT Center",
      city: "Mekelle",
      state: S,
      zipCode: "7100",
      announcement:
        "Free 30-minute IT audit for new clients this month only. Discover security gaps and optimization opportunities at no cost.",
      announcementExpiresAt: future30,
    },
    {
      name: "Green Tigray Consulting",
      category: "CONSULTING",
      description:
        "Environmental and sustainability consulting. EIA studies, green building certification, renewable energy feasibility, and reforestation programs.",
      phone: "+251-914-500031",
      email: "greentigray@gmail.com",
      website: "https://greentigray.example.com",
      address: "Semien Sub-City, Harmony Building, 2nd Floor",
      city: "Mekelle",
      state: S,
      zipCode: "7100",
    },
    // PHOTOGRAPHY
    {
      name: "Mekelle Lens Photography",
      category: "PHOTOGRAPHY",
      description:
        "Professional photography studio for weddings, portraits, corporate events, and product photography. Drone photography available for outdoor events.",
      phone: "+251-914-500032",
      email: "mekellelens@gmail.com",
      website: "https://mekellelens.example.com",
      address: "Romanat Square, Lens Building",
      city: "Mekelle",
      state: S,
      zipCode: "7100",
    },
    {
      name: "Obelisk Studios Axum",
      category: "PHOTOGRAPHY",
      description:
        "Creative photography and videography in Axum. Specializing in cultural celebrations, Ashenda, Meskel, and wedding ceremonies. Full editing suite.",
      phone: "+251-914-500033",
      email: "obelisk.studios@gmail.com",
      website: "https://obeliskstudios.example.com",
      address: "Near Obelisk Park, Sabean Road",
      city: "Axum",
      state: S,
      zipCode: "7210",
      announcement:
        "Ashenda festival packages now available! Special group and individual photo sessions celebrating Tigray's beloved women's festival.",
      announcementExpiresAt: future60,
    },
    {
      name: "Adigrat Photo Studio",
      category: "PHOTOGRAPHY",
      description:
        "Portrait sessions, event coverage, and landscape photography tours around the Gheralta mountains and eastern Tigray.",
      phone: "+251-914-500034",
      email: "adigrat.photo@gmail.com",
      website: "https://adigratphotos.example.com",
      address: "Near Adigrat Cathedral",
      city: "Adigrat",
      state: S,
      zipCode: "7400",
    },
    {
      name: "Adwa Moments Photography",
      category: "PHOTOGRAPHY",
      description:
        "Capturing life's special moments in historic Adwa. Wedding packages, graduation photos, family portraits, and commercial photography.",
      phone: "+251-914-500035",
      email: "adwamoments@gmail.com",
      website: "https://adwamoments.example.com",
      address: "Near Adwa Victory Memorial",
      city: "Adwa",
      state: S,
      zipCode: "7200",
    },
    // AUTOMOTIVE
    {
      name: "Tigray Auto Care",
      category: "AUTOMOTIVE",
      description:
        "Full-service auto repair and maintenance in Mekelle. Oil changes, brake service, engine diagnostics, and tire alignment for all vehicle brands.",
      phone: "+251-914-500036",
      email: "tigray.auto@gmail.com",
      website: "https://tigrayauto.example.com",
      address: "Industrial Zone, near Mesfin Industrial",
      city: "Mekelle",
      state: S,
      zipCode: "7100",
    },
    {
      name: "Hawelti Auto Garage",
      category: "AUTOMOTIVE",
      description:
        "Trusted auto garage in Hawelti for over 15 years. Engine overhaul, electrical systems, AC repair, and bodywork. Competitive pricing.",
      phone: "+251-914-500037",
      email: "hawelti.garage@gmail.com",
      website: "https://haweltigarage.example.com",
      address: "Hawelti, Automotive Row",
      city: "Mekelle",
      state: S,
      zipCode: "7100",
    },
    {
      name: "Wukro Express Auto Service",
      category: "AUTOMOTIVE",
      description:
        "Quick and reliable auto service on the Mekelle-Wukro road. Express oil change, tire service, and roadside assistance. Open 7 days a week.",
      phone: "+251-914-500038",
      email: "wukro.autoexpress@gmail.com",
      website: "https://wukroauto.example.com",
      address: "Mekelle-Wukro Highway, KM 45",
      city: "Wukro",
      state: S,
      zipCode: "7300",
    },
    {
      name: "Shire Motor Works",
      category: "AUTOMOTIVE",
      description:
        "Western Tigray's premier auto workshop. Specializing in Toyota, Isuzu, and Hyundai servicing. Genuine and aftermarket parts available.",
      phone: "+251-914-500039",
      email: "shire.motorworks@gmail.com",
      website: "https://shiremotorworks.example.com",
      address: "Inda Selassie, near Bus Terminal",
      city: "Shire",
      state: S,
      zipCode: "7500",
    },
    // HOME_SERVICES
    {
      name: "Mekelle Clean Home Services",
      category: "HOME_SERVICES",
      description:
        "Professional home cleaning, deep cleaning, post-construction cleanup, and regular maid services. Trained, vetted, and insured cleaning staff.",
      phone: "+251-914-500040",
      email: "mekelleclean@gmail.com",
      website: "https://mekelleclean.example.com",
      address: "Romanat Square, Service Center",
      city: "Mekelle",
      state: S,
      zipCode: "7100",
    },
    {
      name: "Gebriel Plumbing & Electric",
      category: "HOME_SERVICES",
      description:
        "Licensed plumbing and electrical services. Leak repair, pipe installation, wiring, circuit breaker upgrades, and emergency 24/7 call-outs.",
      phone: "+251-914-500041",
      email: "gebriel.services@gmail.com",
      website: "https://gebrielservices.example.com",
      address: "Kedamay Weyane, Woreda 03",
      city: "Mekelle",
      state: S,
      zipCode: "7100",
    },
    {
      name: "Adwa Home Fix",
      category: "HOME_SERVICES",
      description:
        "General home repair and maintenance in Adwa. Painting, carpentry, tiling, waterproofing, and furniture assembly. Free estimates on all jobs.",
      phone: "+251-914-500042",
      email: "adwahomefix@gmail.com",
      website: "https://adwahomefix.example.com",
      address: "Near Adwa Preparatory School",
      city: "Adwa",
      state: S,
      zipCode: "7200",
    },
    {
      name: "Maychew Garden & Landscape",
      category: "HOME_SERVICES",
      description:
        "Garden design, landscaping, lawn care, and tree trimming services in Maychew and surrounding areas. Transform your outdoor space.",
      phone: "+251-914-500043",
      email: "maychew.garden@gmail.com",
      website: "https://maychewgarden.example.com",
      address: "Near Maychew Town Administration",
      city: "Maychew",
      state: S,
      zipCode: "7600",
    },
    // PET_SERVICES
    {
      name: "Mekelle Pet Care Center",
      category: "PET_SERVICES",
      description:
        "Comprehensive pet care: vet check-ups, grooming, boarding, and pet sitting. Specialized care for dogs, cats, and exotic pets in Mekelle.",
      phone: "+251-914-500044",
      email: "mekelle.petcare@gmail.com",
      website: "https://mekellepetcare.example.com",
      address: "Adi Haki, near Tigray Veterinary Lab",
      city: "Mekelle",
      state: S,
      zipCode: "7100",
    },
    {
      name: "Furry Friends Mekelle",
      category: "PET_SERVICES",
      description:
        "Professional pet grooming salon. Bathing, haircuts, nail trimming, ear cleaning, and flea treatments. We treat your pets like family.",
      phone: "+251-914-500045",
      email: "furryfriends.mk@gmail.com",
      website: "https://furryfriendsmk.example.com",
      address: "Semien Sub-City, near Desta Hotel",
      city: "Mekelle",
      state: S,
      zipCode: "7100",
    },
    {
      name: "Axum Vet & Pet Shop",
      category: "PET_SERVICES",
      description:
        "Veterinary clinic and pet supply shop in Axum. Vaccinations, surgery, dental care, and premium pet food. Walk-in and appointment-based.",
      phone: "+251-914-500046",
      email: "axum.vet@gmail.com",
      website: "https://axumvet.example.com",
      address: "Near Axum Market Area",
      city: "Axum",
      state: S,
      zipCode: "7210",
    },
    // OTHER
    {
      name: "Mekelle Events & Planning",
      category: "OTHER",
      description:
        "Full-service event planning for weddings, corporate events, birthdays, and cultural celebrations. Venue selection, catering coordination.",
      phone: "+251-914-500047",
      email: "mekelle.events@gmail.com",
      website: "https://mekelleevents.example.com",
      address: "Hawelti, near Yordanos Hall",
      city: "Mekelle",
      state: S,
      zipCode: "7100",
    },
    {
      name: "Tilet Tailoring Studio",
      category: "OTHER",
      description:
        "Custom traditional Tigrayan clothing. Tilfi dresses, zuria, and modern Tigrayan-inspired fashion. Alterations and bespoke suits also available.",
      phone: "+251-914-500048",
      email: "tilet.tailor@gmail.com",
      website: "https://tilettailor.example.com",
      address: "Romanat, near Medhanialem Church",
      city: "Mekelle",
      state: S,
      zipCode: "7100",
    },
    {
      name: "Semien Printing Press",
      category: "OTHER",
      description:
        "Commercial printing: business cards, brochures, banners, wedding invitations, and large-format printing. Same-day rush orders available.",
      phone: "+251-914-500049",
      email: "semien.print@gmail.com",
      website: "https://semienprint.example.com",
      address: "Kedamay Weyane, Printing District",
      city: "Mekelle",
      state: S,
      zipCode: "7100",
    },
    // Extra
    {
      name: "Enticho Classic Cuts",
      category: "BARBERSHOP",
      description:
        "Established 2019. Quality barbering in the charming town of Enticho. Walk-ins welcome. Serving northern Tigray with pride.",
      phone: "+251-914-500050",
      email: "enticho.cuts@gmail.com",
      website: "https://entichocuts.example.com",
      address: "Main Road, near Enticho Market",
      city: "Enticho",
      state: S,
      zipCode: "7700",
    },
    {
      name: "Edaga Hamus Style House",
      category: "SALON",
      description:
        "Edaga Hamus premier beauty destination. Hair styling, manicures, pedicures, facials. Bridal packages with advance booking.",
      phone: "+251-914-500051",
      email: "edagahamus.style@gmail.com",
      website: "https://edagahamusstyle.example.com",
      address: "Market Area, near Edaga Hamus Bus Station",
      city: "Edaga Hamus",
      state: S,
      zipCode: "7350",
    },
    {
      name: "Hagere Selam Retreat Spa",
      category: "SPA",
      description:
        "Mountain retreat spa with stunning views. Steam rooms, herbal treatments, and traditional Tigrayan healing therapies in peaceful Hagere Selam.",
      phone: "+251-914-500052",
      email: "hagereselam.spa@gmail.com",
      website: "https://hageresalamspa.example.com",
      address: "Hilltop Road, near Hagere Selam Church",
      city: "Hagere Selam",
      state: S,
      zipCode: "7800",
      isActive: false,
      // Expired announcement — edge case for testing
      announcement:
        "We are currently undergoing renovation. Expected to reopen in August 2026. Thank you for your patience!",
      announcementExpiresAt: past,
    },
    {
      name: "Maychew Power Gym",
      category: "FITNESS",
      description:
        "Maychew's largest gym. Bodybuilding, cardio, and group classes. Home of multiple regional championship athletes.",
      phone: "+251-914-500053",
      email: "maychew.powergym@gmail.com",
      website: "https://maychewpowergym.example.com",
      address: "Near Maychew Stadium",
      city: "Maychew",
      state: S,
      zipCode: "7600",
    },
    {
      name: "Abiy Addi General Clinic",
      category: "MEDICAL",
      description:
        "Trusted general clinic serving the Abiy Addi community. Walk-in consultations, routine check-ups, lab services, and pharmacy on-site.",
      phone: "+251-914-500054",
      email: "abiyadddi.clinic@gmail.com",
      website: "https://abiyadddiclinic.example.com",
      address: "Near Abiy Addi Administration",
      city: "Abiy Addi",
      state: S,
      zipCode: "7900",
    },
  ];

  const allOwnerIds = users.allOwners.map((u) => u.id);
  const results: SeededBusiness[] = [];

  for (let i = 0; i < allDefs.length; i++) {
    const def = allDefs[i];
    const b = await prisma.business.create({
      data: {
        ownerId: allOwnerIds[i],
        name: def.name,
        slug: slugify(def.name) + (i > 0 ? `-${i}` : ""),
        description: def.description,
        category: def.category as BusinessCategory,
        phone: def.phone,
        email: def.email,
        website: def.website,
        address: def.address,
        city: def.city,
        state: def.state,
        zipCode: def.zipCode,
        isActive: def.isActive !== undefined ? def.isActive : true,
        announcement: def.announcement ?? null,
        announcementExpiresAt: def.announcementExpiresAt ?? null,
      },
    });
    results.push({
      id: b.id,
      name: b.name,
      slug: b.slug,
      category: b.category,
      ownerId: b.ownerId,
      isDemo: i < 3,
    });
  }

  console.log(
    `✅ Created ${results.length} businesses (3 demo, ${results.length - 3} regular).\n`
  );
  return results;
}
