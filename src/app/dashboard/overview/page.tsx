/**
 * @file Dashboard Overview Page
 * @description Main dashboard page showing key business metrics.
 *
 * URL: /dashboard/overview
 */

export const metadata = {
  title: "Overview",
};

export default function DashboardOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Welcome back!</h2>
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
