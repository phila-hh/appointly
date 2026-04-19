/**
 * @file Admin Businesses Page
 * @description Platform business management with search and status filtering.
 *
 * Features:
 *   - Search by business name, city, or owner email (URL-based, SSR)
 *   - Filter by status (ACTIVE, SUSPENDED)
 *   - Suspend/activate with required reason and confirmation dialog
 *   - Link to business detail page
 *   - Stats preview (services, bookings, reviews)
 *
 * URL: /admin/businesses?search=...&status=...
 */

import Link from "next/link";
import { format } from "date-fns";
import { Store } from "lucide-react";

import { getAdminBusinesses } from "@/lib/actions/admin-queries";
import { suspendBusiness, activateBusiness } from "@/lib/actions/admin";
import { ConfirmActionForm } from "@/components/shared/confirm-action-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { BUSINESS_CATEGORIES } from "@/constants";

interface AdminBusinessesPageProps {
  searchParams: Promise<{
    search?: string;
    status?: "ACTIVE" | "SUSPENDED";
  }>;
}

export const metadata = { title: "Businesses" };

export default async function AdminBusinessesPage({
  searchParams,
}: AdminBusinessesPageProps) {
  const params = await searchParams;
  const businesses = await getAdminBusinesses(params);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Business Management
        </h2>
        <p className="text-muted-foreground">
          Manage business listings, visibility, and owner accounts.
        </p>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <Input
            name="search"
            placeholder="Search name, city, or owner email..."
            defaultValue={params.search}
          />
        </div>

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
        {businesses.length}{" "}
        {businesses.length === 1 ? "business" : "businesses"} found
      </p>

      {/* Businesses table */}
      {businesses.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Stats</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {businesses.map((business) => (
                <TableRow key={business.id}>
                  <TableCell>
                    <div>
                      <Link
                        href={`/admin/businesses/${business.id}`}
                        className="font-medium hover:underline"
                      >
                        {business.name}
                      </Link>
                      {business.city && (
                        <p className="text-xs text-muted-foreground">
                          {business.city}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {BUSINESS_CATEGORIES[business.category] ??
                        business.category}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div>
                      <p className="text-sm">
                        {business.owner.name ?? "Unnamed"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {business.owner.email}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={business.isActive ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {business.isActive ? "Active" : "Suspended"}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-0.5 text-xs text-muted-foreground">
                      <p>{business._count.services} services</p>
                      <p>{business._count.bookings} bookings</p>
                      <p>{business._count.reviews} reviews</p>
                    </div>
                  </TableCell>

                  <TableCell className="text-sm text-muted-foreground">
                    {format(business.createdAt, "MMM d, yyyy")}
                  </TableCell>

                  <TableCell className="text-right">
                    {business.isActive ? (
                      <ConfirmActionForm
                        action={(reason) =>
                          suspendBusiness(business.id, reason ?? "")
                        }
                        title="Suspend Business"
                        description={`Suspend "${business.name}"? It will be hidden from public listings and the owner will be notified.`}
                        label="Suspend"
                        variant="destructive"
                        requiresReason
                        reasonPlaceholder="Explain why this business is being suspended. This will be included in the notification email to the owner."
                      />
                    ) : (
                      <ConfirmActionForm
                        action={() => activateBusiness(business.id)}
                        title="Activate Business"
                        description={`Reactivate "${business.name}"? It will become visible in public listings again.`}
                        label="Activate"
                        variant="outline"
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Store className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No businesses found</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Try adjusting your search or filters.
          </p>
        </div>
      )}
    </div>
  );
}
