/**
 * @file Admin Audit Log Page
 * @description Immutable trail of all admin actions on the platform.
 *
 * Features:
 *   - Filter by action type (free-text match)
 *   - Filter by entity type (USER, BUSINESS, REVIEW, FINANCE, PLATFORM_SETTINGS)
 *   - Timestamped entries with admin name and email
 *   - Action displayed as human-readable label
 *   - Entity type and ID linkable to the related record
 *   - Metadata displayed as formatted JSON
 *   - Color-coded action badges by severity
 *   - Empty state
 *
 * URL: /admin/audit-log?search=...&entityType=...
 */

import Link from "next/link";
import { format } from "date-fns";
import { ScrollText } from "lucide-react";

import { requireAdmin } from "@/lib/guards";
import db from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdminAuditLogPageProps {
  searchParams: Promise<{
    search?: string;
    entityType?: string;
  }>;
}

export const metadata = { title: "Audit Log" };

/**
 * Maps action strings to badge color classes.
 * Groups actions by severity/type for visual scanning.
 */
function getActionBadgeClass(action: string): string {
  if (
    action.includes("SUSPEND") ||
    action.includes("REMOVE") ||
    action.includes("FAILED")
  ) {
    return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300";
  }
  if (
    action.includes("ACTIVATE") ||
    action.includes("PAID") ||
    action.includes("GENERATE")
  ) {
    return "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300";
  }
  if (
    action.includes("FLAG") ||
    action.includes("PROCESSING") ||
    action.includes("UPDATE")
  ) {
    return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300";
  }
  return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900 dark:text-gray-300";
}

/**
 * Converts a SCREAMING_SNAKE_CASE action string to a human-readable label.
 * e.g. "SUSPEND_USER" → "Suspend User"
 */
function formatAction(action: string): string {
  return action
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Returns a link to the related admin page for a given entity type and ID.
 */
function getEntityLink(
  entityType: string,
  entityId: string | null
): string | null {
  if (!entityId) return null;
  switch (entityType) {
    case "USER":
      return `/admin/users/${entityId}`;
    case "BUSINESS":
      return `/admin/businesses/${entityId}`;
    case "FINANCE":
      return `/admin/finance/payouts/${entityId}`;
    default:
      return null;
  }
}

/** Valid entity type filter options. */
const ENTITY_TYPES = [
  "USER",
  "BUSINESS",
  "REVIEW",
  "FINANCE",
  "PLATFORM_SETTINGS",
];

export default async function AdminAuditLogPage({
  searchParams,
}: AdminAuditLogPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const searchTerm = params.search?.trim().toLowerCase();
  const entityTypeFilter = params.entityType;

  // Fetch audit logs with optional entity type filter
  const logs = await db.adminAuditLog.findMany({
    where: {
      ...(entityTypeFilter && entityTypeFilter !== "ALL"
        ? { entityType: entityTypeFilter }
        : {}),
    },
    take: 200,
    include: {
      admin: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Apply text search client-side (action and admin name/email)
  const filteredLogs = searchTerm
    ? logs.filter(
        (log) =>
          log.action.toLowerCase().includes(searchTerm) ||
          (log.admin.name?.toLowerCase() ?? "").includes(searchTerm) ||
          log.admin.email.toLowerCase().includes(searchTerm) ||
          (log.entityId?.toLowerCase() ?? "").includes(searchTerm)
      )
    : logs;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Admin Audit Log</h2>
        <p className="text-muted-foreground">
          Immutable, chronological trail of all admin actions. Last 200 entries
          shown.
        </p>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <Input
            name="search"
            placeholder="Search action, admin name, or entity ID..."
            defaultValue={params.search}
          />
        </div>

        <Select name="entityType" defaultValue={params.entityType ?? "ALL"}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All entity types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Entity Types</SelectItem>
            {ENTITY_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type.charAt(0) + type.slice(1).replace("_", " ").toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button type="submit">Apply Filters</Button>
      </form>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {filteredLogs.length} entr{filteredLogs.length !== 1 ? "ies" : "y"}{" "}
        {filteredLogs.length !== logs.length &&
          `(filtered from ${logs.length})`}
      </p>

      {/* Audit log table */}
      {filteredLogs.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[160px]">Timestamp</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead className="w-[240px]">Metadata</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => {
                const entityLink = getEntityLink(log.entityType, log.entityId);

                return (
                  <TableRow key={log.id} className="align-top">
                    {/* Timestamp */}
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(log.createdAt, "MMM d, yyyy")}
                      <br />
                      {format(log.createdAt, "h:mm a")}
                    </TableCell>

                    {/* Admin */}
                    <TableCell>
                      <p className="text-sm font-medium">
                        {log.admin.name ?? "Unknown Admin"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {log.admin.email}
                      </p>
                    </TableCell>

                    {/* Action */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getActionBadgeClass(log.action)}`}
                      >
                        {formatAction(log.action)}
                      </Badge>
                    </TableCell>

                    {/* Entity type + ID */}
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="secondary" className="text-xs">
                          {log.entityType}
                        </Badge>
                        {log.entityId && (
                          <div>
                            {entityLink ? (
                              <Link
                                href={entityLink}
                                className="block truncate text-xs font-mono text-primary hover:underline max-w-[120px]"
                              >
                                {log.entityId}
                              </Link>
                            ) : (
                              <p className="truncate text-xs font-mono text-muted-foreground max-w-[120px]">
                                {log.entityId}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Metadata */}
                    <TableCell>
                      {log.metadata ? (
                        <pre className="max-h-[80px] overflow-y-auto rounded-md bg-muted p-2 text-[10px] leading-relaxed">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <ScrollText className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No audit entries found</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            No admin actions match the current filters, or no actions have been
            recorded yet.
          </p>
        </div>
      )}
    </div>
  );
}
