/**
 * @file Dashboard Bookings Page
 * @description Incoming booking management for business owners.
 *
 * URL: /dashboard/bookings
 */

export const metadata = {
  title: "Bookings",
};

export default function DashboardBookingsPage() {
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
