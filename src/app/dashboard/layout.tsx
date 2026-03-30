/**
 * @file Dashboard Layout
 * @description Layout for the business owner dashboard.
 *
 * Structure:
 *   - Desktop (lg+): Sidebar on the left, content on the right
 *   - Mobile (<lg): Full-width content with header containing mobile menu
 *
 * This layout is protected by proxy (middleware) — only BUSINESS_OWNER
 * users can access /dashboard/* routes. The session is read here to pass
 * user data to the sidebar and header components.
 *
 * Unlike the (main) route group, "dashboard" is part of the URL path.
 * Routes under this layout are at /dashboard/overview, /dashboard/services, etc.
 *
 * Responsibilities:
 *   1. Verify user is authenticated with BUSINESS_OWNER role
 *   2. Redirect to /dashboard/setup if user has no business yet
 *   3. Render sidebar (desktop) and header (mobile) navigation
 *   4. Provide scrollable content area for child pages
 *
 * Note: Business existence check is handled by individual pages
 * that need it, not at the layout level, to avoid redirect loops
 * with /dashboard/setup page.
 */

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { DashboardSidebar } from "@/components/layouts/dashboard-sidebar";
import { DashboardHeader } from "@/components/layouts/dashboard-header";

export const metadata = {
  title: {
    default: "Dashboard",
    template: "%s | Dashboard | Appointly",
  },
};

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  // Authentication check (defense in depth — middleware handles this too)
  if (!user || user.role !== "BUSINESS_OWNER") {
    redirect("/sign-in");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar — visible on lg screens */}
      <DashboardSidebar user={user} />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header with mobile menu and page title */}
        <DashboardHeader user={user} />

        {/* Page content — scrollable */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
