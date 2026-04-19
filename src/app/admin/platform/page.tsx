/**
 * @file Admin Platform Settings Page
 * @description Central configuration page for platform-wide settings.
 *
 * Features:
 *   - View and edit default commission rate (as a percentage)
 *   - View and edit payout schedule (Monthly / Weekly / Biweekly)
 *   - All changes are logged in the admin audit trail
 *   - Form validates input before calling the server action
 *
 * URL: /admin/platform
 */

import { requireAdmin } from "@/lib/guards";
import db from "@/lib/db";
import { PlatformSettingsForm } from "./platform-settings-form";

export const metadata = { title: "Platform Settings" };

export default async function AdminPlatformPage() {
  await requireAdmin();

  const settings = await db.platformSettings.findFirst();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Platform Settings</h2>
        <p className="text-muted-foreground">
          Manage commission rates and payout schedules. All changes are logged
          in the audit trail.
        </p>
      </div>

      <div className="max-w-xl">
        <PlatformSettingsForm
          currentCommissionRate={Math.round(
            (settings?.defaultCommissionRate ?? 0.1) * 100
          )}
          currentPayoutSchedule={
            (settings?.payoutSchedule as "MONTHLY" | "WEEKLY" | "BIWEEKLY") ??
            "MONTHLY"
          }
        />
      </div>
    </div>
  );
}
