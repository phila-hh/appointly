/**
 * @file Generate Payout Form
 * @description Client component for generating payout batches.
 * Extracts the interactive form from the server page component
 * so the page remains a Server Component.
 */

"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { generatePayoutsForPeriod } from "@/lib/actions/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function GeneratePayoutForm() {
  const [period, setPeriod] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!period.trim()) {
      toast.error("Please enter a period (e.g., 2025-06).");
      return;
    }

    setIsLoading(true);

    try {
      const result = await generatePayoutsForPeriod(period.trim());

      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(result.success);
        setPeriod("");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="payout-period">Payout Period</Label>
        <Input
          id="payout-period"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          placeholder="YYYY-MM (e.g., 2025-06)"
          className="w-[220px]"
          disabled={isLoading}
          pattern="\d{4}-(0[1-9]|1[0-2])"
          title="Format: YYYY-MM"
        />
      </div>
      <Button type="submit" disabled={isLoading || !period.trim()}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          "Generate Payouts"
        )}
      </Button>
    </form>
  );
}
