import Link from "next/link";

import { getAdminUsers } from "@/lib/actions/admin-queries";
import { activateUser, suspendUser } from "@/lib/actions/admin";
import { ConfirmActionForm } from "@/components/shared/confirm-action-form";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface AdminUsersPageProps {
  searchParams: Promise<{
    search?: string;
    role?: "CUSTOMER" | "BUSINESS_OWNER" | "ADMIN";
    status?: "ACTIVE" | "SUSPENDED";
  }>;
}

export const metadata = { title: "Admin Users" };

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const params = await searchParams;
  const users = await getAdminUsers(params);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
        <p className="text-muted-foreground">
          Manage platform users, account statuses, and role visibility.
        </p>
      </div>

      <form className="grid gap-3 rounded-lg border p-4 md:grid-cols-4">
        <Input
          name="search"
          placeholder="Search name or email"
          defaultValue={params.search}
        />
        <select
          name="role"
          defaultValue={params.role ?? ""}
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">All roles</option>
          <option value="CUSTOMER">Customer</option>
          <option value="BUSINESS_OWNER">Business owner</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
        <button
          type="submit"
          className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Apply filters
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isActive = !!user.emailVerified;
              return (
                <tr key={user.id} className="border-t">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="font-medium hover:underline"
                    >
                      {user.name ?? "Unnamed User"}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{user.role}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={isActive ? "default" : "secondary"}>
                      {isActive ? "ACTIVE" : "SUSPENDED"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {user.business ? (
                      <Link
                        href={`/admin/businesses/${user.business.id}`}
                        className="hover:underline"
                      >
                        {user.business.name}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isActive ? (
                      <ConfirmActionForm
                        action={suspendUser.bind(null, user.id)}
                        confirmMessage={`Suspend ${user.email}?`}
                        label="Suspend"
                        variant="destructive"
                      />
                    ) : (
                      <ConfirmActionForm
                        action={activateUser.bind(null, user.id)}
                        confirmMessage={`Activate ${user.email}?`}
                        label="Activate"
                        variant="default"
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
