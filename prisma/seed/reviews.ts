/**
 * @file Seed reviews with sentiment data.
 *
 * ~70% of COMPLETED bookings get reviews.
 * Demo businesses and demo customers get 100% review coverage.
 * Ratings distribution: 5★ 40%, 4★ 30%, 3★ 15%, 2★ 10%, 1★ 5%
 * All reviews include AI-generated sentiment fields.
 */

import { getPrisma } from "./helpers";
import type { SeededBooking } from "./bookings";

interface ReviewTemplate {
  rating: number;
  comment: string;
  sentimentLabel: "positive" | "neutral" | "negative";
  sentimentScore: number;
}

const TEMPLATES: ReviewTemplate[] = [
  // ── 5-star positive ──────────────────────────────────────────────────────
  {
    rating: 5,
    sentimentLabel: "positive",
    sentimentScore: 0.98,
    comment:
      "Absolutely fantastic experience! The staff was incredibly professional and the results were beyond my expectations. Will definitely be coming back!",
  },
  {
    rating: 5,
    sentimentLabel: "positive",
    sentimentScore: 0.97,
    comment:
      "Best service in Addis Ababa. Highly recommend to everyone! Worth every birr spent.",
  },
  {
    rating: 5,
    sentimentLabel: "positive",
    sentimentScore: 0.99,
    comment:
      "ድንቅ አገልግሎት! በጣም ደስ ብሎኛል። The whole team was warm, welcoming, and incredibly skilled.",
  },
  {
    rating: 5,
    sentimentLabel: "positive",
    sentimentScore: 0.96,
    comment:
      "My go-to place now. Consistently excellent quality every single visit. Five stars isn't enough!",
  },
  {
    rating: 5,
    sentimentLabel: "positive",
    sentimentScore: 0.98,
    comment:
      "Transformative experience. The attention to detail was remarkable. I feel like a completely new person!",
  },
  {
    rating: 5,
    sentimentLabel: "positive",
    sentimentScore: 0.95,
    comment:
      "Unmatched quality in the area. Premium service at very fair prices. Made my day completely.",
  },
  {
    rating: 5,
    sentimentLabel: "positive",
    sentimentScore: 0.97,
    comment:
      "I've tried many places in Addis but this is hands down the absolute best. Never going anywhere else!",
  },
  {
    rating: 5,
    sentimentLabel: "positive",
    sentimentScore: 0.96,
    comment:
      "Professional, friendly, efficient, and affordable. Couldn't ask for more from any business!",
  },
  {
    rating: 5,
    sentimentLabel: "positive",
    sentimentScore: 0.99,
    comment:
      "Made my special day even more special. Every person I interacted with was warm and professional.",
  },
  {
    rating: 5,
    sentimentLabel: "positive",
    sentimentScore: 0.94,
    comment:
      "Such a relaxing and rejuvenating experience. Exactly what I needed after a stressful week at work.",
  },
  // ── 4-star positive ──────────────────────────────────────────────────────
  {
    rating: 4,
    sentimentLabel: "positive",
    sentimentScore: 0.82,
    comment:
      "Very good service overall. Minor wait time at the start but the quality made up for it. Will return!",
  },
  {
    rating: 4,
    sentimentLabel: "positive",
    sentimentScore: 0.8,
    comment:
      "Really enjoyed it! Great experience. Only giving 4 stars because parking outside is a little difficult.",
  },
  {
    rating: 4,
    sentimentLabel: "positive",
    sentimentScore: 0.85,
    comment:
      "Impressed with the quality. The facility is clean and modern. Just wish they were open on Sundays too.",
  },
  {
    rating: 4,
    sentimentLabel: "positive",
    sentimentScore: 0.79,
    comment:
      "Solid service, good value for money. I will definitely return. Booking online was very easy and fast.",
  },
  {
    rating: 4,
    sentimentLabel: "positive",
    sentimentScore: 0.83,
    comment:
      "Almost perfect — just needed a little more attention at the very end. Overall very happy customer!",
  },
  {
    rating: 4,
    sentimentLabel: "positive",
    sentimentScore: 0.78,
    comment:
      "Very professional staff. The waiting area could use some upgrades but service quality is top notch.",
  },
  {
    rating: 4,
    sentimentLabel: "positive",
    sentimentScore: 0.84,
    comment:
      "Happy with the results! They offered complimentary coffee while I waited which was a very nice touch.",
  },
  {
    rating: 4,
    sentimentLabel: "positive",
    sentimentScore: 0.81,
    comment:
      "Good experience. Skilled professionals who clearly care about their work. Would recommend to friends.",
  },
  {
    rating: 4,
    sentimentLabel: "positive",
    sentimentScore: 0.77,
    comment:
      "Skilled professionals. Would love slightly longer appointment slots but overall highly satisfied.",
  },
  {
    rating: 4,
    sentimentLabel: "positive",
    sentimentScore: 0.86,
    comment:
      "Reliable and consistent quality. This is my third visit and each time it gets a little better!",
  },
  // ── 3-star neutral ───────────────────────────────────────────────────────
  {
    rating: 3,
    sentimentLabel: "neutral",
    sentimentScore: 0.71,
    comment:
      "Decent service but nothing extraordinary. Average experience overall. Might give it another try.",
  },
  {
    rating: 3,
    sentimentLabel: "neutral",
    sentimentScore: 0.68,
    comment:
      "It was okay. Expected a bit more for the price I paid. The actual service was fine but nothing wow.",
  },
  {
    rating: 3,
    sentimentLabel: "neutral",
    sentimentScore: 0.65,
    comment:
      "The service itself was good but the waiting time was too long. Communication could definitely improve.",
  },
  {
    rating: 3,
    sentimentLabel: "neutral",
    sentimentScore: 0.72,
    comment:
      "Mixed feelings. The actual work was good but I had trouble getting a confirmation on my booking time.",
  },
  {
    rating: 3,
    sentimentLabel: "neutral",
    sentimentScore: 0.69,
    comment:
      "Not bad, not great. I might try somewhere else next time unless they improve things a bit.",
  },
  {
    rating: 3,
    sentimentLabel: "neutral",
    sentimentScore: 0.73,
    comment:
      "Service quality was good but the facility itself needs some renovation and modernization.",
  },
  {
    rating: 3,
    sentimentLabel: "neutral",
    sentimentScore: 0.67,
    comment:
      "Average experience. Staff seemed a bit rushed during my appointment. Could be better.",
  },
  {
    rating: 3,
    sentimentLabel: "neutral",
    sentimentScore: 0.7,
    comment:
      "Acceptable quality but I've had better elsewhere for a similar price. Neutral recommendation.",
  },
  // ── 2-star negative ──────────────────────────────────────────────────────
  {
    rating: 2,
    sentimentLabel: "negative",
    sentimentScore: 0.78,
    comment:
      "Disappointed with the service. Expected much better quality based on the reviews I read online.",
  },
  {
    rating: 2,
    sentimentLabel: "negative",
    sentimentScore: 0.82,
    comment:
      "Long wait, then a rushed service. Not worth the price at all. Very disappointed with the outcome.",
  },
  {
    rating: 2,
    sentimentLabel: "negative",
    sentimentScore: 0.76,
    comment:
      "The staff seemed uninterested and barely engaged. Barely adequate experience. Won't be returning.",
  },
  {
    rating: 2,
    sentimentLabel: "negative",
    sentimentScore: 0.8,
    comment:
      "Not satisfied at all. Communication was poor and the final result was completely mediocre.",
  },
  {
    rating: 2,
    sentimentLabel: "negative",
    sentimentScore: 0.85,
    comment:
      "Below average in every way. Won't recommend unless they make significant improvements soon.",
  },
  // ── 1-star negative ──────────────────────────────────────────────────────
  {
    rating: 1,
    sentimentLabel: "negative",
    sentimentScore: 0.97,
    comment:
      "Terrible experience from start to finish. Completely unprofessional staff. Will never return.",
  },
  {
    rating: 1,
    sentimentLabel: "negative",
    sentimentScore: 0.96,
    comment:
      "Worst service I have ever received in my life. Complete and total waste of hard-earned money. Avoid!",
  },
  {
    rating: 1,
    sentimentLabel: "negative",
    sentimentScore: 0.98,
    comment:
      "Rude staff, very poor quality, and completely overpriced for what was delivered. Zero stars if I could.",
  },
  {
    rating: 1,
    sentimentLabel: "negative",
    sentimentScore: 0.95,
    comment:
      "Walked out halfway through the appointment. Completely unprofessional in every possible way.",
  },
];

