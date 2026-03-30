/**
 * @file Dashboard Overview Page
 * @description Main dashboard page showing key business metrics.
 *
 * URL: /dashboard/overview
 */

import { requireBusiness } from "@/lib/actions/business-queries";

export const metadata = {
  title: "Overview",
};

export default async function DashboardOverviewPage() {
  const business = await requireBusiness();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Welcome back, {business.name}
        </h2>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your business performance.
        </p>
      </div>
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        Analytics and metrics coming soon...
      </div>
    </div>
  );
}
