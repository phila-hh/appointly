/**
 * @file Dashboard Overview Page
 * @description Main dashboard page showing business summary info.
 * Displays a welcome message and a preview of business overview.
 *
 * URL: /dashboard/overview
 */

import Link from "next/link";
import { Clock, Scissors, Settings } from "lucide-react";

import {
  requireBusiness,
  getBusinessHours,
  getBusinessServices,
} from "@/lib/actions/business-queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScheduleDisplay } from "@/components/shared/schedule-display";
import { BUSINESS_CATEGORIES } from "@/constants";

export const metadata = {
  title: "Overview",
};

export default async function DashboardOverviewPage() {
  const business = await requireBusiness();
  const hours = await getBusinessHours();
  const services = await getBusinessServices();

  // Serialize hours for the display component
  const serializedHours = hours.map((h) => ({
    dayOfWeek: h.dayOfWeek,
    openTime: h.openTime,
    closeTime: h.closeTime,
    isClosed: h.isClosed,
  }));

  // Count active vs total services
  const activeServices = services.filter((s) => s.isActive).length;
  const totalServices = services.length;

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Welcome back, {business.name}!
        </h2>
        <p className="text-muted-foreground">
          {BUSINESS_CATEGORIES[business.category] ?? business.category} •{" "}
          {business.city
            ? `${business.city}, ${business.state}`
            : "Location not set"}
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Services card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Services
            </CardTitle>
            <Scissors className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeServices}</div>
            <p className="text-xs text-muted-foreground">
              {totalServices} total ({totalServices - activeServices} inactive)
            </p>
          </CardContent>
        </Card>

        {/* Bookings card — placeholder */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">Coming soon...</p>
          </CardContent>
        </Card>

        {/* Revenue card — placeholder */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">Coming soon...</p>
          </CardContent>
        </Card>
      </div>

      {/* Bottom section: Schedule + Quick links */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Business hours preview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Business Hours
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/availability">Edit</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {serializedHours.length > 0 ? (
              <ScheduleDisplay hours={serializedHours} />
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-3">
                  No business hours set yet.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/availability">Set Hours</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="h-4 w-4" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dashboard/services">
                <Scissors className="mr-2 h-4 w-4" />
                Manage Services ({totalServices})
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dashboard/availability">
                <Clock className="mr-2 h-4 w-4" />
                Edit Business Hours
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dashboard/settings">
                <Settings className="mr-2 h-4 w-4" />
                Business Settings
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
