import Link from "next/link";
import { format } from "date-fns";

import { getAdminUserDetail } from "@/lib/actions/admin-queries";
import { activateUser, suspendUser } from "@/lib/actions/admin";
import { ConfirmActionForm } from "@/components/shared/confirm-action-form";
import { Badge } from "@/components/ui/badge";

interface AdminUserDetailPageProps {
  params: Promise<{ userId: string }>;
}

export const metadata = { title: "User Detail" };

export default async function AdminUserDetailPage({
  params,
}: AdminUserDetailPageProps) {
  const { userId } = await params;
  const user = await getAdminUserDetail(userId);
  const isActive = !!user.emailVerified;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {user.name ?? "Unnamed User"}
          </h2>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        {isActive ? (
          <ConfirmActionForm
            action={suspendUser.bind(null, user.id)}
            confirmMessage={`Suspend ${user.email}?`}
            label="Suspend user"
            variant="destructive"
          />
        ) : (
          <ConfirmActionForm
            action={activateUser.bind(null, user.id)}
            confirmMessage={`Activate ${user.email}?`}
            label="Activate user"
          />
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Role</p>
          <p className="mt-1">
            <Badge variant="outline">{user.role}</Badge>
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Status</p>
          <p className="mt-1">
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? "ACTIVE" : "SUSPENDED"}
            </Badge>
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Joined</p>
          <p className="mt-1 font-medium">{format(user.createdAt, "PPP")}</p>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h3 className="font-semibold">User Activity</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <p className="text-sm">
            Bookings:{" "}
            <span className="font-medium">{user._count.bookings}</span>
          </p>
          <p className="text-sm">
            Reviews: <span className="font-medium">{user._count.reviews}</span>
          </p>
          <p className="text-sm">
            Favorites:{" "}
            <span className="font-medium">{user._count.favorites}</span>
          </p>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h3 className="font-semibold">Business Profile</h3>
        {user.business ? (
          <div className="mt-3 space-y-2 text-sm">
            <p>
              Name: <span className="font-medium">{user.business.name}</span>
            </p>
            <p>
              Status:{" "}
              <span className="font-medium">
                {user.business.isActive ? "ACTIVE" : "SUSPENDED"}
              </span>
            </p>
            <p>
              Services:{" "}
              <span className="font-medium">
                {user.business._count.services}
              </span>
            </p>
            <p>
              Bookings:{" "}
              <span className="font-medium">
                {user.business._count.bookings}
              </span>
            </p>
            <Link
              href={`/admin/businesses/${user.business.id}`}
              className="inline-block text-primary hover:underline"
            >
              View business detail
            </Link>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            No business profile linked.
          </p>
        )}
      </div>
    </div>
  );
}
