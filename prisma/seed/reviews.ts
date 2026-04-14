/**
 * @file Seed reviews — reviews for completed bookings
 * Covers all ratings 1-5 with varied comments
 */

import { getPrisma } from "./helpers";
import type { SeededBooking } from "./bookings";

const REVIEW_COMMENTS: { rating: number; comments: string[] }[] = [
  {
    rating: 5,
    comments: [
      "Absolutely fantastic experience! Will definitely come back.",
      "Best service in Addis Ababa. Highly recommend to everyone!",
      "Exceeded all my expectations. The staff was incredibly professional.",
      "ድንቅ አገልግሎት! በጣም ደስ ብሎኛል። (Wonderful service! Very happy.)",
      "Five stars isn't enough. Perfect in every way!",
      "My go-to place. Consistently excellent quality every visit.",
      "The attention to detail was remarkable. Worth every birr.",
      "I've tried many places but this is hands down the best.",
      "Professional, friendly, and efficient. Couldn't ask for more.",
      "Made my day! The whole team was warm and welcoming.",
      "Transformative experience. I feel like a new person.",
      "Unmatched quality in the area. Premium service at fair prices.",
    ],
  },
  {
    rating: 4,
    comments: [
      "Very good service overall. Minor wait time but worth it.",
      "Great experience! Only giving 4 stars because parking was difficult.",
      "Really enjoyed it. The facility is clean and modern.",
      "Skilled professionals. Would love slightly longer appointment slots.",
      "Impressed with the quality. Just wish they were open on Sundays.",
      "Solid service, good value for money. Will return.",
      "Almost perfect — just needed a bit more attention at the end.",
      "Very professional staff. The waiting area could use some upgrades.",
      "Happy with the results. Booking was easy and convenient.",
      "Good experience. Coffee while waiting was a nice touch!",
    ],
  },
  {
    rating: 3,
    comments: [
      "Decent service but nothing extraordinary. Average experience.",
      "It was okay. Expected a bit more for the price.",
      "The service was fine but the wait was too long.",
      "Mixed feelings — the actual service was good but communication could improve.",
      "Not bad, not great. I might try somewhere else next time.",
      "Service quality was good but the facility needs renovation.",
      "Average experience. Staff seemed rushed during my appointment.",
      "Acceptable quality but I've had better elsewhere for similar price.",
    ],
  },
  {
    rating: 2,
    comments: [
      "Disappointed with the service. Expected much better quality.",
      "Long wait, rushed service. Not worth the price at all.",
      "The staff seemed uninterested. Barely adequate experience.",
      "Not satisfied. Communication was poor and result was mediocre.",
      "Below average. Won't recommend unless they improve significantly.",
      "Had higher expectations based on reviews. Very disappointing.",
    ],
  },
  {
    rating: 1,
    comments: [
      "Terrible experience. Will never return. Complete waste of money.",
      "Worst service I've ever received. Avoid at all costs.",
      "Rude staff, poor quality, overpriced. Zero stars if I could.",
      "Walked out halfway through. Completely unprofessional.",
    ],
  },
];

export async function seedReviews(bookings: SeededBooking[]): Promise<void> {
  const prisma = getPrisma();
  console.log("⭐ Creating reviews...");

  const completedBookings = bookings.filter((b) => b.status === "COMPLETED");

  // Review about 70% of completed bookings (realistic — not everyone leaves a review)
  const bookingsToReview = completedBookings.filter(
    (_, i) => i % 10 < 7
  );

  let count = 0;

  // Track which customer-business-booking combos we've reviewed
  const reviewedBookings = new Set<string>();

  for (let i = 0; i < bookingsToReview.length; i++) {
    const booking = bookingsToReview[i];

    // Skip if already reviewed this booking
    if (reviewedBookings.has(booking.id)) continue;
    reviewedBookings.add(booking.id);

    // Distribute ratings: mostly 4-5, some 3, few 1-2
    let ratingGroup: number;
    const ratingRoll = i % 20;
    if (ratingRoll < 8) ratingGroup = 5;
    else if (ratingRoll < 14) ratingGroup = 4;
    else if (ratingRoll < 17) ratingGroup = 3;
    else if (ratingRoll < 19) ratingGroup = 2;
    else ratingGroup = 1;

    const ratingData = REVIEW_COMMENTS.find((r) => r.rating === ratingGroup)!;
    const comment =
      ratingData.comments[i % ratingData.comments.length];

    try {
      await prisma.review.create({
        data: {
          customerId: booking.customerId,
          businessId: booking.businessId,
          bookingId: booking.id,
          rating: ratingGroup,
          comment,
        },
      });
      count++;
    } catch {
      // Skip duplicate reviews (unique constraint on bookingId)
    }
  }

  console.log(`✅ Created ${count} reviews.\n`);
}
