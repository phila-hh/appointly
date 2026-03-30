/**
 * @file Dashboard Bookings Page
 * @description Incoming booking management for business owners.
 *
 * URL: /dashboard/bookings
 */

import { requireBusiness } from "@/lib/actions/business-queries";

export const metadata = {
  title: "Bookings",
};

export default async function DashboardBookingsPage() {
  await requireBusiness();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Bookings</h2>
        <p className="text-muted-foreground">
          View and manage your incoming appointment bookings.
        </p>
      </div>
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        Booking management coming soon...
      </div>
    </div>
  );
}
