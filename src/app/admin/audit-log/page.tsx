import { format } from "date-fns";

import { getAdminAuditLogs } from "@/lib/actions/admin-queries";

export const metadata = { title: "Audit Log" };

export default async function AdminAuditLogPage() {
  const logs = await getAdminAuditLogs();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Admin Audit Log</h2>
        <p className="text-muted-foreground">
          Immutable event trail of admin-level actions.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Admin</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Entity</th>
              <th className="px-4 py-3">Metadata</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t align-top">
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {format(log.createdAt, "PPP p")}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">
                    {log.admin.name ?? "Unknown Admin"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {log.admin.email}
                  </p>
                </td>
                <td className="px-4 py-3 font-medium">{log.action}</td>
                <td className="px-4 py-3 text-xs">
                  <p>{log.entityType}</p>
                  <p className="text-muted-foreground">{log.entityId ?? "-"}</p>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {log.metadata ? JSON.stringify(log.metadata) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
