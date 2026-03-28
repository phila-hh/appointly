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

  // Double check authentication (middleware should catch this, defense is depth)
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
