/**
 * @file Cancel Booking Button
 * @description Thin client component that owns cancel dialog state for
 * the booking detail page. Shows a reschedule suggestion inside the
 * cancel dialog when reschedules are still available.
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { updateBookingStatus } from "@/lib/actions/booking";
import { canCancelForFree } from "@/lib/booking-utils";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { RescheduleDialog } from "@/components/shared/reschedule-dialog";

interface CancelBookingButtonProps {
  bookingId: string;
  /** Props forwarded to RescheduleDialog if customer opts to reschedule instead */
  businessId: string;
  serviceId: string;
  staffId: string | null;
  currentDate: string;
  currentStartTime: string;
  currentEndTime: string;
  serviceName: string;
  businessName: string;
  rescheduleCount: number;
  bookingStatus: string;
  /** ISO date string of the booking date — for cancellation window check */
  bookingDate: string;
  startTime: string;
  isPaid: boolean;
  canReschedule: boolean;
}

export function CancelBookingButton({
  bookingId,
  businessId,
  serviceId,
  staffId,
  currentDate,
  currentStartTime,
  currentEndTime,
  serviceName,
  businessName,
  rescheduleCount,
  bookingDate,
  startTime,
  canReschedule,
}: CancelBookingButtonProps) {
  const router = useRouter();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isFreeCancel = canCancelForFree(new Date(bookingDate), startTime);

  function handleCancel() {
    startTransition(async () => {
      const result = await updateBookingStatus({
        bookingId,
        status: "CANCELLED",
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(result.success ?? "Booking cancelled.");
      setCancelOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button
        variant="destructive"
        className="w-full"
        onClick={() => setCancelOpen(true)}
      >
        Cancel Booking
      </Button>

      {/* Cancel confirmation dialog */}
      <ConfirmationDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel this appointment?"
        description={
          isFreeCancel
            ? "This appointment will be cancelled. You are cancelling more than 24 hours in advance — no fee will be charged."
            : "Warning: this appointment is within 24 hours. A cancellation fee may apply."
        }
        confirmText="Yes, Cancel Appointment"
        cancelText="Keep Appointment"
        onConfirm={handleCancel}
        destructive
        isLoading={isPending}
      >
        {/* Reschedule suggestion — shown when reschedules are still available */}
        {canReschedule && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-sm font-medium text-blue-900">
              Did you know you can reschedule instead?
            </p>
            <p className="mt-1 text-xs text-blue-700">
              You have {2 - rescheduleCount} reschedule
              {2 - rescheduleCount === 1 ? "" : "s"} remaining. Rescheduling
              keeps your booking active and avoids losing your slot.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 border-blue-300 text-blue-700 hover:bg-blue-100"
              onClick={() => {
                setCancelOpen(false);
                setRescheduleOpen(true);
              }}
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Reschedule Instead
            </Button>
          </div>
        )}
      </ConfirmationDialog>

      {/* Reschedule dialog — opened from within cancel dialog suggestion */}
      <RescheduleDialog
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        booking={{
          id: bookingId,
          businessId,
          serviceId,
          staffId,
          currentDate,
          currentStartTime,
          currentEndTime,
          serviceName,
          businessName,
          rescheduleCount,
        }}
      />
    </>
  );
}
