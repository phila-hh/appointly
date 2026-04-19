/**
 * @file Mark Payout Paid Form
 * @description Client component for the "Mark as Paid" form on the
 * payout detail page. Collects a required reference number and
 * optional admin notes before calling markPayoutPaid.
 */

"use client";

import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { markPayoutPaid } from "@/lib/actions/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface MarkPayoutPaidFormProps {
  payoutId: string;
}

export function MarkPayoutPaidForm({ payoutId }: MarkPayoutPaidFormProps) {
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!reference.trim()) {
      toast.error("Reference number is required.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await markPayoutPaid(
        payoutId,
        reference.trim(),
        notes.trim() || undefined
      );

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
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="payout-reference">
          Transfer Reference <span className="text-destructive">*</span>
        </Label>
        <Input
          id="payout-reference"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="e.g., TXN-2025-001 or CBE-REF-123456"
          disabled={isLoading}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="payout-notes">
          Notes{" "}
          <span className="text-xs text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="payout-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional notes about this transfer..."
          disabled={isLoading}
          rows={2}
          className="resize-none"
        />
      </div>

      <Button
        type="submit"
        disabled={isLoading || !reference.trim()}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Marking as Paid...
          </>
        ) : (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Confirm Payment
          </>
        )}
      </Button>
    </form>
  );
}
