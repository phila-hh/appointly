/**
 * @file Notification Bell Component
 * @description Displays a bell icon with an unread count badge. Clicking
 * opens a Popover panel listing recent notifications with mark-as-read
 * and delete actions.
 *
 * Architecture:
 *   - Server components (layouts) fetch unreadCount and notifications,
 *     pass them as props. This avoids client-side fetching on every render.
 *   - The component is a Client Component because it manages the popover
 *     open state and calls server actions on interaction.
 *   - After any mutation (mark read, delete), router.refresh() triggers
 *     the parent layout to re-fetch counts — no polling needed.
 *
 * Notification type → icon mapping:
 *   NEW_BOOKING           → CalendarPlus   (blue)
 *   BOOKING_CONFIRMED     → CheckCircle2   (green)
 *   BOOKING_CANCELLED     → XCircle        (red)
 *   BOOKING_EXPIRING_SOON → Clock          (amber)
 *   BOOKING_RESCHEDULED   → RefreshCw      (orange)
 *   PAYMENT_REFUNDED      → Banknote       (green)
 *   REVIEW_RECEIVED       → Star           (yellow)
 *   REVIEW_REPLY          → MessageSquare  (blue)
 *   REVIEW_REQUEST        → Star           (yellow)
 *   OVERDUE_BOOKING       → AlertTriangle  (orange)
 *   PAYOUT_PROCESSED      → Wallet         (green)
 *   PAYOUT_PENDING        → Wallet         (blue)
 *   NEW_BUSINESS          → Building2      (blue)
 *   REFUND_ISSUED         → ReceiptText    (orange)
 *   default               → Bell           (gray)
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  CalendarPlus,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Banknote,
  Star,
  MessageSquare,
  AlertTriangle,
  Wallet,
  Building2,
  ReceiptText,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "@/lib/actions/notification";
import type { SerializedNotification } from "@/lib/actions/notification-queries";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// =============================================================================
// Types
// =============================================================================

interface NotificationBellProps {
  /** Unread count fetched server-side by the parent layout. */
  unreadCount: number;
  /** Recent notifications fetched server-side by the parent layout. */
  notifications: SerializedNotification[];
}

// =============================================================================
// Notification type → icon + color config
// =============================================================================

interface NotificationIconConfig {
  icon: React.ElementType;
  className: string;
}

const NOTIFICATION_ICON_CONFIG: Record<string, NotificationIconConfig> = {
  NEW_BOOKING: {
    icon: CalendarPlus,
    className: "text-blue-600 bg-blue-50",
  },
  BOOKING_CONFIRMED: {
    icon: CheckCircle2,
    className: "text-green-600 bg-green-50",
  },
  BOOKING_CANCELLED: {
    icon: XCircle,
    className: "text-red-600 bg-red-50",
  },
  BOOKING_EXPIRING_SOON: {
    icon: Clock,
    className: "text-amber-600 bg-amber-50",
  },
  BOOKING_RESCHEDULED: {
    icon: RefreshCw,
    className: "text-orange-600 bg-orange-50",
  },
  PAYMENT_REFUNDED: {
    icon: Banknote,
    className: "text-green-600 bg-green-50",
  },
  REVIEW_RECEIVED: {
    icon: Star,
    className: "text-yellow-600 bg-yellow-50",
  },
  REVIEW_REPLY: {
    icon: MessageSquare,
    className: "text-blue-600 bg-blue-50",
  },
  REVIEW_REQUEST: {
    icon: Star,
    className: "text-yellow-600 bg-yellow-50",
  },
  OVERDUE_BOOKING: {
    icon: AlertTriangle,
    className: "text-orange-600 bg-orange-50",
  },
  PAYOUT_PROCESSED: {
    icon: Wallet,
    className: "text-green-600 bg-green-50",
  },
  PAYOUT_PENDING: {
    icon: Wallet,
    className: "text-blue-600 bg-blue-50",
  },
  NEW_BUSINESS: {
    icon: Building2,
    className: "text-blue-600 bg-blue-50",
  },
  REFUND_ISSUED: {
    icon: ReceiptText,
    className: "text-orange-600 bg-orange-50",
  },
};

/** Fallback config for unknown notification types. */
const DEFAULT_ICON_CONFIG: NotificationIconConfig = {
  icon: Bell,
  className: "text-gray-600 bg-gray-100",
};

