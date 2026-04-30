/**
 * @file Announcement Form Component
 * @description Dashboard form for setting or clearing a business announcement.
 *
 * The announcement is displayed as a banner on the public business page.
 *
 * UX states:
 *   - No announcement: textarea placeholder + optional expiry + "Post" button
 *   - Active announcement: current text pre-filled + expiry info + "Update"
 *     button + "Remove Announcement" button
 *
 * Expiry behaviour:
 *   - Leave expiry blank → permanent (shown until manually removed)
 *   - Set a future date → auto-hides after that date on the public page
 *
 * This is a Client Component because it manages form state and calls
 * the updateAnnouncement server action.
 */

"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Megaphone, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { updateAnnouncement } from "@/lib/actions/business";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// =============================================================================
// Types
// =============================================================================

interface AnnouncementFormProps {
  /** Current announcement text — null means no active announcement. */
  currentAnnouncement: string | null;
  /** Current expiry date — null means permanent. */
  currentExpiresAt: Date | null;
}

// =============================================================================
// Component
// =============================================================================

export function AnnouncementForm({
  currentAnnouncement,
  currentExpiresAt,
}: AnnouncementFormProps) {
  const [isPending, startTransition] = useTransition();

  const hasAnnouncement = !!currentAnnouncement;

  // Form field state — pre-filled with existing values
  const [text, setText] = useState(currentAnnouncement ?? "");
  const [expiryDate, setExpiryDate] = useState(
    currentExpiresAt ? format(currentExpiresAt, "yyyy-MM-dd") : ""
  );

  const charCount = text.length;
  const isOverLimit = charCount > 500;

  // ==========================================================================
  // Handlers
  // ==========================================================================

  function handleSave() {
    if (isOverLimit) return;

    startTransition(async () => {
      const result = await updateAnnouncement({
        announcement: text.trim(),
        announcementExpiresAt: expiryDate || "",
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(result.success ?? "Announcement updated.");
    });
  }

  function handleRemove() {
    startTransition(async () => {
      const result = await updateAnnouncement({
        announcement: "",
        announcementExpiresAt: "",
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Announcement removed.");
      setText("");
      setExpiryDate("");
    });
  }

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Business Announcement</CardTitle>
          {hasAnnouncement && (
            <Badge
              variant="outline"
              className="border-green-200 bg-green-50 text-green-700"
            >
              Active
            </Badge>
          )}
        </div>
        <CardDescription>
          Post a short announcement that appears as a banner on your public
          business page. Use it for promotions, holiday hours, or important
          notices.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* ---------------------------------------------------------------- */}
        {/* Current announcement preview                                     */}
        {/* ---------------------------------------------------------------- */}
        {hasAnnouncement && (
          <>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="mb-1 text-xs font-medium text-amber-800">
                Currently showing on your business page
                {currentExpiresAt && (
                  <span className="ml-1 font-normal">
                    · expires {format(currentExpiresAt, "MMM d, yyyy")}
                  </span>
                )}
                {!currentExpiresAt && (
                  <span className="ml-1 font-normal">· no expiry set</span>
                )}
              </p>
              <p className="text-sm text-amber-900">{currentAnnouncement}</p>
            </div>
            <Separator />
          </>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Announcement textarea                                            */}
        {/* ---------------------------------------------------------------- */}
        <div className="space-y-2">
          <Label htmlFor="announcement-text" className="text-sm font-medium">
            {hasAnnouncement ? "Update announcement" : "Announcement text"}
          </Label>
          <Textarea
            id="announcement-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. We're open on public holidays! Book your slot now..."
            className="min-h-[100px] resize-none"
            disabled={isPending}
            maxLength={550}
          />
          <p
            className={
              isOverLimit
                ? "text-xs text-destructive"
                : "text-xs text-muted-foreground"
            }
          >
            {charCount}/500 characters
            {isOverLimit && " — announcement is too long"}
          </p>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Expiry date picker                                               */}
        {/* ---------------------------------------------------------------- */}
        <div className="space-y-2">
          <Label htmlFor="announcement-expiry" className="text-sm font-medium">
            Expiry date{" "}
            <span className="font-normal text-muted-foreground">
              (optional — leave blank for permanent)
            </span>
          </Label>
          <Input
            id="announcement-expiry"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            min={format(new Date(), "yyyy-MM-dd")}
            disabled={isPending}
            className="w-full sm:w-48"
          />
          {expiryDate && (
            <p className="text-xs text-muted-foreground">
              Announcement will stop showing after{" "}
              <span className="font-medium">
                {format(new Date(expiryDate), "MMMM d, yyyy")}
              </span>
              .
            </p>
          )}
          {!expiryDate && (
            <p className="text-xs text-muted-foreground">
              No expiry set — announcement will show until you remove it.
            </p>
          )}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Action buttons                                                   */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={
              isPending ||
              isOverLimit ||
              text.trim() === "" ||
              (text.trim() === currentAnnouncement &&
                expiryDate ===
                  (currentExpiresAt
                    ? format(currentExpiresAt, "yyyy-MM-dd")
                    : ""))
            }
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : hasAnnouncement ? (
              "Update Announcement"
            ) : (
              "Post Announcement"
            )}
          </Button>

          {/* Remove — only shown when an announcement exists */}
          {hasAnnouncement && (
            <Button
              variant="outline"
              onClick={handleRemove}
              disabled={isPending}
              className="text-destructive hover:border-destructive/50 hover:bg-destructive/5 hover:text-destructive"
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <X className="mr-2 h-4 w-4" />
              )}
              Remove Announcement
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
