/**
 * @file Main Navbar
 * @description The primary navigation for customer-facing pages.
 *
 * Features:
 *   - Appointly logo/brand linking to home
 *   - Navigation links (Browse, How It Works, About)
 *   - Session-aware right section:
 *       - Logged out → Sign In + Get Started buttons
 *       - Logged in  → Notification bell + User avatar dropdown
 *       - Responsive: collapses into a mobile sheet menu on small screens
 *
 * This is a Server Component — it reads the session and notification data
 * on the server. The NotificationBell is a Client Component but receives
 * its data as props, so no client-side fetch is needed.
 */

import Link from "next/link";
import { CalendarCheck } from "lucide-react";

import { getCurrentUser } from "@/lib/session";
import {
  getUnreadNotificationCount,
  getNotifications,
} from "@/lib/actions/notification-queries";
import { SITE_CONFIG, MAIN_NAV_LINKS } from "@/constants";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/layouts/user-menu";
import { MobileNav } from "@/components/layouts/mobile-nav";
import { NotificationBell } from "@/components/shared/notification-bell";

export async function MainNavbar() {
  const user = await getCurrentUser();

  // Fetch notification data only for authenticated users
  const [unreadCount, notifications] = user
    ? await Promise.all([getUnreadNotificationCount(), getNotifications(20)])
    : [0, []];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* ---------------------------------------------------------------- */}
        {/* Left: Logo + Desktop Navigation                                  */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">{SITE_CONFIG.name}</span>
          </Link>

          <nav className="hidden md:flex md:items-center md:gap-6">
            {MAIN_NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Right: Auth buttons OR Notification bell + User menu             */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Dashboard link for business owners */}
              {user.role === "BUSINESS_OWNER" && (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="hidden sm:flex"
                >
                  <Link href="/dashboard/overview">Dashboard</Link>
                </Button>
              )}

              {/* Notification bell — between dashboard link and user menu */}
              <NotificationBell
                unreadCount={unreadCount}
                notifications={notifications}
              />

              {/* User avatar dropdown menu */}
              <UserMenu user={user} />
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hidden sm:flex"
              >
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </>
          )}

          {/* Mobile menu trigger */}
          <div className="md:hidden">
            <MobileNav user={user} />
          </div>
        </div>
      </div>
    </header>
  );
}
