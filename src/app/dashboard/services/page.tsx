/**
 * @file Dashboard Services Page
 * @description Service catalogue management for business owners.
 *
 * URl: /dashboard/services
 */

export const metadata = {
  title: "Services",
};

export default function DashboardServicesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Services</h2>
        <p className="text-muted-foreground">
          Manage your service catalogue, pricing, and descriptions.
        </p>
      </div>
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        Service management coming soon...
      </div>
    </div>
  );
}
