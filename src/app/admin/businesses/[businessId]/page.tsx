/**
 * @file Admin Business Detail Page
 * @description Detailed view of a single business listing.
 *
 * Features:
 *   - Business info (name, category, city, description)
 *   - Owner details with link to user detail
 *   - Status KPI cards (services, bookings, reviews, favorites)
 *   - Services list with pricing
 *   - Business hours schedule
 *   - Suspend/activate action with required reason
 *
 * URL: /admin/businesses/[businessId]
 */

import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Scissors,
  CalendarDays,
  Star,
  Heart,
} from "lucide-react";

import { getAdminBusinessDetail } from "@/lib/actions/admin-queries";
import { suspendBusiness, activateBusiness } from "@/lib/actions/admin";
import { ConfirmActionForm } from "@/components/shared/confirm-action-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BUSINESS_CATEGORIES } from "@/constants";
import { formatPrice, formatDuration } from "@/lib/utils";

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
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/admin/businesses">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Businesses
        </Link>
      </Button>

      {/* Page header with action */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight">
              {business.name}
            </h2>
            <Badge variant="outline" className="text-xs">
              {BUSINESS_CATEGORIES[business.category] ?? business.category}
            </Badge>
          </div>
          {business.city && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{business.city}</span>
            </div>
          )}
          <Badge variant={business.isActive ? "default" : "secondary"}>
            {business.isActive ? "Active" : "Suspended"}
          </Badge>
        </div>

        {/* Action */}
        {business.isActive ? (
          <ConfirmActionForm
            action={suspendBusiness}
            entityId={business.id}
            title="Suspend Business"
            description={`Suspend "${business.name}"? It will be hidden from public listings.`}
            label="Suspend Business"
            variant="destructive"
            requiresReason
            reasonPlaceholder="Explain why this business is being suspended. This will be included in the notification email."
          />
        ) : (
          <ConfirmActionForm
            action={activateBusiness}
            entityId={business.id}
            title="Activate Business"
            description={`Reactivate "${business.name}"? It will become visible in public listings again.`}
            label="Activate Business"
            variant="outline"
          />
        )}
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Services",
            value: business._count.services,
            icon: Scissors,
          },
          {
            label: "Bookings",
            value: business._count.bookings,
            icon: CalendarDays,
          },
          {
            label: "Reviews",
            value: business._count.reviews,
            icon: Star,
          },
          {
            label: "Favorites",
            value: business._count.favorites,
            icon: Heart,
          },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <p className="text-2xl font-bold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Owner info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Business Owner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-semibold">
                {business.owner.name ?? "Unnamed Owner"}
              </p>
              <p className="text-sm text-muted-foreground">
                {business.owner.email}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Owner since {format(business.owner.createdAt, "MMMM d, yyyy")}
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/users/${business.owner.id}`}>
                View Owner Account
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Contact info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {business.address && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span>
                  {business.address}
                  {business.city && `, ${business.city}`}
                </span>
              </div>
            )}
            {business.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{business.phone}</span>
              </div>
            )}
            {business.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{business.email}</span>
              </div>
            )}
            {business.website && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline text-primary"
                >
                  {business.website}
                </a>
              </div>
            )}
            {!business.address &&
              !business.phone &&
              !business.email &&
              !business.website && (
                <p className="text-sm text-muted-foreground">
                  No contact information provided.
                </p>
              )}
          </CardContent>
        </Card>
      </div>

      {/* Services list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Scissors className="h-4 w-4" />
            Services ({business.services.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {business.services.length > 0 ? (
            <div className="space-y-3">
              {business.services.map((service, idx) => (
                <div key={service.id}>
                  {idx > 0 && <Separator className="mb-3" />}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{service.name}</p>
                      {service.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {service.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-sm shrink-0">
                      <p className="font-semibold">
                        {formatPrice(Number(service.price))}
                      </p>
                      <p className="text-muted-foreground">
                        {formatDuration(service.duration)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No services have been added yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Business hours */}
      {business.BusinessHours.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Business Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {business.BusinessHours.map((hours) => (
                <div
                  key={hours.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="capitalize font-medium">
                    {hours.dayOfWeek.charAt(0) +
                      hours.dayOfWeek.slice(1).toLowerCase()}
                  </span>
                  <span className="text-muted-foreground">
                    {hours.isClosed
                      ? "Closed"
                      : `${hours.openTime} – ${hours.closeTime}`}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* View on public page */}
      <div className="flex justify-end">
        <Button variant="outline" asChild>
          <Link
            href={`/business/${business.slug}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Public Page
          </Link>
        </Button>
      </div>
    </div>
  );
}
