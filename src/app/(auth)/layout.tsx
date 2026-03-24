/**
 * @file Auth Layout
 * @description Shared layout for authentication pages (sign-in, sign-up)
 *
 * Desktop: Split-screen with branded panel on the left, form on the right.
 * Mobile: Full-width form with minimal branding at the top.
 *
 * This layout uses a route group "(auth)" which means it does NOT add
 * "/auth" to the URL. The sign-in page is at /sign-in, not /auth/sign-in.
 */

import { CalendarCheck } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* ----------------------------------------------------------------- */}
      {/* Left Panel - Branding (hidden on mobile, visible on large screens)   */}
      {/* ----------------------------------------------------------------- */}
      <div className="hidden lg:flex lg:flex-col lg:justify-between bg-zinc-900 p-10 text-white">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <CalendarCheck className="h-8 w-8" />
          <span className="text-2xl font-bold">Appointly</span>
        </Link>

        {/* Tagline and features */}
        <div className="space-y-6">
          <blockquote className="space-y-2">
            <p className="text-lg font-medium leading-relaxed">
              &rdquo;Appointly transformed how I manage my barbershop. Bookings
              are organized, no-shows dropped by 40%, and my customers love the
              easy online scheduling.&rdquo;
            </p>
            <footer className="text-sm text-zinc-400">
              — Marcus Johnson, Fresh Cuts Barbershop
            </footer>
          </blockquote>
        </div>

        {/* Bottom text */}
        <p className="text-sm text-zinc-400">
          © {new Date().getFullYear()} Appointly. All rights reserved.
        </p>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* RIght Panel — Form content (always visible)                       */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex items-center justify-center p-0 sm:p-8 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile only logo (hidden on desktop where left panel shows it) */}
          <div className="flex items-center gap-2 lg:hidden">
            <CalendarCheck className="h-7 w-7" />
            <span className="text-xl font-bold">Appointly</span>
          </div>

          {/* Page content (sign-ni or sign-up form) */}
          {children}
        </div>
      </div>
    </div>
  );
}
