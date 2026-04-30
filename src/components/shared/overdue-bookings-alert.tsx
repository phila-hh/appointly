/**
 * @file Overdue Bookings Alert Component
 * @description Dashboard banner shown when confirmed bookings have passed
 * their appointment date without being marked complete or no-show.
 *
 * Displayed at the top of the dashboard bookings page when overdue
 * bookings exist. Links directly to the confirmed filter so the business
 * owner can act on them immediately.
 *
 * This is a Server Component — no interactivity needed.
 */

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface OverdueBookingsAlertProps {
  /** Number of past confirmed bookings that have not been marked complete. */
  count: number;
}

export function OverdueBookingsAlert({ count }: OverdueBookingsAlertProps) {
  if (count === 0) return null;

  return (
    <Alert className="border-amber-200 bg-amber-50 text-amber-900">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-900">
        {count} overdue appointment{count === 1 ? "" : "s"}
      </AlertTitle>
      <AlertDescription className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-amber-800">
          {count === 1
            ? "1 confirmed appointment has passed without being marked complete or no-show."
            : `${count} confirmed appointments have passed without being marked complete or no-show.`}{" "}
          Please update these to keep your records accurate.
        </span>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
          asChild
        >
          <Link href="/dashboard/bookings?status=CONFIRMED">Review Now</Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
