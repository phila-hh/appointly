/**
 * @file Seed notifications — in-app notifications for all user types.
 *
 * Generates realistic notifications for:
 *   - Demo customers (heavy coverage — all types)
 *   - Demo business owners (heavy coverage — all types)
 *   - Admins (moderate coverage)
 *   - Regular customers and owners (light coverage)
 *
 * Mix of read (isRead: true) and unread (isRead: false) notifications.
 * Covers the full date window: 2025-07 → 2026-06
 */

import { getPrisma, d } from "./helpers";
import type { SeedUser } from "./users";
import type { SeededBusiness } from "./businesses";
import type { SeededBooking } from "./bookings";

export async function seedNotifications(
  admins: SeedUser[],
  demoOwners: SeedUser[],
  regularOwners: SeedUser[],
  demoCustomers: SeedUser[],
  regularCustomers: SeedUser[],
  businesses: SeededBusiness[],
  bookings: SeededBooking[]
): Promise<void> {
  const prisma = getPrisma();
  console.log("🔔 Creating notifications...");

  let count = 0;

  const create = async (data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    isRead?: boolean;
    createdAt?: Date;
  }) => {
    try {
      await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          link: data.link ?? null,
          isRead: data.isRead ?? false,
          createdAt: data.createdAt ?? new Date(),
        },
      });
      count++;
    } catch {
      // skip
    }
  };

  const demoBizIds = businesses.filter((b) => b.isDemo).map((b) => b.id);

  // ── Demo customer 0 — Bereket Gebremedhin ─────────────────────────────────
  const c0 = demoCustomers[0];
  const c0Bookings = bookings.filter((b) => b.customerId === c0.id);
  const c0Completed = c0Bookings.filter((b) => b.status === "COMPLETED");
  const c0Confirmed = c0Bookings.filter((b) => b.status === "CONFIRMED");
  const c0Cancelled = c0Bookings.filter((b) => b.status === "CANCELLED");

  // BOOKING_CONFIRMED notifications
  for (let i = 0; i < Math.min(c0Confirmed.length, 8); i++) {
    const bk = c0Confirmed[i];
    await create({
      userId: c0.id,
      type: "BOOKING_CONFIRMED",
      title: "Booking Confirmed!",
      message: `Your appointment has been confirmed. We look forward to seeing you on ${bk.date.toDateString()} at ${bk.startTime}.`,
      link: `/bookings/${bk.id}`,
      isRead: i < 5,
      createdAt: d(2025, 9 + (i % 4), 5 + i),
    });
  }

  // REVIEW_REQUEST notifications (after completed bookings)
  for (let i = 0; i < Math.min(c0Completed.length, 10); i++) {
    const bk = c0Completed[i];
    await create({
      userId: c0.id,
      type: "REVIEW_REQUEST",
      title: "How was your visit?",
      message:
        "We hope you enjoyed your recent appointment! Share your experience to help other customers and improve our service.",
      link: `/bookings/${bk.id}/review`,
      isRead: i < 6,
      createdAt: d(2025, 8 + (i % 5), 10 + i),
    });
  }

  // BOOKING_CANCELLED notifications
  for (let i = 0; i < Math.min(c0Cancelled.length, 4); i++) {
    const bk = c0Cancelled[i];
    await create({
      userId: c0.id,
      type: "BOOKING_CANCELLED",
      title: "Booking Cancelled",
      message: `Your appointment on ${bk.date.toDateString()} has been cancelled. If you did not request this, please contact the business directly.`,
      link: `/bookings/${bk.id}`,
      isRead: i < 2,
      createdAt: d(2025, 10 + (i % 3), 8 + i),
    });
  }

  // PAYMENT_REFUNDED notifications
  await create({
    userId: c0.id,
    type: "PAYMENT_REFUNDED",
    title: "Refund Processed",
    message:
      "Your refund of ETB 2,500 has been successfully processed. It may take 3-5 business days to reflect in your account.",
    link: "/bookings",
    isRead: true,
    createdAt: d(2025, 11, 15),
  });
  await create({
    userId: c0.id,
    type: "PAYMENT_REFUNDED",
    title: "Refund Processed",
    message:
      "Your refund of ETB 450 has been successfully processed. Thank you for your patience.",
    link: "/bookings",
    isRead: false,
    createdAt: d(2026, 2, 20),
  });

  // REVIEW_REPLY notifications (business replied to their reviews)
  await create({
    userId: c0.id,
    type: "REVIEW_REPLY",
    title: "The business replied to your review",
    message:
      'Habesha Cuts Barbershop responded to your review: "Thank you so much for your kind words! We look forward to serving you again."',
    link: "/reviews",
    isRead: true,
    createdAt: d(2025, 9, 22),
  });
  await create({
    userId: c0.id,
    type: "REVIEW_REPLY",
    title: "The business replied to your review",
    message:
      'Axum Wellness Spa responded to your review: "We are so glad you had a wonderful experience! See you next time!"',
    link: "/reviews",
    isRead: true,
    createdAt: d(2026, 1, 18),
  });
  await create({
    userId: c0.id,
    type: "REVIEW_REPLY",
    title: "The business replied to your review",
    message:
      'Tigray Fitness Hub responded to your review: "Your feedback keeps us motivated. Thank you and see you soon!"',
    link: "/reviews",
    isRead: false,
    createdAt: d(2026, 4, 5),
  });

  // BOOKING_RESCHEDULED notifications
  await create({
    userId: c0.id,
    type: "BOOKING_RESCHEDULED",
    title: "Booking Rescheduled",
    message:
      "Your appointment at Habesha Cuts Barbershop has been successfully rescheduled. Please check your updated booking details.",
    link: "/bookings",
    isRead: true,
    createdAt: d(2025, 10, 3),
  });
  await create({
    userId: c0.id,
    type: "BOOKING_RESCHEDULED",
    title: "Booking Rescheduled",
    message:
      "Your appointment at Tigray Fitness Hub has been rescheduled to a new time slot as per your request.",
    link: "/bookings",
    isRead: false,
    createdAt: d(2026, 3, 14),
  });

  // ── Demo customer 1 — Semhar Tekleab ──────────────────────────────────────
  const c1 = demoCustomers[1];
  const c1Bookings = bookings.filter((b) => b.customerId === c1.id);
  const c1Completed = c1Bookings.filter((b) => b.status === "COMPLETED");
  const c1Confirmed = c1Bookings.filter((b) => b.status === "CONFIRMED");

  for (let i = 0; i < Math.min(c1Confirmed.length, 6); i++) {
    const bk = c1Confirmed[i];
    await create({
      userId: c1.id,
      type: "BOOKING_CONFIRMED",
      title: "Booking Confirmed!",
      message: `Your spa appointment is confirmed for ${bk.date.toDateString()} at ${bk.startTime}. We are looking forward to pampering you!`,
      link: `/bookings/${bk.id}`,
      isRead: i < 4,
      createdAt: d(2025, 8 + (i % 5), 3 + i * 2),
    });
  }

  for (let i = 0; i < Math.min(c1Completed.length, 8); i++) {
    await create({
      userId: c1.id,
      type: "REVIEW_REQUEST",
      title: "Share your experience!",
      message:
        "We hope your recent visit was wonderful. Leave a review to help others discover our services!",
      link: "/bookings",
      isRead: i < 5,
      createdAt: d(2025, 9 + (i % 4), 5 + i),
    });
  }

  await create({
    userId: c1.id,
    type: "REVIEW_REPLY",
    title: "Axum Wellness Spa replied to your review",
    message:
      '"Thank you for your lovely feedback! We can\'t wait to welcome you back for your next relaxation session."',
    link: "/reviews",
    isRead: true,
    createdAt: d(2025, 12, 10),
  });
  await create({
    userId: c1.id,
    type: "PAYMENT_REFUNDED",
    title: "Refund Processed",
    message:
      "Your refund of ETB 1,800 for the cancelled couples package has been processed successfully.",
    link: "/bookings",
    isRead: true,
    createdAt: d(2026, 1, 25),
  });
  await create({
    userId: c1.id,
    type: "BOOKING_CANCELLED",
    title: "Booking Cancelled",
    message:
      "Your appointment has been cancelled as requested. A full refund will be processed within 3-5 business days.",
    link: "/bookings",
    isRead: false,
    createdAt: d(2026, 3, 8),
  });
  await create({
    userId: c1.id,
    type: "BOOKING_RESCHEDULED",
    title: "Your booking has been rescheduled",
    message:
      "Your session at Axum Wellness Spa has been successfully moved to your preferred new time slot.",
    link: "/bookings",
    isRead: false,
    createdAt: d(2026, 5, 2),
  });

  // ── Demo customer 2 — Yonas Hagos ─────────────────────────────────────────
  const c2 = demoCustomers[2];
  const c2Bookings = bookings.filter((b) => b.customerId === c2.id);
  const c2Confirmed = c2Bookings.filter((b) => b.status === "CONFIRMED");
  const c2Completed = c2Bookings.filter((b) => b.status === "COMPLETED");

  for (let i = 0; i < Math.min(c2Confirmed.length, 6); i++) {
    const bk = c2Confirmed[i];
    await create({
      userId: c2.id,
      type: "BOOKING_CONFIRMED",
      title: "Booking Confirmed!",
      message: `Your training session is confirmed for ${bk.date.toDateString()} at ${bk.startTime}. Get ready to crush it!`,
      link: `/bookings/${bk.id}`,
      isRead: i < 3,
      createdAt: d(2025, 10 + (i % 3), 4 + i),
    });
  }

  for (let i = 0; i < Math.min(c2Completed.length, 8); i++) {
    await create({
      userId: c2.id,
      type: "REVIEW_REQUEST",
      title: "Rate your session!",
      message:
        "How was your recent workout or grooming session? Leave a quick review — it only takes a minute!",
      link: "/bookings",
      isRead: i < 4,
      createdAt: d(2025, 9 + (i % 4), 2 + i),
    });
  }

  await create({
    userId: c2.id,
    type: "REVIEW_REPLY",
    title: "Tigray Fitness Hub replied to your review",
    message:
      '"Your dedication inspires us all! We look forward to your next session. Keep pushing!"',
    link: "/reviews",
    isRead: true,
    createdAt: d(2026, 2, 14),
  });
  await create({
    userId: c2.id,
    type: "BOOKING_RESCHEDULED",
    title: "Booking Rescheduled",
    message:
      "Your appointment has been rescheduled successfully. Your new time slot has been confirmed.",
    link: "/bookings",
    isRead: true,
    createdAt: d(2025, 11, 20),
  });
  await create({
    userId: c2.id,
    type: "BOOKING_CANCELLED",
    title: "Booking Cancelled",
    message:
      "Your gym session was cancelled due to a scheduling conflict. We apologize for the inconvenience.",
    link: "/bookings",
    isRead: false,
    createdAt: d(2026, 4, 11),
  });
  await create({
    userId: c2.id,
    type: "PAYMENT_REFUNDED",
    title: "Refund Processed",
    message:
      "ETB 1,500 has been refunded to your account for the cancelled personal training session.",
    link: "/bookings",
    isRead: false,
    createdAt: d(2026, 4, 15),
  });

  // ── Demo business owner 0 — Tekleab Kahsay (Habesha Cuts) ────────────────
  const o0 = demoOwners[0];
  const biz0Id = demoBizIds[0];
  const biz0Bookings = bookings.filter((b) => b.businessId === biz0Id);
  const biz0Confirmed = biz0Bookings.filter((b) => b.status === "CONFIRMED");
  const biz0Cancelled = biz0Bookings.filter((b) => b.status === "CANCELLED");

  for (let i = 0; i < Math.min(biz0Confirmed.length, 12); i++) {
    const bk = biz0Confirmed[i];
    await create({
      userId: o0.id,
      type: "NEW_BOOKING",
      title: "New Appointment Booked!",
      message: `A new booking has been made for ${bk.startTime} on ${bk.date.toDateString()}. Check your schedule to prepare.`,
      link: `/dashboard/bookings/${bk.id}`,
      isRead: i < 8,
      createdAt: d(2025, 7 + (i % 6), 3 + i),
    });
  }

  for (let i = 0; i < Math.min(biz0Cancelled.length, 4); i++) {
    const bk = biz0Cancelled[i];
    await create({
      userId: o0.id,
      type: "BOOKING_CANCELLED",
      title: "Booking Cancelled",
      message: `A booking for ${bk.date.toDateString()} has been cancelled by the customer. The time slot is now available.`,
      link: `/dashboard/bookings/${bk.id}`,
      isRead: i < 2,
      createdAt: d(2025, 9 + (i % 4), 7 + i),
    });
  }

  await create({
    userId: o0.id,
    type: "REVIEW_RECEIVED",
    title: "New Review Received!",
    message:
      "A customer left a 5-star review for Habesha Cuts Barbershop. Great job! Keep up the excellent work.",
    link: "/dashboard/reviews",
    isRead: true,
    createdAt: d(2025, 9, 18),
  });
  await create({
    userId: o0.id,
    type: "REVIEW_RECEIVED",
    title: "New Review Received!",
    message:
      "A customer left a 4-star review. They mentioned the wait time could be shorter. Worth reviewing your schedule.",
    link: "/dashboard/reviews",
    isRead: true,
    createdAt: d(2025, 11, 5),
  });
  await create({
    userId: o0.id,
    type: "REVIEW_RECEIVED",
    title: "New 1-Star Review — Attention Needed",
    message:
      "A customer left a 1-star review. Please respond promptly to address their concerns and protect your rating.",
    link: "/dashboard/reviews",
    isRead: false,
    createdAt: d(2026, 2, 28),
  });
  await create({
    userId: o0.id,
    type: "PAYOUT_PROCESSED",
    title: "Payout Processed!",
    message:
      "Your payout of ETB 42,500 for the period of August 2025 has been processed and transferred to your account.",
    link: "/dashboard/payouts",
    isRead: true,
    createdAt: d(2025, 9, 1),
  });
  await create({
    userId: o0.id,
    type: "PAYOUT_PROCESSED",
    title: "Payout Processed!",
    message:
      "Your September 2025 payout of ETB 51,000 has been processed successfully.",
    link: "/dashboard/payouts",
    isRead: true,
    createdAt: d(2025, 10, 1),
  });
  await create({
    userId: o0.id,
    type: "PAYOUT_PROCESSED",
    title: "Payout Processed!",
    message:
      "Your payout for October 2025 (ETB 47,200) has been transferred. Log in to view the full breakdown.",
    link: "/dashboard/payouts",
    isRead: true,
    createdAt: d(2025, 11, 1),
  });
  await create({
    userId: o0.id,
    type: "PAYOUT_PROCESSED",
    title: "Payout Processed!",
    message:
      "Your Q1 2026 payout of ETB 68,500 is currently processing and will arrive within 2 business days.",
    link: "/dashboard/payouts",
    isRead: false,
    createdAt: d(2026, 2, 1),
  });
  await create({
    userId: o0.id,
    type: "BOOKING_RESCHEDULED",
    title: "Booking Rescheduled",
    message:
      "A customer has rescheduled their appointment. Please review your updated calendar for the new time.",
    link: "/dashboard/bookings",
    isRead: true,
    createdAt: d(2025, 10, 14),
  });
  await create({
    userId: o0.id,
    type: "BOOKING_RESCHEDULED",
    title: "Booking Rescheduled",
    message:
      "Another appointment has been rescheduled by a customer. Check your dashboard for the updated details.",
    link: "/dashboard/bookings",
    isRead: false,
    createdAt: d(2026, 4, 20),
  });
  await create({
    userId: o0.id,
    type: "OVERDUE_BOOKING",
    title: "Overdue Booking — Action Required",
    message:
      "A past appointment has not been marked as complete or no-show. Please update its status in your dashboard.",
    link: "/dashboard/bookings",
    isRead: false,
    createdAt: d(2026, 5, 10),
  });
  await create({
    userId: o0.id,
    type: "BOOKING_EXPIRING_SOON",
    title: "Unpaid Booking Expiring Soon",
    message:
      "A customer's booking will expire in 2 hours if payment is not completed. Consider reaching out to them.",
    link: "/dashboard/bookings",
    isRead: true,
    createdAt: d(2026, 3, 5),
  });

  // ── Demo business owner 1 — Abrehet Weldu (Axum Wellness Spa) ────────────
  const o1 = demoOwners[1];
  const biz1Id = demoBizIds[1];
  const biz1Bookings = bookings.filter((b) => b.businessId === biz1Id);
  const biz1Confirmed = biz1Bookings.filter((b) => b.status === "CONFIRMED");
  const biz1Cancelled = biz1Bookings.filter((b) => b.status === "CANCELLED");

  for (let i = 0; i < Math.min(biz1Confirmed.length, 10); i++) {
    const bk = biz1Confirmed[i];
    await create({
      userId: o1.id,
      type: "NEW_BOOKING",
      title: "New Appointment Booked!",
      message: `A new spa appointment has been booked for ${bk.startTime} on ${bk.date.toDateString()}.`,
      link: `/dashboard/bookings/${bk.id}`,
      isRead: i < 6,
      createdAt: d(2025, 8 + (i % 5), 2 + i),
    });
  }

  for (let i = 0; i < Math.min(biz1Cancelled.length, 3); i++) {
    await create({
      userId: o1.id,
      type: "BOOKING_CANCELLED",
      title: "Booking Cancelled",
      message:
        "A customer has cancelled their spa appointment. The time slot is now open for rebooking.",
      link: "/dashboard/bookings",
      isRead: i < 2,
      createdAt: d(2025, 11 + (i % 2), 6 + i),
    });
  }

  await create({
    userId: o1.id,
    type: "REVIEW_RECEIVED",
    title: "New 5-Star Review!",
    message:
      "A customer left you a glowing 5-star review! Your team's hard work is being recognized.",
    link: "/dashboard/reviews",
    isRead: true,
    createdAt: d(2025, 10, 5),
  });
  await create({
    userId: o1.id,
    type: "REVIEW_RECEIVED",
    title: "New Review Received",
    message:
      "A customer rated you 3 stars and mentioned room for improvement. Check it out and consider responding.",
    link: "/dashboard/reviews",
    isRead: true,
    createdAt: d(2025, 12, 18),
  });
  await create({
    userId: o1.id,
    type: "REVIEW_RECEIVED",
    title: "New 2-Star Review — Respond Soon",
    message:
      "A customer left a 2-star review. A thoughtful response can demonstrate your commitment to quality.",
    link: "/dashboard/reviews",
    isRead: false,
    createdAt: d(2026, 3, 22),
  });
  await create({
    userId: o1.id,
    type: "PAYOUT_PROCESSED",
    title: "Payout Processed!",
    message:
      "Your payout of ETB 89,500 for August 2025 has been processed and deposited to your account.",
    link: "/dashboard/payouts",
    isRead: true,
    createdAt: d(2025, 9, 1),
  });
  await create({
    userId: o1.id,
    type: "PAYOUT_PROCESSED",
    title: "Payout Processed!",
    message:
      "Your Q1 2026 payout of ETB 112,000 is currently processing. Expected arrival: 2 business days.",
    link: "/dashboard/payouts",
    isRead: false,
    createdAt: d(2026, 2, 1),
  });
  await create({
    userId: o1.id,
    type: "BOOKING_RESCHEDULED",
    title: "Booking Rescheduled",
    message:
      "A couples massage appointment has been rescheduled by the customer. Please check your updated calendar.",
    link: "/dashboard/bookings",
    isRead: true,
    createdAt: d(2026, 1, 9),
  });
  await create({
    userId: o1.id,
    type: "OVERDUE_BOOKING",
    title: "Overdue Booking — Action Required",
    message:
      "A past appointment needs to be marked complete or no-show. Please update your records.",
    link: "/dashboard/bookings",
    isRead: false,
    createdAt: d(2026, 5, 18),
  });
  await create({
    userId: o1.id,
    type: "BOOKING_EXPIRING_SOON",
    title: "Unpaid Booking Expiring Soon",
    message:
      "A booking payment has been pending for over 23 hours and will expire in 1 hour if not completed.",
    link: "/dashboard/bookings",
    isRead: false,
    createdAt: d(2026, 4, 8),
  });

  // ── Demo business owner 2 — Mehari Gebrehiwet (Tigray Fitness Hub) ────────
  const o2 = demoOwners[2];
  const biz2Id = demoBizIds[2];
  const biz2Bookings = bookings.filter((b) => b.businessId === biz2Id);
  const biz2Confirmed = biz2Bookings.filter((b) => b.status === "CONFIRMED");
  const biz2Cancelled = biz2Bookings.filter((b) => b.status === "CANCELLED");

  for (let i = 0; i < Math.min(biz2Confirmed.length, 10); i++) {
    const bk = biz2Confirmed[i];
    await create({
      userId: o2.id,
      type: "NEW_BOOKING",
      title: "New Session Booked!",
      message: `A new fitness session has been booked for ${bk.startTime} on ${bk.date.toDateString()}.`,
      link: `/dashboard/bookings/${bk.id}`,
      isRead: i < 5,
      createdAt: d(2025, 8 + (i % 5), 1 + i),
    });
  }

  for (let i = 0; i < Math.min(biz2Cancelled.length, 3); i++) {
    await create({
      userId: o2.id,
      type: "BOOKING_CANCELLED",
      title: "Session Cancelled",
      message:
        "A customer has cancelled their fitness session. The equipment and trainer are now available.",
      link: "/dashboard/bookings",
      isRead: true,
      createdAt: d(2025, 10 + (i % 3), 9 + i),
    });
  }

  await create({
    userId: o2.id,
    type: "REVIEW_RECEIVED",
    title: "New 5-Star Review!",
    message:
      "A customer left an amazing 5-star review praising your coaching staff. Share the good news with your team!",
    link: "/dashboard/reviews",
    isRead: true,
    createdAt: d(2025, 9, 28),
  });
  await create({
    userId: o2.id,
    type: "REVIEW_RECEIVED",
    title: "New Review Received",
    message:
      "A new 4-star review mentions the equipment quality is excellent but classes fill up too fast.",
    link: "/dashboard/reviews",
    isRead: true,
    createdAt: d(2026, 1, 14),
  });
  await create({
    userId: o2.id,
    type: "REVIEW_RECEIVED",
    title: "1-Star Review — Respond Required",
    message:
      "A 1-star review has been posted. A prompt and professional response is highly recommended.",
    link: "/dashboard/reviews",
    isRead: false,
    createdAt: d(2026, 4, 30),
  });
  await create({
    userId: o2.id,
    type: "PAYOUT_PROCESSED",
    title: "Payout Processed!",
    message:
      "Your payout of ETB 54,000 for August 2025 has been processed and is on its way to your account.",
    link: "/dashboard/payouts",
    isRead: true,
    createdAt: d(2025, 9, 1),
  });
  await create({
    userId: o2.id,
    type: "PAYOUT_PROCESSED",
    title: "Payout Processed!",
    message:
      "Your Q1 2026 payout of ETB 76,500 is processing now. Funds arrive within 2 business days.",
    link: "/dashboard/payouts",
    isRead: false,
    createdAt: d(2026, 2, 1),
  });
  await create({
    userId: o2.id,
    type: "BOOKING_RESCHEDULED",
    title: "Session Rescheduled",
    message:
      "A personal training session has been rescheduled by the client. Your calendar has been updated.",
    link: "/dashboard/bookings",
    isRead: true,
    createdAt: d(2025, 12, 3),
  });
  await create({
    userId: o2.id,
    type: "OVERDUE_BOOKING",
    title: "Overdue Booking — Update Required",
    message:
      "Please mark a past session as complete or no-show to keep your records accurate.",
    link: "/dashboard/bookings",
    isRead: true,
    createdAt: d(2026, 3, 30),
  });
  await create({
    userId: o2.id,
    type: "BOOKING_EXPIRING_SOON",
    title: "Unpaid Booking Expiring Soon",
    message:
      "A CrossFit session booking has been unpaid for 23 hours. It will auto-cancel in 1 hour.",
    link: "/dashboard/bookings",
    isRead: false,
    createdAt: d(2026, 5, 7),
  });

  // ── Admin notifications ────────────────────────────────────────────────────
  for (const admin of admins) {
    await create({
      userId: admin.id,
      type: "NEW_BUSINESS",
      title: "New Business Registered",
      message:
        "A new business 'Habesha Cuts Barbershop' has registered on the platform. Review and approve their profile.",
      link: "/admin/businesses",
      isRead: true,
      createdAt: d(2025, 7, 3),
    });
    await create({
      userId: admin.id,
      type: "NEW_BUSINESS",
      title: "New Business Registered",
      message:
        "Axum Wellness Spa has completed registration and is pending verification.",
      link: "/admin/businesses",
      isRead: true,
      createdAt: d(2025, 7, 8),
    });
    await create({
      userId: admin.id,
      type: "NEW_BUSINESS",
      title: "New Business Registered",
      message:
        "A new fitness business 'Tigray Fitness Hub' has submitted their profile for approval.",
      link: "/admin/businesses",
      isRead: true,
      createdAt: d(2025, 7, 12),
    });
    await create({
      userId: admin.id,
      type: "NEW_BUSINESS",
      title: "New Business Registered",
      message:
        "Selam Beauty Salon has registered on the platform and is awaiting admin review.",
      link: "/admin/businesses",
      isRead: true,
      createdAt: d(2025, 7, 20),
    });
    await create({
      userId: admin.id,
      type: "NEW_BUSINESS",
      title: "New Business Registered",
      message:
        "Mekelle Dental Care has submitted their profile. Verify their credentials before activation.",
      link: "/admin/businesses",
      isRead: false,
      createdAt: d(2026, 5, 28),
    });
    await create({
      userId: admin.id,
      type: "PAYOUT_PENDING",
      title: "Payouts Ready for Processing",
      message:
        "15 businesses have accumulated commissions for the period of August 2025. Trigger payout to proceed.",
      link: "/admin/payouts",
      isRead: true,
      createdAt: d(2025, 9, 1),
    });
    await create({
      userId: admin.id,
      type: "PAYOUT_PENDING",
      title: "Monthly Payouts Ready",
      message:
        "22 businesses are ready for their September 2025 payout batch. Review and approve to release funds.",
      link: "/admin/payouts",
      isRead: true,
      createdAt: d(2025, 10, 1),
    });
    await create({
      userId: admin.id,
      type: "PAYOUT_PENDING",
      title: "Monthly Payouts Ready",
      message:
        "28 businesses have pending commissions for Q1 2026. Trigger batch payout when ready.",
      link: "/admin/payouts",
      isRead: false,
      createdAt: d(2026, 2, 1),
    });
    await create({
      userId: admin.id,
      type: "REFUND_ISSUED",
      title: "Refund Issued",
      message:
        "A refund of ETB 2,500 has been processed for a cancelled booking. Transaction reference: CHX-00234.",
      link: "/admin/payments",
      isRead: true,
      createdAt: d(2025, 11, 16),
    });
    await create({
      userId: admin.id,
      type: "REFUND_ISSUED",
      title: "Refund Issued",
      message:
        "A partial refund of ETB 900 was issued for a no-show booking at Axum Wellness Spa.",
      link: "/admin/payments",
      isRead: true,
      createdAt: d(2026, 1, 12),
    });
    await create({
      userId: admin.id,
      type: "REFUND_ISSUED",
      title: "Refund Issued",
      message:
        "ETB 3,500 refund issued for a cancelled luxury facial appointment. Review the payment audit trail.",
      link: "/admin/payments",
      isRead: false,
      createdAt: d(2026, 4, 18),
    });
  }

  // ── Regular customers — light coverage (2-5 notifications each) ────────────
  for (let i = 0; i < Math.min(regularCustomers.length, 50); i++) {
    const cust = regularCustomers[i];
    const custBookings = bookings.filter((b) => b.customerId === cust.id);
    const confirmed = custBookings.filter((b) => b.status === "CONFIRMED");
    const completed = custBookings.filter((b) => b.status === "COMPLETED");

    if (confirmed.length > 0) {
      await create({
        userId: cust.id,
        type: "BOOKING_CONFIRMED",
        title: "Booking Confirmed!",
        message: `Your appointment has been confirmed for ${confirmed[0].date.toDateString()} at ${confirmed[0].startTime}.`,
        link: `/bookings/${confirmed[0].id}`,
        isRead: i % 2 === 0,
        createdAt: d(2025, 8 + (i % 5), 2 + (i % 15)),
      });
    }

    if (completed.length > 0) {
      await create({
        userId: cust.id,
        type: "REVIEW_REQUEST",
        title: "How was your visit?",
        message:
          "We hope you enjoyed your recent appointment! Leave a quick review to help other customers.",
        link: "/bookings",
        isRead: i % 3 === 0,
        createdAt: d(2025, 9 + (i % 4), 5 + (i % 10)),
      });
    }

    if (i % 8 === 0 && custBookings.some((b) => b.status === "CANCELLED")) {
      await create({
        userId: cust.id,
        type: "PAYMENT_REFUNDED",
        title: "Refund Processed",
        message:
          "Your refund has been processed successfully. Thank you for your patience.",
        link: "/bookings",
        isRead: i % 2 === 0,
        createdAt: d(2025, 10 + (i % 3), 12 + (i % 8)),
      });
    }
  }

  // ── Regular business owners — light coverage (2-4 notifications each) ──────
  for (let i = 0; i < Math.min(regularOwners.length, 30); i++) {
    const owner = regularOwners[i];
    const ownerBiz = businesses.find((b) => b.ownerId === owner.id);
    if (!ownerBiz) continue;

    const bizBookings = bookings.filter((b) => b.businessId === ownerBiz.id);
    const confirmed = bizBookings.filter((b) => b.status === "CONFIRMED");

    if (confirmed.length > 0) {
      await create({
        userId: owner.id,
        type: "NEW_BOOKING",
        title: "New Appointment Booked!",
        message: `A new booking has arrived for ${confirmed[0].date.toDateString()} at ${confirmed[0].startTime}. Check your schedule.`,
        link: "/dashboard/bookings",
        isRead: i % 2 === 0,
        createdAt: d(2025, 8 + (i % 5), 3 + (i % 12)),
      });
    }

    if (i % 4 === 0) {
      await create({
        userId: owner.id,
        type: "REVIEW_RECEIVED",
        title: "New Review Received!",
        message:
          "A customer just left a review for your business. Check it out and consider leaving a reply!",
        link: "/dashboard/reviews",
        isRead: i % 3 === 0,
        createdAt: d(2025, 9 + (i % 4), 8 + (i % 10)),
      });
    }

    if (i % 6 === 0) {
      await create({
        userId: owner.id,
        type: "PAYOUT_PROCESSED",
        title: "Payout Processed!",
        message:
          "Your monthly payout has been processed. Check your dashboard for the full breakdown.",
        link: "/dashboard/payouts",
        isRead: i % 2 === 0,
        createdAt: d(2025, 10 + (i % 3), 1),
      });
    }
  }

  console.log(`✅ Created ${count} notifications.\n`);
}
