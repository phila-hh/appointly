/**
 * @file Dashboard Customer Page
 * @description Customer list and history for business owners.
 *
 * URL: /dashboard/customers
 */

export const metadata = {
  title: "Customers",
};

export default function DashboardCustomerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Customers</h2>
        <p className="text-muted-foreground">
          View customers who have booked your service.
        </p>
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          Customer management coming soon...
        </div>
      </div>
    </div>
  );
}
