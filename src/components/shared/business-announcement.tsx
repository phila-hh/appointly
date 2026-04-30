/**
 * @file Business Announcement Component
 * @description Displays the business owner's announcement as an amber banner
 * on the public business page, below the business header.
 *
 * Visibility rules (checked at render time in the Server Component parent):
 *   - Only rendered when announcement text is non-null and non-empty
 *   - Only rendered when announcementExpiresAt is null (permanent) OR
 *     announcementExpiresAt is in the future
 *
 * The expiry check happens in the parent page (business/[slug]/page.tsx)
 * before passing the announcement down — this component always shows
 * whatever it receives, so the parent is the single source of truth.
 *
 * This is a Server Component — no interactivity needed for display.
 */

import { format } from "date-fns";
import { Megaphone } from "lucide-react";

interface BusinessAnnouncementProps {
  announcement: string;
  /** When the announcement expires — null means permanent. */
  expiresAt: Date | null;
}

export function BusinessAnnouncement({
  announcement,
  expiresAt,
}: BusinessAnnouncementProps) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
      <div className="flex items-start gap-3">
        <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-amber-900">{announcement}</p>
          {expiresAt && (
            <p className="mt-1 text-xs text-amber-700">
              Valid until {format(expiresAt, "MMMM d, yyyy")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
