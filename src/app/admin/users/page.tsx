/**
 * @file Admin Users Page
 * @description Platform user management with search, role, and status filtering.
 *
 * Features:
 *   - Search by name or email (URL-based, SSR)
 *   - Filter by role (CUSTOMER, BUSINESS_OWNER, ADMIN)
 *   - Filter by status (ACTIVE, SUSPENDED)
 *   - Suspend/activate with confirmation dialog and required reason
 *   - Link to user detail page
 *   - Linked business name for BUSINESS_OWNER users
 *
 * URL: /admin/users?search=...&role=...&status=...
 */

import Link from "next/link";
import { format } from "date-fns";
import { UserX } from "lucide-react";

import { getAdminUsers } from "@/lib/actions/admin-queries";
import { suspendUser, activateUser } from "@/lib/actions/admin";
import { ConfirmActionForm } from "@/components/shared/confirm-action-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Card } from "@/components/ui/card";

interface AdminUsersPageProps {
  searchParams: Promise<{
    search?: string;
    role?: "CUSTOMER" | "BUSINESS_OWNER" | "ADMIN";
    status?: "ACTIVE" | "SUSPENDED";
  }>;
}

export const metadata = { title: "Users" };

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const params = await searchParams;
  const users = await getAdminUsers(params);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
        <p className="text-muted-foreground">
          Manage platform users, account statuses, and role visibility.
        </p>
      </div>

      {/* Filters — URL-based form (SSR) */}
      <form className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <Input
            name="search"
            placeholder="Search name or email..."
            defaultValue={params.search}
          />
        </div>

        <Select name="role" defaultValue={params.role ?? "ALL"}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Roles</SelectItem>
            <SelectItem value="CUSTOMER">Customer</SelectItem>
            <SelectItem value="BUSINESS_OWNER">Business Owner</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>

        <Select name="status" defaultValue={params.status ?? "ALL"}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
          </SelectContent>
        </Select>

        <Button type="submit">Apply Filters</Button>
      </form>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {users.length} user{users.length !== 1 ? "s" : ""} found
      </p>

      {/* Users table */}
      {users.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const isActive = !!user.emailVerified;

                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="font-medium hover:underline"
                        >
                          {user.name ?? "Unnamed User"}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {user.role.replace("_", " ")}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={isActive ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {isActive ? "Active" : "Suspended"}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {user.business ? (
                        <Link
                          href={`/admin/businesses/${user.business.id}`}
                          className="text-sm hover:underline"
                        >
                          {user.business.name}
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-sm text-muted-foreground">
                      {format(user.createdAt, "MMM d, yyyy")}
                    </TableCell>

                    <TableCell className="text-right">
                      {isActive ? (
                        <ConfirmActionForm
                          action={(reason) =>
                            suspendUser(user.id, reason ?? "")
                          }
                          title="Suspend User"
                          description={`Are you sure you want to suspend ${user.email}? They will be notified by email.`}
                          label="Suspend"
                          variant="destructive"
                          requiresReason
                          reasonPlaceholder="Explain why this account is being suspended. This will be included in the notification email."
                        />
                      ) : (
                        <ConfirmActionForm
                          action={() => activateUser(user.id)}
                          title="Reactivate User"
                          description={`Reactivate ${user.email}? They will regain full platform access.`}
                          label="Activate"
                          variant="outline"
                        />
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
          <UserX className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No users found</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Try adjusting your search or filters.
          </p>
        </div>
      )}
    </div>
  );
}
