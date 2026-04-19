/**
 * @file Confirm Action Form Component
 * @description A client-side form component that prompts for confirmation
 * before executing a server action. Optionally collects a reason field.
 *
 * Supports two modes:
 *   - Simple mode: confirm button only (e.g., activate, mark processing)
 *   - Reason mode: includes a required text field for admin reason input
 *     (e.g., suspend user/business — the reason is emailed to the user)
 */

"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/** Props accepted by the ConfirmActionForm component. */
interface ConfirmActionFormProps {
  /**
   * The server action to execute on confirmation.
   * If `requiresReason` is true, receives the reason string as argument.
   */
  action: (reason?: string) => Promise<{ success?: string; error?: string }>;
  /** Dialog title shown to the admin. */
  title: string;
  /** Dialog description / warning message. */
  description: string;
  /** Button label text. */
  label: string;
  /** shadcn Button variant for the trigger button. */
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
  /** Button size. */
  size?: "sm" | "default" | "lg" | "icon";
  /**
   * When true, renders a Textarea field in the dialog.
   * The admin must enter a reason before confirming.
   * The reason is passed to the action and included in notification emails.
   */
  requiresReason?: boolean;
  /** Placeholder text for the reason textarea. */
  reasonPlaceholder?: string;
}

export function ConfirmActionForm({
  action,
  title,
  description,
  label,
  variant = "outline",
  size = "sm",
  requiresReason = false,
  reasonPlaceholder = "Provide a reason for this action...",
}: ConfirmActionFormProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  /** Validate and execute the action. */
  function handleConfirm() {
    if (requiresReason && reason.trim().length < 10) {
      toast.error("Please provide a reason of at least 10 characters.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await action(requiresReason ? reason.trim() : undefined);

        if (result.error) {
          toast.error(result.error);
        } else if (result.success) {
          toast.success(result.success);
          setOpen(false);
          setReason("");
        }
      } catch {
        toast.error("Something went wrong. Please try again.");
      }
    });
  }

  /** Reset state when dialog closes. */
  function handleOpenChange(next: boolean) {
    if (!isPending) {
      setOpen(next);
      if (!next) setReason("");
    }
  }

  const isReasonValid = !requiresReason || reason.trim().length >= 10;

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size}>
          {label}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {/* Reason field — rendered only when requiresReason is true */}
        {requiresReason && (
          <div className="space-y-2 py-2">
            <Label htmlFor="action-reason" className="text-sm font-medium">
              Reason{" "}
              <span className="text-muted-foreground font-normal">
                (required — will be sent to the user)
              </span>
            </Label>
            <Textarea
              id="action-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={reasonPlaceholder}
              className="min-h-[100px] resize-none"
              disabled={isPending}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {reason.trim().length}/500 characters
              {reason.trim().length > 0 && reason.trim().length < 10 && (
                <span className="ml-2 text-destructive">
                  (minimum 10 characters)
                </span>
              )}
            </p>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isPending || !isReasonValid}
            className={
              variant === "destructive"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : undefined
            }
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              label
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
