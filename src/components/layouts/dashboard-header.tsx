/**
 * @file Dashboard Header
 * @description Top header bar for the dashboard on mobile/tablet screens.
 *
 * On large screens (lg+) the sidebar is visible and this header provides
 * only a minimal top bar. On smaller screens, it includes sheet-based
 * mobile navigation menu.
 *
 * Receives unreadCount and notifications as props from the server layout
 * and renders the NotificationBell client component.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Menu, CalendarCheck, LogOut } from "lucide-react";

import { SITE_CONFIG, DASHBOARD_NAV_LINKS } from "@/constants";
import { cn } from "@/lib/utils";
import type { SerializedNotification } from "@/lib/actions/notification-queries";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { NotificationBell } from "@/components/shared/notification-bell";

/** Props accepted by the DashboardHeader component. */
interface DashboardHeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
  /** Unread notification count — fetched server-side in dashboard layout. */
  unreadCount: number;
  /** Recent notifications — fetched server-side in dashboard layout. */
  notifications: SerializedNotification[];
}

export function DashboardHeader({
  user,
  unreadCount,
  notifications,
}: DashboardHeaderProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const currentPage = DASHBOARD_NAV_LINKS.find(
    (link) => link.href === pathname
  );

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6 lg:px-8">
      {/* Mobile menu trigger — hidden on lg screens */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle dashboard menu</span>
          </Button>
        </SheetTrigger>

        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="border-b p-4">
            <SheetTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-primary" />
              {SITE_CONFIG.name}
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-8rem)]">
            <nav className="flex flex-col gap-1 p-3">
              {DASHBOARD_NAV_LINKS.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          <div className="absolute bottom-0 left-0 right-0 border-t p-4">
            <div className="mb-3 px-2">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
            <Separator className="mb-3" />
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-red-600"
              onClick={async () => {
                setOpen(false);
                await signOut({ redirectTo: "/" });
              }}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Page title */}
      <div className="flex-1">
        <h1 className="text-lg font-semibold">
          {currentPage?.label ?? "Dashboard"}
        </h1>
      </div>

      {/* Right section: notification bell + back to site */}
      <div className="flex items-center gap-2">
        <NotificationBell
          unreadCount={unreadCount}
          notifications={notifications}
        />
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">← Back to site</Link>
        </Button>
      </div>
    </header>
  );
}
