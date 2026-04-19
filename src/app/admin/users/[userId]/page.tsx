/**
 * @file Admin User Detail Page
 * @description Detailed view of a single user account.
 *
 * Features:
 *   - User info (name, email, role, status, join date)
 *   - Activity summary (bookings, reviews, favorites)
 *   - Linked business profile (if BUSINESS_OWNER)
 *   - Suspend/activate action with reason
 *
 * URL: /admin/users/[userId]
 */

import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  Mail,
  CalendarDays,
  Star,
  Heart,
  Building2,
} from "lucide-react";

import { getAdminUserDetail } from "@/lib/actions/admin-queries";
import { suspendUser, activateUser } from "@/lib/actions/admin";
import { ConfirmActionForm } from "@/components/shared/confirm-action-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/admin/users">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Link>
      </Button>

      {/* Page header with action */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">
            {user.name ?? "Unnamed User"}
          </h2>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span className="text-sm">{user.email}</span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Badge variant="outline">{user.role.replace("_", " ")}</Badge>
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? "Active" : "Suspended"}
            </Badge>
          </div>
        </div>

        {/* Action */}
        {isActive ? (
          <ConfirmActionForm
            action={suspendUser}
            entityId={user.id}
            title="Suspend User"
            description={`Suspend ${user.email}? They will lose platform access and receive a notification email.`}
            label="Suspend User"
            variant="destructive"
            requiresReason
            reasonPlaceholder="Explain why this account is being suspended. This will be included in the notification email."
          />
        ) : (
          <ConfirmActionForm
            action={activateUser}
            entityId={user.id}
            title="Reactivate User"
            description={`Reactivate ${user.email}? They will regain full platform access.`}
            label="Activate User"
            variant="outline"
          />
        )}
      </div>

      {/* Info cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Joined
            </p>
            <p className="mt-1 font-semibold">
              {format(user.createdAt, "MMM d, yyyy")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Bookings
            </p>
            <div className="mt-1 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <p className="font-semibold">{user._count.bookings}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Reviews
            </p>
            <div className="mt-1 flex items-center gap-2">
              <Star className="h-4 w-4 text-muted-foreground" />
              <p className="font-semibold">{user._count.reviews}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Favorites
            </p>
            <div className="mt-1 flex items-center gap-2">
              <Heart className="h-4 w-4 text-muted-foreground" />
              <p className="font-semibold">{user._count.favorites}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business profile section */}
      {user.business && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              Business Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="font-semibold">{user.business.name}</p>
                <Badge
                  variant={user.business.isActive ? "default" : "secondary"}
                  className="text-xs"
                >
                  {user.business.isActive ? "Active" : "Suspended"}
                </Badge>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/businesses/${user.business.id}`}>
                  View Business Detail
                </Link>
              </Button>
            </div>

            <Separator />

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Services</p>
                <p className="font-medium">{user.business._count.services}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Bookings</p>
                <p className="font-medium">{user.business._count.bookings}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Reviews</p>
                <p className="font-medium">{user.business._count.reviews}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
