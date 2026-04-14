/**
 * @file Seed businesses — 55 businesses across all 13 categories
 * Localized to Ethiopian cities, addresses, and context
 */

import { getPrisma, slugify } from "./helpers";
import type { BusinessCategory } from "@/generated/prisma/client";

export interface SeededBusiness {
  id: string;
  name: string;
  category: BusinessCategory;
  ownerId: string;
}

interface BusinessDef {
  name: string;
  category: BusinessCategory;
  description: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
}

export async function seedBusinesses(
  ownerIds: string[]
): Promise<SeededBusiness[]> {
  const prisma = getPrisma();
  console.log("🏪 Creating businesses...");

  const defs: BusinessDef[] = [
    // BARBERSHOP (5)
    {
      name: "Fresh Cuts Barbershop",
      category: "BARBERSHOP",
      description:
        "Premium barbershop offering classic and modern cuts in Bole. Experienced barbers specializing in fades, beard grooming, and hot towel shaves.",
      phone: "+251-911-300001",
      email: "info@freshcuts.example.com",
      website: "https://freshcuts.example.com",
      address: "Bole Road, Friendship Building, 3rd Floor",
      city: "Addis Ababa",
    },
    {
      name: "Arada Mens Grooming",
      category: "BARBERSHOP",
      description:
        "Traditional Ethiopian barbershop in the heart of Arada. Classic cuts, modern styles, and professional grooming services for the distinguished gentleman.",
      phone: "+251-911-300002",
      email: "arada.grooming@gmail.com",
      website: "https://aradagrooming.example.com",
      address: "Arada Sub-City, Piassa, near Cinema Ethiopia",
      city: "Addis Ababa",
    },
    {
      name: "Kings Barbershop Hawassa",
      category: "BARBERSHOP",
      description:
        "Hawassa's finest barbershop. Expert barbers delivering precision cuts, razor-sharp lineups, and premium beard care in a modern setting by the lake.",
      phone: "+251-911-300003",
      email: "kings.hawassa@gmail.com",
      website: "https://kingsbarbershop.example.com",
      address: "Lake Hawassa Road, near Lewi Resort",
      city: "Hawassa",
    },
    {
      name: "Dire Dawa Classic Cuts",
      category: "BARBERSHOP",
      description:
        "Established in 2015, Dire Dawa Classic Cuts brings big-city barbering quality to the eastern gateway of Ethiopia. Walk-ins always welcome.",
      phone: "+251-911-300004",
      email: "diredawa.cuts@gmail.com",
      website: "https://diredawacuts.example.com",
      address: "Kezira, near Dire Dawa Train Station",
      city: "Dire Dawa",
    },
    {
      name: "Blade Masters Bahir Dar",
      category: "BARBERSHOP",
      description:
        "Blade Masters offers the best fades and grooming in Bahir Dar. Located steps from the Blue Nile, our skilled barbers deliver consistent quality.",
      phone: "+251-911-300005",
      email: "blademasters.bd@gmail.com",
      website: "https://blademasters.example.com",
      address: "Kebele 14, near Blue Nile Bridge",
      city: "Bahir Dar",
    },

    // SALON (5)
    {
      name: "Selam Beauty Salon",
      category: "SALON",
      description:
        "Full-service beauty salon specializing in Ethiopian braiding, keratin treatments, nail art, and bridal packages. Our stylists bring decades of combined experience.",
      phone: "+251-911-300006",
      email: "selam.beauty@gmail.com",
      website: "https://selambeauty.example.com",
      address: "Megenagna, Yerer Building, 2nd Floor",
      city: "Addis Ababa",
    },
    {
      name: "Genet Hair Studio",
      category: "SALON",
      description:
        "Modern hair studio in Sarbet with a focus on natural hair care, coloring, and styling. We use premium imported and locally-sourced products.",
      phone: "+251-911-300007",
      email: "genet.studio@gmail.com",
      website: "https://genetstudio.example.com",
      address: "Sarbet, behind Total Gas Station",
      city: "Addis Ababa",
    },
    {
      name: "Lalibela Beauty Center",
      category: "SALON",
      description:
        "Named after Ethiopia's rock-hewn wonder, we sculpt beauty with precision. Full hair, nail, and makeup services in a luxurious setting.",
      phone: "+251-911-300008",
      email: "lalibela.beauty@gmail.com",
      website: "https://lalibelabeauty.example.com",
      address: "CMC Road, Diamond Building",
      city: "Addis Ababa",
    },
    {
      name: "Adama Style House",
      category: "SALON",
      description:
        "Adama's premier beauty destination for hair styling, manicures, pedicures, and facial treatments. Bridal packages available with advance booking.",
      phone: "+251-911-300009",
      email: "adama.style@gmail.com",
      website: "https://adamastyle.example.com",
      address: "Franko Area, near Adama Stadium",
      city: "Adama",
    },
    {
      name: "Queen Makeda Salon Mekelle",
      category: "SALON",
      description:
        "Inspired by the legendary queen, our salon offers royal treatment. Specializing in traditional and modern Ethiopian hairstyles, skincare, and bridal services.",
      phone: "+251-911-300010",
      email: "makeda.salon@gmail.com",
      website: "https://makedasalon.example.com",
      address: "Adi Haki, near Axum Hotel",
      city: "Mekelle",
    },

    // SPA (5)
    {
      name: "Serenity Wellness Spa",
      category: "SPA",
      description:
        "A full-service wellness spa dedicated to relaxation and rejuvenation. Massage therapies, facials, and body treatments by certified therapists.",
      phone: "+251-922-300011",
      email: "hello@serenityspa.example.com",
      website: "https://serenityspa.example.com",
      address: "Kazanchis, Mega Building, Ground Floor",
      city: "Addis Ababa",
    },
    {
      name: "Kuriftu Spa & Wellness",
      category: "SPA",
      description:
        "Luxury spa experience inspired by Ethiopian natural healing traditions. Hot springs therapy, aromatherapy, and signature Ethiopian coffee scrubs.",
      phone: "+251-922-300012",
      email: "kuriftu.spa@gmail.com",
      website: "https://kuriftuspa.example.com",
      address: "Old Airport Area, Bole Sub-City",
      city: "Addis Ababa",
    },
    {
      name: "Langano Retreat Spa",
      category: "SPA",
      description:
        "Escape to tranquility. Our lakeside spa offers deep tissue massage, steam rooms, and traditional Ethiopian herbal treatments in a peaceful environment.",
      phone: "+251-922-300013",
      email: "langano.retreat@gmail.com",
      website: "https://langanoretreat.example.com",
      address: "Lake Langano Shore Road",
      city: "Ziway",
    },
    {
      name: "Blue Lotus Day Spa",
      category: "SPA",
      description:
        "Bahir Dar's premier day spa with views of Lake Tana. Signature treatments include hot stone massage, anti-aging facials, and couples packages.",
      phone: "+251-922-300014",
      email: "bluelotus.spa@gmail.com",
      website: "https://bluelotusspa.example.com",
      address: "Lake Tana Shore, near Ghion Hotel",
      city: "Bahir Dar",
    },
    {
      name: "Harar Wellness Center",
      category: "SPA",
      description:
        "Combining ancient Harari wellness traditions with modern spa techniques. Herbal steam baths, traditional massage, and aromatherapy using local ingredients.",
      phone: "+251-922-300015",
      email: "harar.wellness@gmail.com",
      website: "https://hararwellness.example.com",
      address: "Jugol, near Harar Gate",
      city: "Harar",
    },

    // FITNESS (5)
    {
      name: "Ethio Fitness Hub",
      category: "FITNESS",
      description:
        "Modern gym with personal training, group fitness classes, yoga, and CrossFit. State-of-the-art equipment imported from Europe. Open to all fitness levels.",
      phone: "+251-922-300016",
      email: "ethio.fitness@gmail.com",
      website: "https://ethiofitness.example.com",
      address: "Atlas, near Edna Mall",
      city: "Addis Ababa",
    },
    {
      name: "Habesha CrossFit",
      category: "FITNESS",
      description:
        "CrossFit box for serious athletes and beginners alike. Certified coaches, Olympic lifting platforms, and a supportive community atmosphere.",
      phone: "+251-922-300017",
      email: "habesha.crossfit@gmail.com",
      website: "https://habeshacrossfit.example.com",
      address: "Gerji, near Imperial Hotel",
      city: "Addis Ababa",
    },
    {
      name: "Hawassa Active Life Gym",
      category: "FITNESS",
      description:
        "Full-service gym with cardio zone, weight room, sauna, and swimming pool. Personal training sessions available by appointment.",
      phone: "+251-922-300018",
      email: "hawassa.activelife@gmail.com",
      website: "https://hawassaactivelife.example.com",
      address: "Piazza, Hawassa Commercial Center",
      city: "Hawassa",
    },
    {
      name: "Adama Power Gym",
      category: "FITNESS",
      description:
        "Adama's largest gym facility with bodybuilding, cardio, and martial arts training areas. Home of multiple national championship athletes.",
      phone: "+251-922-300019",
      email: "adama.powergym@gmail.com",
      website: "https://adamapowergym.example.com",
      address: "Dembela Area, near Rift Valley University",
      city: "Adama",
    },
    {
      name: "Yoga Ethiopia Studio",
      category: "FITNESS",
      description:
        "Dedicated yoga and meditation studio. Classes include Vinyasa, Hatha, Yin, and prenatal yoga. Private sessions and corporate wellness programs available.",
      phone: "+251-922-300020",
      email: "yoga.ethiopia@gmail.com",
      website: "https://yogaethiopia.example.com",
      address: "Bole Medhanialem, Tsion Building, 4th Floor",
      city: "Addis Ababa",
    },

    // DENTAL (4)
    {
      name: "Addis Dental Care",
      category: "DENTAL",
      description:
        "Comprehensive dental clinic offering cleanings, fillings, root canals, orthodontics, and cosmetic dentistry. Digital X-rays and modern sterilization.",
      phone: "+251-911-300021",
      email: "addis.dental@gmail.com",
      website: "https://addisdental.example.com",
      address: "Bole, Wello Sefer, Haya Hulet Building",
      city: "Addis Ababa",
    },
    {
      name: "Bright Smile Dental Clinic",
      category: "DENTAL",
      description:
        "Family-friendly dental practice with gentle care for children and adults. Teeth whitening, implants, and emergency dental services available.",
      phone: "+251-911-300022",
      email: "brightsmile@gmail.com",
      website: "https://brightsmile.example.com",
      address: "Mexico Area, near Ghion Hotel",
      city: "Addis Ababa",
    },
    {
      name: "Gondar Dental Center",
      category: "DENTAL",
      description:
        "Northern Ethiopia's leading dental facility. University-affiliated dentists providing affordable, quality dental care from basic cleaning to surgery.",
      phone: "+251-911-300023",
      email: "gondar.dental@gmail.com",
      website: "https://gondardental.example.com",
      address: "Piassa, near Gondar University Hospital",
      city: "Gondar",
    },
    {
      name: "Jimma Family Dentistry",
      category: "DENTAL",
      description:
        "Warm, welcoming dental practice in Jimma. Preventive care, pediatric dentistry, and cosmetic treatments. Most insurance plans accepted.",
      phone: "+251-911-300024",
      email: "jimma.dentistry@gmail.com",
      website: "https://jimmadentistry.example.com",
      address: "Merkato Area, near Jimma University",
      city: "Jimma",
    },

    // MEDICAL (4)
    {
      name: "Bethel Medical Clinic",
      category: "MEDICAL",
      description:
        "General practice clinic offering consultations, lab tests, vaccinations, and chronic disease management. Board-certified physicians on staff.",
      phone: "+251-911-300025",
      email: "bethel.medical@gmail.com",
      website: "https://bethelmedical.example.com",
      address: "Lideta, near Bethel Teaching Hospital",
      city: "Addis Ababa",
    },
    {
      name: "Hayat Medical Center",
      category: "MEDICAL",
      description:
        "Multi-specialty medical center with internal medicine, pediatrics, OB/GYN, and dermatology. Online appointment booking available 24/7.",
      phone: "+251-911-300026",
      email: "hayat.medical@gmail.com",
      website: "https://hayatmedical.example.com",
      address: "Bole Sub-City, Kebele 03, near Bole Airport",
      city: "Addis Ababa",
    },
    {
      name: "Mekelle Health Clinic",
      category: "MEDICAL",
      description:
        "Community health clinic providing primary care, preventive health screenings, maternal health, and minor surgical procedures.",
      phone: "+251-911-300027",
      email: "mekelle.health@gmail.com",
      website: "https://mekellehealth.example.com",
      address: "Hawelti Area, near Ayder Hospital",
      city: "Mekelle",
    },
    {
      name: "Adama General Clinic",
      category: "MEDICAL",
      description:
        "Trusted general clinic serving the Adama community. Walk-in consultations, routine check-ups, laboratory services, and pharmacy on-site.",
      phone: "+251-911-300028",
      email: "adama.clinic@gmail.com",
      website: "https://adamaclinic.example.com",
      address: "Kebele 08, near Adama Science and Technology University",
      city: "Adama",
    },

    // TUTORING (4)
    {
      name: "Ethio Tutors Academy",
      category: "TUTORING",
      description:
        "Academic tutoring for grade 9–12 students and university entrance exam preparation. Subjects include Mathematics, Physics, Chemistry, and English.",
      phone: "+251-911-300029",
      email: "ethio.tutors@gmail.com",
      website: "https://ethiotutors.example.com",
      address: "4 Kilo, near Addis Ababa University",
      city: "Addis Ababa",
    },
    {
      name: "Bright Minds Learning Center",
      category: "TUTORING",
      description:
        "One-on-one and small group tutoring. Specializing in STEM subjects, SAT/ACT preparation, and coding bootcamps for young learners.",
      phone: "+251-911-300030",
      email: "brightminds@gmail.com",
      website: "https://brightminds.example.com",
      address: "Arat Kilo, Science Faculty Building",
      city: "Addis Ababa",
    },
    {
      name: "Amharic Language School",
      category: "TUTORING",
      description:
        "Language instruction for foreigners and diaspora. Beginner to advanced Amharic, Tigrinya, and Oromo language courses. Cultural immersion programs included.",
      phone: "+251-911-300031",
      email: "amharic.school@gmail.com",
      website: "https://amharicschool.example.com",
      address: "Piassa, Churchill Road, 2nd Floor",
      city: "Addis Ababa",
    },
    {
      name: "Hawassa Study Hub",
      category: "TUTORING",
      description:
        "After-school tutoring and weekend intensive sessions. Serving primary and secondary students with qualified teachers from Hawassa University.",
      phone: "+251-911-300032",
      email: "hawassa.studyhub@gmail.com",
      website: "https://hawassastudyhub.example.com",
      address: "Tabor Sub-City, near Hawassa University Main Gate",
      city: "Hawassa",
    },

    // CONSULTING (4)
    {
      name: "Addis Business Consulting",
      category: "CONSULTING",
      description:
        "Management consulting for Ethiopian businesses. Strategy, operations, HR, and digital transformation. Serving startups to established enterprises.",
      phone: "+251-922-300033",
      email: "addis.consulting@gmail.com",
      website: "https://addisconsulting.example.com",
      address: "Bole, Dembel City Center, 7th Floor",
      city: "Addis Ababa",
    },
    {
      name: "Ethio Legal Advisors",
      category: "CONSULTING",
      description:
        "Legal consulting firm specializing in Ethiopian business law, investment licensing, tax advisory, and contract drafting. Bilingual Amharic/English service.",
      phone: "+251-922-300034",
      email: "ethio.legal@gmail.com",
      website: "https://ethiolegal.example.com",
      address: "Kazanchis, Zemen Bank Building, 5th Floor",
      city: "Addis Ababa",
    },
    {
      name: "TechBridge IT Consulting",
      category: "CONSULTING",
      description:
        "IT consulting and software development services. Cloud migration, cybersecurity audits, ERP implementation, and mobile app development for Ethiopian businesses.",
      phone: "+251-922-300035",
      email: "techbridge@gmail.com",
      website: "https://techbridge.example.com",
      address: "Gerji, ICT Park Building",
      city: "Addis Ababa",
    },
    {
      name: "Green Growth Consulting",
      category: "CONSULTING",
      description:
        "Environmental and sustainability consulting. EIA studies, green building certification, renewable energy feasibility studies, and carbon offset programs.",
      phone: "+251-922-300036",
      email: "greengrowth@gmail.com",
      website: "https://greengrowth.example.com",
      address: "CMC, Sunshine Building, 3rd Floor",
      city: "Addis Ababa",
    },

    // PHOTOGRAPHY (4)
    {
      name: "Addis Lens Photography",
      category: "PHOTOGRAPHY",
      description:
        "Professional photography studio for weddings, portraits, corporate events, and product photography. Drone photography available for outdoor events.",
      phone: "+251-911-300037",
      email: "addislens@gmail.com",
      website: "https://addislens.example.com",
      address: "Bole, Atlas Area, Lens Building",
      city: "Addis Ababa",
    },
    {
      name: "Meskel Square Studios",
      category: "PHOTOGRAPHY",
      description:
        "Creative photography and videography. Specializing in Ethiopian cultural celebrations, Meskel, Timket, and wedding ceremonies. Full editing suite in-house.",
      phone: "+251-911-300038",
      email: "meskel.studios@gmail.com",
      website: "https://meskelsquarestudios.example.com",
      address: "Meskel Square Area, Ras Mekonnen Building",
      city: "Addis Ababa",
    },
    {
      name: "Bahir Dar Photo Studio",
      category: "PHOTOGRAPHY",
      description:
        "Lakeside photography studio offering portrait sessions, event coverage, and nature photography tours around Lake Tana and Blue Nile Falls.",
      phone: "+251-911-300039",
      email: "bahirdar.photo@gmail.com",
      website: "https://bahirdarphotos.example.com",
      address: "Near Lake Tana Boat Terminal",
      city: "Bahir Dar",
    },
    {
      name: "Dire Moments Photography",
      category: "PHOTOGRAPHY",
      description:
        "Capturing life's special moments in eastern Ethiopia. Wedding packages, graduation photos, family portraits, and commercial photography.",
      phone: "+251-911-300040",
      email: "diremoments@gmail.com",
      website: "https://diremoments.example.com",
      address: "Sabean Area, near Dire Dawa City Hall",
      city: "Dire Dawa",
    },

    // AUTOMOTIVE (4)
    {
      name: "Abyssinia Auto Care",
      category: "AUTOMOTIVE",
      description:
        "Full-service auto repair and maintenance. Oil changes, brake service, engine diagnostics, and tire alignment. Certified mechanics for all vehicle brands.",
      phone: "+251-911-300041",
      email: "abyssinia.auto@gmail.com",
      website: "https://abyssiniauto.example.com",
      address: "Kaliti, Automotive Row, near Kality Ring Road",
      city: "Addis Ababa",
    },
    {
      name: "Merkato Auto Garage",
      category: "AUTOMOTIVE",
      description:
        "Trusted auto garage in Merkato for over 20 years. Engine overhaul, electrical systems, AC repair, and bodywork. Competitive pricing guaranteed.",
      phone: "+251-911-300042",
      email: "merkato.garage@gmail.com",
      website: "https://merkatogarage.example.com",
      address: "Merkato, Automotive Section, Block 7",
      city: "Addis Ababa",
    },
    {
      name: "Adama Express Auto Service",
      category: "AUTOMOTIVE",
      description:
        "Quick and reliable auto service on the Addis-Adama expressway. Express oil change, tire service, and roadside assistance. Open 7 days a week.",
      phone: "+251-911-300043",
      email: "adama.autoexpress@gmail.com",
      website: "https://adamaauto.example.com",
      address: "Expressway Exit 3, Adama Industrial Zone",
      city: "Adama",
    },
    {
      name: "Hawassa Motor Works",
      category: "AUTOMOTIVE",
      description:
        "Southern Ethiopia's premier auto workshop. Specializing in Toyota, Suzuki, and Hyundai servicing. Genuine and aftermarket parts available.",
      phone: "+251-911-300044",
      email: "hawassa.motorworks@gmail.com",
      website: "https://hawassamotor.example.com",
      address: "Industrial Zone, near Hawassa Referral Hospital",
      city: "Hawassa",
    },

    // HOME_SERVICES (4)
    {
      name: "Addis Clean Home Services",
      category: "HOME_SERVICES",
      description:
        "Professional home cleaning, deep cleaning, post-construction cleanup, and regular maid services. Trained, vetted, and insured cleaning staff.",
      phone: "+251-922-300045",
      email: "addisclean@gmail.com",
      website: "https://addisclean.example.com",
      address: "Bole, Wollo Sefer, Service Center",
      city: "Addis Ababa",
    },
    {
      name: "Yemane Plumbing & Electric",
      category: "HOME_SERVICES",
      description:
        "Licensed plumbing and electrical services. Leak repair, pipe installation, wiring, circuit breaker upgrades, and emergency call-outs available 24/7.",
      phone: "+251-922-300046",
      email: "yemane.services@gmail.com",
      website: "https://yemaneplumbing.example.com",
      address: "Megenagna, Woreda 08",
      city: "Addis Ababa",
    },
    {
      name: "Bahir Dar Home Fix",
      category: "HOME_SERVICES",
      description:
        "General home repair and maintenance in Bahir Dar. Painting, carpentry, tiling, waterproofing, and furniture assembly. Free estimates on all jobs.",
      phone: "+251-922-300047",
      email: "bdhomefix@gmail.com",
      website: "https://bahirdarhomefix.example.com",
      address: "Kebele 17, near Bahir Dar Poly Technic",
      city: "Bahir Dar",
    },
    {
      name: "Jimma Garden & Landscape",
      category: "HOME_SERVICES",
      description:
        "Garden design, landscaping, lawn care, and tree trimming services in Jimma and surrounding areas. Transform your outdoor spaces with our expert team.",
      phone: "+251-922-300048",
      email: "jimma.garden@gmail.com",
      website: "https://jimmagarden.example.com",
      address: "Jiren Area, near Jimma Teachers College",
      city: "Jimma",
    },

    // PET_SERVICES (3)
    {
      name: "Addis Pet Care Center",
      category: "PET_SERVICES",
      description:
        "Comprehensive pet care including veterinary check-ups, grooming, boarding, and pet sitting. Specialized care for dogs, cats, and exotic pets.",
      phone: "+251-911-300049",
      email: "addis.petcare@gmail.com",
      website: "https://addispetcare.example.com",
      address: "Old Airport, near Bole Medhanialem Church",
      city: "Addis Ababa",
    },
    {
      name: "Furry Friends Pet Grooming",
      category: "PET_SERVICES",
      description:
        "Professional pet grooming salon. Bathing, haircuts, nail trimming, ear cleaning, and flea treatments. We treat your pets like family.",
      phone: "+251-911-300050",
      email: "furryfriends@gmail.com",
      website: "https://furryfriends.example.com",
      address: "CMC, Michael Area, Pet Plaza",
      city: "Addis Ababa",
    },
    {
      name: "Hawassa Vet & Pet Shop",
      category: "PET_SERVICES",
      description:
        "Veterinary clinic and pet supply shop. Vaccinations, surgery, dental care, and premium pet food. Walk-in and appointment-based services.",
      phone: "+251-911-300051",
      email: "hawassa.vet@gmail.com",
      website: "https://hawassavet.example.com",
      address: "Main Street, near Hawassa City Park",
      city: "Hawassa",
    },

    // OTHER (3)
    {
      name: "Addis Events & Planning",
      category: "OTHER",
      description:
        "Full-service event planning for weddings, corporate events, birthdays, and cultural celebrations. Venue selection, catering coordination, and decoration.",
      phone: "+251-922-300052",
      email: "addis.events@gmail.com",
      website: "https://addisevents.example.com",
      address: "Bole, Wollo Sefer, Eliana Building",
      city: "Addis Ababa",
    },
    {
      name: "Habesha Tailoring Studio",
      category: "OTHER",
      description:
        "Custom tailoring of traditional Ethiopian clothing — habesha kemis, netela, and modern Ethiopian-inspired fashion. Alterations and bespoke suits also available.",
      phone: "+251-922-300053",
      email: "habesha.tailor@gmail.com",
      website: "https://habeshatailor.example.com",
      address: "Piassa, near St. George Church",
      city: "Addis Ababa",
    },
    {
      name: "Sheger Printing Press",
      category: "OTHER",
      description:
        "Commercial printing services including business cards, brochures, banners, wedding invitations, and large-format printing. Same-day rush orders available.",
      phone: "+251-922-300054",
      email: "sheger.print@gmail.com",
      website: "https://shegerprint.example.com",
      address: "Mexico Area, Printing District",
      city: "Addis Ababa",
    },
  ];

  // Owner 55 matches 55 businesses — last owner gets last business
  const businesses: SeededBusiness[] = [];

  for (let i = 0; i < defs.length; i++) {
    const def = defs[i];
    const b = await prisma.business.create({
      data: {
        ownerId: ownerIds[i],
        name: def.name,
        slug: slugify(def.name) + (i > 0 ? `-${i}` : ""),
        description: def.description,
        category: def.category,
        phone: def.phone,
        email: def.email,
        website: def.website,
        address: def.address,
        city: def.city,
        state: def.city === "Addis Ababa" ? "Addis Ababa" : def.city,
        zipCode: def.city === "Addis Ababa" ? "1000" : "2000",
        isActive: i !== 53, // One business is inactive (edge case)
      },
    });
    businesses.push({
      id: b.id,
      name: b.name,
      category: b.category as BusinessCategory,
      ownerId: b.ownerId,
    });
  }

  console.log(`✅ Created ${businesses.length} businesses.\n`);
  return businesses;
}