function pickTemplate(i: number): ReviewTemplate {
  // Distribution: 5★ 40%, 4★ 30%, 3★ 15%, 2★ 10%, 1★ 5%
  const r = i % 20;
  if (r < 8) return TEMPLATES[i % 10]; // 5-star (indices 0-9)
  if (r < 14) return TEMPLATES[10 + (i % 10)]; // 4-star (indices 10-19)
  if (r < 17) return TEMPLATES[20 + (i % 8)]; // 3-star (indices 20-27)
  if (r < 19) return TEMPLATES[28 + (i % 5)]; // 2-star (indices 28-32)
  return TEMPLATES[33 + (i % 4)]; // 1-star (indices 33-36)
}

export async function seedReviews(bookings: SeededBooking[]): Promise<void> {
  const prisma = getPrisma();
  console.log("⭐ Creating reviews...");

  const completedBookings = bookings.filter((b) => b.status === "COMPLETED");
  let count = 0;

  for (let i = 0; i < completedBookings.length; i++) {
    const booking = completedBookings[i];

    // Demo businesses and demo customers get 100% reviews
    // Regular get ~70%
    const shouldReview = booking.isDemo || i % 10 < 7;
    if (!shouldReview) continue;

    const tmpl = pickTemplate(i);

    try {
      await prisma.review.create({
        data: {
          customerId: booking.customerId,
          businessId: booking.businessId,
          bookingId: booking.id,
          rating: tmpl.rating,
          comment: tmpl.comment,
          sentimentLabel: tmpl.sentimentLabel,
          sentimentScore: tmpl.sentimentScore,
        },
      });
      count++;
    } catch {
      // unique constraint — skip
    }
  }

  console.log(`✅ Created ${count} reviews.\n`);
}
