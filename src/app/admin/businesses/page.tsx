import Link from "next/link";

import { getAdminBusinesses } from "@/lib/actions/admin-queries";
import { activateBusiness, suspendBusiness } from "@/lib/actions/admin";
import { ConfirmActionForm } from "@/components/shared/confirm-action-form";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface AdminBusinessesPageProps {
  searchParams: Promise<{ search?: string; status?: "ACTIVE" | "SUSPENDED" }>;
}

export const metadata = { title: "Admin Businesses" };

export default async function AdminBusinessesPage({
  searchParams,
}: AdminBusinessesPageProps) {
  const params = await searchParams;
  const businesses = await getAdminBusinesses(params);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Business Management
        </h2>
        <p className="text-muted-foreground">
          Manage business listings, visibility, and owner status.
        </p>
      </div>

      <form className="grid gap-3 rounded-lg border p-4 md:grid-cols-3">
        <Input
          name="search"
          placeholder="Search name, city, owner email"
          defaultValue={params.search}
        />
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
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Stats</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {businesses.map((business) => (
              <tr key={business.id} className="border-t">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/businesses/${business.id}`}
                    className="font-medium hover:underline"
                  >
                    {business.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {business.city ?? "Unknown city"}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <p>{business.owner.name ?? "Unnamed Owner"}</p>
                  <p className="text-xs text-muted-foreground">
                    {business.owner.email}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={business.isActive ? "default" : "secondary"}>
                    {business.isActive ? "ACTIVE" : "SUSPENDED"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  <p>{business._count.services} services</p>
                  <p>{business._count.bookings} bookings</p>
                  <p>{business._count.reviews} reviews</p>
                </td>
                <td className="px-4 py-3">
                  {business.isActive ? (
                    <ConfirmActionForm
                      action={suspendBusiness.bind(null, business.id)}
                      confirmMessage={`Suspend ${business.name}?`}
                      label="Suspend"
                      variant="destructive"
                    />
                  ) : (
                    <ConfirmActionForm
                      action={activateBusiness.bind(null, business.id)}
                      confirmMessage={`Activate ${business.name}?`}
                      label="Activate"
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
