/**
 * @file Dashboard Availability Page
 * @description Weekly schedule and availability management.
 *
 * Fetches existing business hours from the database and passes them
 * to the AvailabilityForm component for editing. If no hours exist,
 * the form shows sensible defaults (weekdays 9-5, weekends closed).
 *
 * URL: /dashboard/availability
 */

import {
  requireBusiness,
  getBusinessHours,
} from "@/lib/actions/business-queries";
import { AvailabilityForm } from "@/components/forms/availability-form";

export const metadata = {
  title: "Availability",
};

export default async function DashboardAvailabilityPage() {
  // Ensure business exist
  await requireBusiness();

  // Fetch existing business hours
  const hours = await getBusinessHours();

  /**
   * Serialize business hours for the client component.
   * The Prisma model is already simple strings and booleans
   * so minimal transformation is needed.
   */
  const serializedHours = hours.map((h) => ({
    dayOfWeek: h.dayOfWeek,
    openTime: h.openTime,
    closeTime: h.closeTime,
    isClosed: h.isClosed,
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Availability</h2>
        <p className="text-muted-foreground">
          Set your weekly operating hours. Customers can only book appointments
          during your open hours.
        </p>
      </div>

      <AvailabilityForm existingHours={serializedHours} />
    </div>
  );
}
