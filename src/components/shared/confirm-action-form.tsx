/**
 * @file Confirm Action Form Component
 * @description A client-side form component that prompts for confirmation
 * before executing a server action. Optionally collects a reason field.
 *
 * Architecture note:
 *   Server actions marked with "use server" CAN be passed as props to
 *   Client Components — Next.js serializes them as references. However,
 *   arrow function wrappers around server actions CANNOT cross the boundary.
 *
 *   To avoid this, this component accepts the server action and entity ID
 *   as separate props and binds them internally using .bind(), which
 *   Next.js supports for server actions.
 *
 * Usage patterns:
 *
 *   Simple action (no entity ID, no reason):
 *   <ConfirmActionForm
 *     action={setPayoutProcessing}
 *     entityId={payoutId}
 *     ...
 *   />
 *
 *   Action with reason (suspend user/business):
 *   <ConfirmActionForm
 *     action={suspendUser}
 *     entityId={userId}
 *     requiresReason
 *     ...
 *   />
 *
 *   Action with no entity ID:
 *   <ConfirmActionForm
 *     action={flagReview}
 *     entityId={reviewId}
 *     ...
 *   />
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

/** Standard result type returned by all admin server actions. */
type ActionResult = { success?: string; error?: string };

/**
 * A server action that accepts an entity ID and optionally a reason string.
 *
 * Supported signatures:
 *   - (entityId: string) => Promise<ActionResult>
 *   - (entityId: string, reason: string) => Promise<ActionResult>
 *   - () => Promise<ActionResult>  (when entityId is not needed)
 */
type ServerAction =
  | ((entityId: string, reason: string) => Promise<ActionResult>)
  | ((entityId: string) => Promise<ActionResult>)
  | (() => Promise<ActionResult>);

/** Props accepted by the ConfirmActionForm component. */
interface ConfirmActionFormProps {
  /**
   * The server action to call on confirmation.
   * Must be imported from a "use server" file directly — do NOT wrap it
   * in an arrow function before passing, as that breaks serialization.
   */
  action: ServerAction;
  /**
   * The primary entity ID passed as the first argument to the action.
   * Pass an empty string if the action takes no arguments.
   */
  entityId: string;
  /** Dialog title shown to the admin. */
  title: string;
  /** Dialog description / warning message. */
  description: string;
  /** Trigger button label. */
  label: string;
  /** shadcn Button variant for the trigger button. */
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
  /** Button size. */
  size?: "sm" | "default" | "lg" | "icon";
  /**
   * When true, renders a Textarea in the dialog.
   * The admin must enter a reason before confirming.
   * The reason is passed as the second argument to the action.
   */
  requiresReason?: boolean;
  /** Placeholder text for the reason textarea. */
  reasonPlaceholder?: string;
}

export function ConfirmActionForm({
  action,
  entityId,
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

  /** Execute the action with the correct arguments. */
  function handleConfirm() {
    if (requiresReason && reason.trim().length < 10) {
      toast.error("Please provide a reason of at least 10 characters.");
      return;
    }

    startTransition(async () => {
      try {
        let result: ActionResult;

        if (requiresReason) {
          // Action signature: (entityId, reason) => Promise<ActionResult>
          result = await (
            action as (id: string, reason: string) => Promise<ActionResult>
          )(entityId, reason.trim());
        } else if (entityId) {
          // Action signature: (entityId) => Promise<ActionResult>
          result = await (action as (id: string) => Promise<ActionResult>)(
            entityId
          );
        } else {
          // Action signature: () => Promise<ActionResult>
          result = await (action as () => Promise<ActionResult>)();
        }

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

        {/* Reason textarea — only rendered when requiresReason is true */}
        {requiresReason && (
          <div className="space-y-2 py-2">
            <Label htmlFor="action-reason" className="text-sm font-medium">
              Reason{" "}
              <span className="font-normal text-muted-foreground">
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
