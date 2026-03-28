/**
 * @file Main Layout
 * @description Layout for all customer-facing pages.
 *
 * Provides the navigation bar at the top and footer at the bottom.
 * Pages rendered within this layout include: landing page, browse,
 * business details, bookings, and profile.
 *
 * This is a route group layout — the "(main)" folder does not add
 * a URL segment. /browse is the URL not /(main)/browse.
 */

import { MainNavbar } from "@/components/layouts/main-navbar";
import { Footer } from "@/components/layouts/footer";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <MainNavbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
