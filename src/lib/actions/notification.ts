/**
 * @file Notification Server Actions
 * @description Server-side functions for creating and managing in-app
 * notifications.
 *
 * Architecture:
 *   - createNotification() is an internal helper — NOT exported as a
 *     "use server" action. It is called directly by other server actions
 *     (booking.ts, payment.ts, review.ts, etc.) within the same process.
 *   - markNotificationRead(), markAllNotificationsRead(), and
 *     deleteNotification() ARE exported server actions — they are called
 *     from client components (the notification bell dropdown).
 *
 * Notification types (kept as string constants, not a Prisma enum, for
 * forward compatibility — new types can be added without a migration):
 *
 *   Customer:
 *     BOOKING_CONFIRMED      — payment succeeded, booking is confirmed
 *     BOOKING_CANCELLED      — booking was cancelled (by either party)
 *     BOOKING_RESCHEDULED    — booking was moved to a new date/time
 *     PAYMENT_REFUNDED       — refund has been processed
 *     REVIEW_REPLY           — business owner replied to their review
 *     REVIEW_REQUEST         — nudge to leave a review after completion
 *
 *   Business owner:
 *     NEW_BOOKING            — a new appointment has been booked
 *     BOOKING_CANCELLED      — a customer/system cancelled a paid booking
 *     BOOKING_EXPIRING_SOON  — a booking expiry warning for unpaid booking
 *     BOOKING_RESCHEDULED    — a customer rescheduled their appointment
 *     REVIEW_RECEIVED        — a customer left a review
 *     PAYOUT_PROCESSED       — a payout batch has been generated
 *     OVERDUE_BOOKING        — past appointment not yet marked complete
 *
 *   Admin:
 *     NEW_BUSINESS           — a new business profile was created
 *     PAYOUT_PENDING         — commissions are ready for payout
 *     REFUND_ISSUED          — a refund was processed on the platform
 */

"use server";

import { revalidatePath } from "next/cache";

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// =============================================================================
// Types
// =============================================================================

/** Valid notification type values. */
export type NotificationType =
  // Customer notifications
  | "BOOKING_CONFIRMED"
  | "BOOKING_CANCELLED"
  | "BOOKING_EXPIRING_SOON"
  | "BOOKING_RESCHEDULED"
  | "PAYMENT_REFUNDED"
  | "REVIEW_REPLY"
  | "REVIEW_REQUEST"
  // Business owner notifications
  | "NEW_BOOKING"
  | "REVIEW_RECEIVED"
  | "PAYOUT_PROCESSED"
  | "OVERDUE_BOOKING"
  // Admin notifications
  | "NEW_BUSINESS"
  | "PAYOUT_PENDING"
  | "REFUND_ISSUED";

/** Parameters for creating a notification. */
interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  /** Optional deep-link. User is navigated here when clicking the item. */
  link?: string;
}

/** Standard result type for notification actions. */
type ActionResult = {
  success?: string;
  error?: string;
};

// =============================================================================
// Internal Helper (NOT a server action — called by other server actions)
// =============================================================================

/**
 * Creates a single in-app notification for a user.
 *
 * This is an internal helper function. It is called by other server
 * actions (booking, payment, review, etc.) — never directly from a
 * client component.
 *
 * Failures are caught and logged but never re-thrown — a notification
 * failure must never block the primary operation (e.g., creating a booking).
 *
 * @param params - Notification data
 */
export async function createNotification(
  params: CreateNotificationParams
): Promise<void> {
  try {
    await db.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link ?? null,
        isRead: false,
      },
    });
  } catch (error) {
    // Non-fatal — log and continue. Notification failure must never
    // propagate to break the calling action.
    console.error("createNotification error:", error);
  }
}

// =============================================================================
// Client-Callable Server Actions
// =============================================================================

/**
 * Marks a single notification as read.
 *
 * Only marks the notification if it belongs to the current user —
 * prevents users from marking other users' notifications as read.
 *
 * @param notificationId - The notification to mark as read
 * @returns Object with `success` or `error`
 */
export async function markNotificationRead(
  notificationId: string
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Please sign in." };

    // Verify ownership before updating — updateMany with userId filter
    // is safer than findUnique + update (avoids a TOCTOU race condition)
    const result = await db.notification.updateMany({
      where: {
        id: notificationId,
        userId: user.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    if (result.count === 0) {
      // Either not found, wrong owner, or already read — all safe outcomes
      return { success: "Notification updated." };
    }

    revalidatePath("/", "layout");

    return { success: "Notification marked as read." };
  } catch (error) {
    console.error("markNotificationRead error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

/**
 * Marks all of the current user's unread notifications as read.
 *
 * @returns Object with `success` or `error`
 */
export async function markAllNotificationsRead(): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Please sign in." };

    await db.notification.updateMany({
      where: {
        userId: user.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    revalidatePath("/", "layout");

    return { success: "All notifications marked as read." };
  } catch (error) {
    console.error("markAllNotificationsRead error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

/**
 * Deletes a single notification.
 *
 * Only deletes the notification if it belongs to the current user.
 *
 * @param notificationId - The notification to delete
 * @returns Object with `success` or `error`
 */
export async function deleteNotification(
  notificationId: string
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Please sign in." };

    // deleteMany with userId filter is ownership-safe
    await db.notification.deleteMany({
      where: {
        id: notificationId,
        userId: user.id,
      },
    });

    revalidatePath("/", "layout");

    return { success: "Notification removed." };
  } catch (error) {
    console.error("deleteNotification error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}
