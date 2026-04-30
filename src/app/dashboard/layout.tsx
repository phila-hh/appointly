/**
 * @file Dashboard Layout
 * @description Layout for the business owner dashboard.
 *
 * Structure:
 *   - Desktop (lg+): Sidebar on the left, content on the right
 *   - Mobile (<lg): Full-width content with header containing mobile menu
 *
 * Fetches unread notification count and recent notifications server-side
 * and passes them to DashboardHeader as props. This keeps NotificationBell
 * as a Client Component while avoiding client-side data fetching.
 *
 * This layout is protected by proxy (middleware) — only BUSINESS_OWNER
 * users can access /dashboard/* routes.
 */

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import {
  getUnreadNotificationCount,
  getNotifications,
} from "@/lib/actions/notification-queries";
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

  if (!user || user.role !== "BUSINESS_OWNER") {
    redirect("/sign-in");
  }

  // Fetch notification data server-side so DashboardHeader (client component)
  // receives it as props — avoids a client-side fetch waterfall
  const [unreadCount, notifications] = await Promise.all([
    getUnreadNotificationCount(),
    getNotifications(20),
  ]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar — visible on lg screens */}
      <DashboardSidebar user={user} />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header with mobile menu, page title, and notification bell */}
        <DashboardHeader
          user={user}
          unreadCount={unreadCount}
          notifications={notifications}
        />

        {/* Page content — scrollable */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
