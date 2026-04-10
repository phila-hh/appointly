/**
 * @file Customer Dashboard Page
 * @description Personalized dashboard for customers with quick actions.
 *
 * Features:
 *   - Upcoming appointments (next 3)
 *   - Quick rebook last service
 *   - Recently visited businesses
 *   - Booking statistics summary
 *   - Links to favorites and profile
 *
 * URL: /my-account
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { User, Heart, CalendarDays, Sparkles } from "lucide-react";

import { getCurrentUser } from "@/lib/session";
import {
  getUpcomingAppointments,
  getRecentBusinesses,
  getBookingStats,
  getLastCompletedBooking,
} from "@/lib/actions/customer-dashboard-queries";
import { Button } from "@/components/ui/button";
import { UpcomingAppointments } from "@/components/shared/upcoming-appointments";
import { QuickRebook } from "@/components/shared/quick-rebook";
import { RecentBusinesses } from "@/components/shared/recent-businesses";
import { BookingStats } from "@/components/shared/booking-stats";

export const metadata = {
  title: "My Account",
};

export default async function MyAccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  if (user.role !== "CUSTOMER") {
    redirect("/dashboard/overview");
  }

  // Fetch all dashboard data in parallel
  const [upcomingAppointments, recentBusinesses, stats, lastBooking] =
    await Promise.all([
      getUpcomingAppointments(),
      getRecentBusinesses(),
      getBookingStats(),
      getLastCompletedBooking(),
    ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {/* Hero Section */}
        <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 sm:p-8">
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            {/* Welcome message */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                <span>Your Dashboard</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Welcome back, {user.name?.split(" ")[0] ?? "there"}
              </h1>
              <p className="max-w-md text-muted-foreground">
                Manage your bookings and discover services.
              </p>
            </div>

            {/* Header action buttons */}
            <div className="flex flex-wrap gap-2 sm:flex-nowrap">
              <Button variant="outline" asChild className="flex-1 sm:flex-none">
                <Link href="/bookings">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Bookings
                </Link>
              </Button>
              <Button variant="outline" asChild className="flex-1 sm:flex-none">
                <Link href="/favorites">
                  <Heart className="mr-2 h-4 w-4" />
                  Favorites
                </Link>
              </Button>
              <Button variant="outline" asChild className="flex-1 sm:flex-none">
                <Link href="/profiles">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </Button>
            </div>
          </div>

          {/* Decorative background elements */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-32 -left-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        </div>

        {/* Booking Statistics */}
        <div className="mb-8">
          <BookingStats stats={stats} />
        </div>

        {/* Upcoming Appointments */}
        <div className="mb-8">
          <UpcomingAppointments appointments={upcomingAppointments} />
        </div>

        {/* Recent Businesses + Quick Rebook */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Businesses */}
          {recentBusinesses.length > 0 ? (
            <RecentBusinesses businesses={recentBusinesses} />
          ) : (
            <div /> // Empty placeholder to maintain grid on lg
          )}

          {/* Quick Rebook */}
          <QuickRebook lastBooking={lastBooking} />
        </div>
      </div>
    </div>
  );
}
