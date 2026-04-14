import db from "@/lib/db";
import { requireAdmin } from "@/lib/guards";

export const metadata = { title: "Platform Settings" };

export default async function AdminPlatformPage() {
  await requireAdmin();
  const settings = await db.platformSettings.findFirst();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Platform Settings</h2>
        <p className="text-muted-foreground">
          Central settings for commission defaults and payout cadence.
        </p>
      </div>

      <div className="max-w-xl rounded-lg border p-4 text-sm">
        <p>
          Default commission rate:{" "}
          <span className="font-medium">
            {Math.round((settings?.defaultCommissionRate ?? 0.1) * 100)}%
          </span>
        </p>
        <p className="mt-2">
          Payout schedule:{" "}
          <span className="font-medium">
            {settings?.payoutSchedule ?? "MONTHLY"}
          </span>
        </p>
        <p className="mt-4 text-xs text-muted-foreground">
          Editable controls will be added in Phase 14B with finance workflows.
        </p>
      </div>
    </div>
  );
}
