/**
 * @file Notification Query Functions
 * @description Server-side data fetching for the notification bell component.
 *
 * These are NOT server actions (they don't mutate data).
 * They are plain async functions called by Server Components (layouts)
 * to pass notification data down as props.
 *
 * Called from:
 *   - src/app/dashboard/layout.tsx  → passes to DashboardHeader
 *   - src/app/admin/layout.tsx      → passes to AdminHeader
 *   - src/components/layouts/main-navbar.tsx (server component, calls directly)
 */

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// =============================================================================
// Types
// =============================================================================

/** Serialized notification shape safe for passing to client components. */
export interface SerializedNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  /** ISO string — Dates cannot cross the server/client boundary directly. */
  createdAt: string;
}

// =============================================================================
// Query Functions
// =============================================================================

/**
 * Returns the number of unread notifications for the current user.
 *
 * Used to drive the badge count on the notification bell icon.
 * Returns 0 if the user is not authenticated.
 *
 * @returns Unread notification count
 */
export async function getUnreadNotificationCount(): Promise<number> {
  const user = await getCurrentUser();
  if (!user) return 0;

  return db.notification.count({
    where: {
      userId: user.id,
      isRead: false,
    },
  });
}

/**
 * Fetches recent notifications for the current user.
 *
 * Returns notifications ordered newest-first. Unread notifications are
 * shown with a visual indicator in the notification dropdown.
 *
 * Dates are serialized to ISO strings so the data is safe to pass
 * from Server Components to Client Components as props.
 *
 * @param limit - Maximum number of notifications to return (default: 20)
 * @returns Array of serialized notifications, newest first
 */
export async function getNotifications(
  limit = 20
): Promise<SerializedNotification[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      type: true,
      title: true,
      message: true,
      link: true,
      isRead: true,
      createdAt: true,
    },
  });

  return notifications.map((n) => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
  }));
}
