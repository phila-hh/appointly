/**
 * @file Dashboard Settings Page
 * @description Business profile and account settings.
 *
 * URL: /dashboard/settings
 */

export const metadata = {
  title: "Settings",
};

export default function DashboardSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your business profile and account settings.
        </p>
      </div>
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        Settings coming soon...
      </div>
    </div>
  );
}
