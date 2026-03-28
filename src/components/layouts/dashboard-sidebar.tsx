/**
 * @file Dashboard Sidebar
 * @description Persistent sidebar navigation for the business owner dashboard.
 *
 * Features:
 *   - Appointly branding at top
 *   - Navigation links with icons and active state highlighting
 *   - User info and sign-out button at bottom
 *   - Responsive: hidden on mobile, shown on large screens
 *   - Mobile version is handled by the DashboardMobileNav component
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { CalendarCheck, LogOut } from "lucide-react";

import { SITE_CONFIG, DASHBOARD_NAV_LINKS } from "@/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

/** Props accepted by the DashboardSIdebar component. */
interface DashboardSidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:bg-muted/30">
      {/* Top — Branding */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <CalendarCheck className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold">{SITE_CONFIG.name}</span>
      </div>

      {/* Middle — Navigation links */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {DASHBOARD_NAV_LINKS.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                )}
              >
                {Icon && (
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                )}
                {link.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Bottom — User info and sign out */}
      <div className="border-t p-4">
        <div className="mb-3 px-2">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
        <Separator className="mb-3" />
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-red-600"
          onClick={() => signOut({ redirectTo: "/" })}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
