/**
 * @file Mobile Navigation
 * @description Slide-out sheet menu for mobile screens.
 *
 * Triggered by a hamburger icon visible only on screens < md (768px).
 * Contains all navigation links and auth actions in a full-height
 * side panel.
 *
 * Uses the shadcn Sheet component (built on Radix Dialog) which
 * handles focus trapping, keyboard navigation, and background overlay.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Menu, CalendarCheck, LogOut } from "lucide-react";

import { SITE_CONFIG, MAIN_NAV_LINKS, DASHBOARD_NAV_LINKS } from "@/constants";
import { cn } from "@/lib/utils";
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

/** Props accepted by the MobileNav component. */
interface MobileNavProps {
  user: {
    name?: string | null;
    email?: string | null;
    role: string;
  } | null;
}

export function MobileNav({ user }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  /** Close the sheet and navigate — provides instant feedback. */
  function handleLinkClick() {
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* Hamburger trigger button */}
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>

      {/* Sheet content — slides in from the right */}
      <SheetContent side="right" className="w-72 p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" />
            {SITE_CONFIG.name}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-4rem)]">
          <div className="flex flex-col p-4">
            {/* Main navigation links */}
            <nav className="flex flex-col gap-1">
              {MAIN_NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={handleLinkClick}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    pathname === link.href
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Dashboard links — only for business owners */}
            {user?.role === "BUSINESS_OWNER" && (
              <>
                <Separator className="my-4" />
                <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Dashboard
                </p>
                <nav className="flex flex-col gap-1">
                  {DASHBOARD_NAV_LINKS.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={handleLinkClick}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          "hover:bg-accent hover:text-accent-foreground",
                          pathname === link.href
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
              </>
            )}

            <Separator className="my-4" />

            {/* Auth section */}
            {user ? (
              <div className="flex flex-col gap-2">
                {/* User info */}
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                {/* Sign out button */}
                <Button
                  variant="ghost"
                  className="justify-start gap-2 text-red-600 hover:text-red-600 hover:bg-red-50"
                  onClick={async () => {
                    setOpen(false);
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Button variant="outline" asChild>
                  <Link href="/sign-in" onClick={handleLinkClick}>
                    Sign In
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/sign-up" onClick={handleLinkClick}>
                    Get Started
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
