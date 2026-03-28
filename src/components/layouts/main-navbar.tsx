/**
 * @file Main Navbar
 * @description The primary navigation for customer-facing pages.
 *
 * Features:
 *   - Appointly logo/brand linking to home.
 *   - Navigation links (Browse, How It Works, About)
 *   - Session-aware right section:
 *     - Logged out → Sign In + Get Started buttons
 *     - Logged In → User avatar with dropdown menu
 *     - Responsive: collapses into a mobile sheet menu on small screens
 *
 * This is a server component — it reads the session on the server via
 * `getCurrentUser`, No client-side Javascript is needed for the
 * initial render. The mobile menu trigger is a Client Component
 * imported separately.
 */

import Link from "next/link";
import { CalendarCheck } from "lucide-react";

import { getCurrentUser } from "@/lib/session";
import { SITE_CONFIG, MAIN_NAV_LINKS } from "@/constants";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/layouts/user-menu";
import { MobileNav } from "@/components/layouts/mobile-nav";

export async function MainNavbar() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* ---------------------------------------------------------------- */}
        {/* Left: Logo + Desktop Navigation                                  */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex items-center gap-8">
          {/* Brand logo — always links to home */}
          <Link href="/" className="flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">{SITE_CONFIG.name}</span>
          </Link>

          {/* Desktop navigation links — hidden on mobile */}
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
        {/* Right: Auth buttons OR User menu                                 */}
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
              {/* User avatar dropdown menu */}
              <UserMenu user={user} />
            </>
          ) : (
            <>
              {/* Sign In — visible on sm screens and up */}
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hidden sm:flex"
              >
                <Link href="/sign-in">Sign In</Link>
              </Button>
              {/* Get Started — always visible */}
              <Button size="sm" asChild>
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </>
          )}

          {/* Mobile menu trigger — visible only on small screens */}
          <div className="md:hidden">
            <MobileNav user={user} />
          </div>
        </div>
      </div>
    </header>
  );
}
