/**
 * @file Reschedule Dialog Trigger
 * @description Thin client component that owns the RescheduleDialog open state
 * for the booking detail page. Keeps the parent Server Component clean.
 */

"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RescheduleDialog } from "@/components/shared/reschedule-dialog";

interface RescheduleDialogTriggerProps {
  booking: {
    id: string;
    businessId: string;
    serviceId: string;
    staffId: string | null;
    currentDate: string;
    currentStartTime: string;
    currentEndTime: string;
    serviceName: string;
    businessName: string;
    rescheduleCount: number;
  };
}

export function RescheduleDialogTrigger({
  booking,
}: RescheduleDialogTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Reschedule
      </Button>

      <RescheduleDialog open={open} onOpenChange={setOpen} booking={booking} />
    </>
  );
}