function getIconConfig(type: string): NotificationIconConfig {
  return NOTIFICATION_ICON_CONFIG[type] ?? DEFAULT_ICON_CONFIG;
}

// =============================================================================
// Sub-components
// =============================================================================

interface NotificationItemProps {
  notification: SerializedNotification;
  onRead: (id: string, link: string | null) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

/**
 * A single notification row in the dropdown panel.
 * Clicking the row marks it as read and navigates to its link.
 * The trash icon deletes it without navigation.
 */
function NotificationItem({
  notification,
  onRead,
  onDelete,
  isDeleting,
}: NotificationItemProps) {
  const config = getIconConfig(notification.type);
  const Icon = config.icon;

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
  });

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-lg p-3 transition-colors",
        "hover:bg-accent",
        !notification.isRead && "bg-blue-50/50 dark:bg-blue-950/20"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          config.className
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      {/* Content — clicking navigates and marks as read */}
      <button
        className="min-w-0 flex-1 text-left"
        onClick={() => onRead(notification.id, notification.link)}
      >
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm leading-snug",
              !notification.isRead
                ? "font-semibold text-foreground"
                : "font-medium text-foreground"
            )}
          >
            {notification.title}
          </p>
          {/* Unread blue dot */}
          {!notification.isRead && (
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
          )}
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
          {notification.message}
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">{timeAgo}</p>
      </button>

      {/* Delete button — only visible on hover */}
      <button
        className={cn(
          "mt-0.5 shrink-0 rounded p-1 text-muted-foreground/50 opacity-0 transition-opacity",
          "hover:bg-destructive/10 hover:text-destructive",
          "group-hover:opacity-100",
          isDeleting && "cursor-not-allowed opacity-50"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onDelete(notification.id);
        }}
        disabled={isDeleting}
        aria-label="Delete notification"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function NotificationBell({
  unreadCount,
  notifications,
}: NotificationBellProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  /**
   * Clamp badge display at 9+ to avoid wide badges on small icon buttons.
   * Matches the convention used by Gmail, Slack, Booksy.
   */
  const badgeLabel = unreadCount > 9 ? "9+" : unreadCount.toString();
  const hasBadge = unreadCount > 0;

  /** Mark a notification as read and navigate to its link. */
  function handleRead(notificationId: string, link: string | null) {
    startTransition(async () => {
      await markNotificationRead(notificationId);
      router.refresh();

      if (link) {
        setOpen(false);
        router.push(link);
      }
    });
  }

  /** Mark all notifications as read. */
  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }

  /** Delete a single notification. */
  function handleDelete(notificationId: string) {
    setDeletingId(notificationId);
    startTransition(async () => {
      await deleteNotification(notificationId);
      router.refresh();
      setDeletingId(null);
    });
  }

  const hasUnread = unreadCount > 0;
  const isEmpty = notifications.length === 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* ------------------------------------------------------------------ */}
      {/* Trigger — Bell icon with unread badge                               */}
      {/* ------------------------------------------------------------------ */}
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label={
            hasBadge
              ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
              : "Notifications"
          }
        >
          <Bell className="h-5 w-5" />

          {/* Badge — only rendered when there are unread notifications */}
          {hasBadge && (
            <span
              className={cn(
                "absolute -right-0.5 -top-0.5 flex items-center justify-center",
                "rounded-full bg-red-500 text-white",
                "font-semibold leading-none",
                unreadCount > 9
                  ? "h-4 min-w-4 px-1 text-[9px]"
                  : "h-4 w-4 text-[10px]"
              )}
              aria-hidden="true"
            >
              {badgeLabel}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      {/* ------------------------------------------------------------------ */}
      {/* Popover panel                                                        */}
      {/* ------------------------------------------------------------------ */}
      <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
        {/* Panel header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {hasBadge && (
              <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">
                {unreadCount} new
              </span>
            )}
          </div>

          {/* Mark all read — only shown when there are unread items */}
          {hasUnread && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllRead}
              disabled={isPending}
            >
              Mark all read
            </Button>
          )}
        </div>

        <Separator />

        {/* Notification list */}
        {isEmpty ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Bell className="mb-3 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">
              No notifications
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              You&apos;re all caught up!
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="p-2">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={handleRead}
                  onDelete={handleDelete}
                  isDeleting={deletingId === notification.id && isPending}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
