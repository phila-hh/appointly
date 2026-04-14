import Link from "next/link";
import { format } from "date-fns";

import { getAdminBusinessDetail } from "@/lib/actions/admin-queries";
import { activateBusiness, suspendBusiness } from "@/lib/actions/admin";
import { ConfirmActionForm } from "@/components/shared/confirm-action-form";
import { Badge } from "@/components/ui/badge";

interface AdminBusinessDetailPageProps {
  params: Promise<{ businessId: string }>;
}

export const metadata = { title: "Business Detail" };

export default async function AdminBusinessDetailPage({
  params,
}: AdminBusinessDetailPageProps) {
  const { businessId } = await params;
  const business = await getAdminBusinessDetail(businessId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{business.name}</h2>
          <p className="text-muted-foreground">
            {business.city ?? "Unknown city"}
          </p>
        </div>
        {business.isActive ? (
          <ConfirmActionForm
            action={suspendBusiness.bind(null, business.id)}
            confirmMessage={`Suspend ${business.name}?`}
            label="Suspend business"
            variant="destructive"
          />
        ) : (
          <ConfirmActionForm
            action={activateBusiness.bind(null, business.id)}
            confirmMessage={`Activate ${business.name}?`}
            label="Activate business"
          />
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Status</p>
          <p className="mt-1">
            <Badge variant={business.isActive ? "default" : "secondary"}>
              {business.isActive ? "ACTIVE" : "SUSPENDED"}
            </Badge>
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Services</p>
          <p className="mt-1 font-semibold">{business._count.services}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Bookings</p>
          <p className="mt-1 font-semibold">{business._count.bookings}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Reviews</p>
          <p className="mt-1 font-semibold">{business._count.reviews}</p>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h3 className="font-semibold">Owner</h3>
        <p className="mt-2 text-sm">{business.owner.name ?? "Unnamed Owner"}</p>
        <p className="text-sm text-muted-foreground">{business.owner.email}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Owner since {format(business.owner.createdAt, "PPP")}
        </p>
        <Link
          href={`/admin/users/${business.owner.id}`}
          className="mt-2 inline-block text-sm text-primary hover:underline"
        >
          View owner detail
        </Link>
      </div>

      <div className="rounded-lg border p-4">
        <h3 className="font-semibold">Services</h3>
        <div className="mt-3 space-y-2">
          {business.services.length > 0 ? (
            business.services.map((service) => (
              <div key={service.id} className="rounded-md border p-3 text-sm">
                <p className="font-medium">{service.name}</p>
                <p className="text-muted-foreground">
                  ETB {Number(service.price).toLocaleString()} •{" "}
                  {service.duration} min
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No services found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
