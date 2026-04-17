/**
 * @file Email Preferences Component
 * @description UI for managing notification email settings.
 *
 * Displays three toggle switches for optional email types:
 *   - Booking reminders (24h before appointment)
 *   - Review requests (after completed appointment)
 *   - Marketing emails (promotions and updates)
 *
 * Transactional emails (confirmations, receipts, cancellations) are
 * always sent and are shown as locked/disabled to communicate this.
 *
 * Used on the profile page (/profile).
 */

"use client";

import { useState } from "react";
import { Bell, Star, Megaphone, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { updateEmailPreferences } from "@/lib/actions/profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import type { EmailPreferences } from "@/lib/email-utils";

/** Props accepted by the EmailPreferences component. */
interface EmailPreferencesProps {
  /** Current preferences loaded server-side. */
  initialPreferences: EmailPreferences;
}

/** Shape of a preference row configuration. */
interface PreferenceRow {
  key: keyof EmailPreferences;
  label: string;
  description: string;
  icon: typeof Bell;
  optional: true;
}

/** Shape of a locked (non-optional) row configuration. */
interface LockedRow {
  label: string;
  description: string;
  icon: typeof Bell;
  optional: false;
}

/** Configuration for each email preference row. */
const PREFERENCE_ROWS: PreferenceRow[] = [
  {
    key: "bookingReminders",
    label: "Appointment Reminders",
    description: "Receive a reminder email 24 hours before your appointment.",
    icon: Bell,
    optional: true,
  },
  {
    key: "reviewRequests",
    label: "Review Requests",
    description:
      "Receive an email asking for feedback after a completed appointment.",
    icon: Star,
    optional: true,
  },
  {
    key: "marketingEmails",
    label: "Marketing Emails",
    description: "Receive promotions, new feature announcements, and updates.",
    icon: Megaphone,
    optional: true,
  },
];

/** Non-optional email types displayed as informational locked rows. */
const LOCKED_ROWS: LockedRow[] = [
  {
    label: "Booking Confirmations",
    description: "Sent immediately when you create a booking. Always enabled.",
    icon: Lock,
    optional: false,
  },
  {
    label: "Payment Receipts",
    description: "Sent after a successful payment. Always enabled.",
    icon: Lock,
    optional: false,
  },
  {
    label: "Cancellation Notices",
    description:
      "Sent when a booking is cancelled by you or the business. Always enabled.",
    icon: Lock,
    optional: false,
  },
];

export function EmailPreferences({
  initialPreferences,
}: EmailPreferencesProps) {
  const [preferences, setPreferences] =
    useState<EmailPreferences>(initialPreferences);
  const [loadingKey, setLoadingKey] = useState<keyof EmailPreferences | null>(
    null
  );

  /**
   * Toggle a single preference and persist to the database.
   * Uses optimistic updates — the UI updates immediately, then we
   * call the server. If the server fails, we revert.
   */
  async function handleToggle(key: keyof EmailPreferences) {
    const previousValue = preferences[key];
    const newValue = !previousValue;

    // Optimistic update
    setPreferences((prev) => ({ ...prev, [key]: newValue }));
    setLoadingKey(key);

    try {
      const result = await updateEmailPreferences({ [key]: newValue });

      if (result.error) {
        // Revert on failure
        setPreferences((prev) => ({ ...prev, [key]: previousValue }));
        toast.error(result.error);
      } else if (result.success) {
        toast.success(result.success);
      }
    } catch {
      // Revert on error
      setPreferences((prev) => ({ ...prev, [key]: previousValue }));
      toast.error("Failed to update preference. Please try again.");
    } finally {
      setLoadingKey(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Email Notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-0">
        {/* Optional preference rows */}
        {PREFERENCE_ROWS.map((row, index) => {
          const Icon = row.icon;
          const isLoading = loadingKey === row.key;
          const value = preferences[row.key];

          return (
            <div key={row.key}>
              {index > 0 && <Separator />}
              <div className="flex items-start justify-between gap-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{row.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isLoading && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  )}
                  <Switch
                    checked={value}
                    onCheckedChange={() => handleToggle(row.key)}
                    disabled={isLoading}
                    aria-label={`Toggle ${row.label}`}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {/* Separator between optional and locked */}
        <Separator />
        <p className="py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Always Enabled (Transactional)
        </p>

        {/* Locked rows — informational only */}
        {LOCKED_ROWS.map((row, index) => {
          return (
            <div key={row.label}>
              {index > 0 && <Separator />}
              <div className="flex items-start justify-between gap-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/50">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground/60" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {row.label}
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      {row.description}
                    </p>
                  </div>
                </div>
                {/* Locked switch — always on, non-interactive */}
                <Switch
                  checked={true}
                  disabled={true}
                  aria-label={`${row.label} — always enabled`}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
