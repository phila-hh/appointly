/**
 * @file Dashboard Availability Page
 * @description Weekly schedule and availability management.
 *
 * URL: /dashboard/availability
 */

import { requireBusiness } from "@/lib/actions/business-queries";

export const metadata = {
  title: "Availability",
};

export default async function DashboardAvailabilityPage() {
  await requireBusiness();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Availability</h2>
        <p className="text-muted-foreground">
          Set your weekly operating hours and manage your schedule.
        </p>
      </div>
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        Availability management coming soon...
      </div>
    </div>
  );
}
