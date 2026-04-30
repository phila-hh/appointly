/**
 * @file Admin Layout
 * @description Layout for the admin panel.
 *
 * Fetches notification data server-side and passes to AdminHeader.
 * Protected by requireAdmin() — redirects non-admins to home.
 */

import { requireAdmin } from "@/lib/guards";
import {
  getUnreadNotificationCount,
  getNotifications,
} from "@/lib/actions/notification-queries";
import { AdminHeader } from "@/components/layouts/admin-header";
import { AdminSidebar } from "@/components/layouts/admin-sidebar";

export const metadata = {
  title: {
    default: "Admin",
    template: "%s | Admin | Appointly",
  },
};

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireAdmin();

  const [unreadCount, notifications] = await Promise.all([
    getUnreadNotificationCount(),
    getNotifications(20),
  ]);

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar user={user} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader
          user={user}
          unreadCount={unreadCount}
          notifications={notifications}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
