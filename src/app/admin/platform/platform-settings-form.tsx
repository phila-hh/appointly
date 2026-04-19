/**
 * @file Platform Settings Form
 * @description Client component for editing platform settings.
 * Renders an editable form pre-filled with current settings.
 * Calls the updatePlatformSettings server action on submit.
 */

"use client";

import { useState } from "react";
import { Loader2, Settings } from "lucide-react";
import { toast } from "sonner";

import { updatePlatformSettings } from "@/lib/actions/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PlatformSettingsFormProps {
  currentCommissionRate: number;
  currentPayoutSchedule: "MONTHLY" | "WEEKLY" | "BIWEEKLY";
}

export function PlatformSettingsForm({
  currentCommissionRate,
  currentPayoutSchedule,
}: PlatformSettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [rate, setRate] = useState(currentCommissionRate.toString());
  const [schedule, setSchedule] = useState(currentPayoutSchedule);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const parsedRate = parseFloat(rate);

      if (isNaN(parsedRate) || parsedRate < 0 || parsedRate > 100) {
        toast.error("Commission rate must be between 0 and 100.");
        return;
      }

      const result = await updatePlatformSettings(parsedRate, schedule);

      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(result.success);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings className="h-4 w-4" />
          Commission & Payout Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Commission rate */}
          <div className="space-y-2">
            <Label htmlFor="commissionRate">Default Commission Rate (%)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="commissionRate"
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                disabled={isLoading}
                className="w-32"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              The percentage Appointly retains from each completed booking.
              Business owners receive the remainder.
            </p>
          </div>

          <Separator />

          {/* Payout schedule */}
          <div className="space-y-2">
            <Label htmlFor="payoutSchedule">Payout Schedule</Label>
            <Select
              value={schedule}
              onValueChange={(val) =>
                setSchedule(val as "MONTHLY" | "WEEKLY" | "BIWEEKLY")
              }
              disabled={isLoading}
            >
              <SelectTrigger className="w-48" id="payoutSchedule">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
                <SelectItem value="BIWEEKLY">
                  Biweekly (every 2 weeks)
                </SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              How frequently business owners receive payout batches.
            </p>
          </div>

          <Separator />

          {/* Submit */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
