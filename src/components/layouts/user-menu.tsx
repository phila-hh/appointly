/**
 * @file User Menu Component
 * @description Avatar button with a dropdown menu for authenticated users.
 *
 * Displays:
 *   - User avatar (image or initials fallback)
 *   - User name, email, and role badge
 *   - Navigation links based on role:
 *       - ADMIN: Admin Panel link
 *       - BUSINESS_OWNER: Dashboard link
 *       - CUSTOMER: My Account, Bookings, Favorites, Profile links
 *   - Sign Out button
 *
 * This is a Client Component because it uses the dropdown menu's
 * interactive open/close behavior and sign-out action.
 */

"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  CalendarDays,
  Heart,
  LayoutDashboard,
  LogOut,
  Shield,
  User as UserIcon,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

/** Props accepted by the UserMenu component. */
interface UserMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: string;
  };
}

/**
 * Human-readable role labels for the badge display.
 * Maps the database enum to a friendly label.
 */
const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  BUSINESS_OWNER: "Business Owner",
  CUSTOMER: "Customer",
};

/**
 * Extracts initials from a user's name for the avatar fallback.
 * "Marcus Johnson" → "MJ", "Elena" → "EL", null → "U"
 *
 * @param name - The user's display name
 * @returns One or two character string of initials
 */
function getInitials(name?: string | null): string {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function UserMenu({ user }: UserMenuProps) {
  /** Handle sign out — clears session and redirects to home page. */
  async function handleSignOut() {
    await signOut({ redirectTo: "/" });
  }

  const roleLabel = ROLE_LABELS[user.role] ?? user.role;

  return (
    <DropdownMenu>
      {/* Trigger — the avatar button */}
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={user.image ?? undefined}
              alt={user.name ?? "User"}
            />
            <AvatarFallback className="text-xs">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      {/* Dropdown content */}
      <DropdownMenuContent className="w-56" align="end" forceMount>
        {/* User info section */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1.5">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {roleLabel}
              </Badge>
            </div>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Navigation links — different based on role */}
        <DropdownMenuGroup>
          {/* ---------------------------------------------------------------- */}
          {/* ADMIN role — Admin Panel link                                     */}
          {/* ---------------------------------------------------------------- */}
          {user.role === "ADMIN" && (
            <>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/admin/overview">
                  <Shield className="mr-2 h-4 w-4" />
                  Admin Panel
                </Link>
              </DropdownMenuItem>

              {/* Admins may also browse as customers, so include browse link */}
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/browse">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Browse Services
                </Link>
              </DropdownMenuItem>
            </>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* BUSINESS_OWNER role — Dashboard link                             */}
          {/* ---------------------------------------------------------------- */}
          {user.role === "BUSINESS_OWNER" && (
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/dashboard/overview">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </DropdownMenuItem>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* CUSTOMER role — Full customer navigation                         */}
          {/* ---------------------------------------------------------------- */}
          {user.role === "CUSTOMER" && (
            <>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/my-account">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  My Account
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/bookings">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  My Bookings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/favorites">
                  <Heart className="mr-2 h-4 w-4" />
                  Favorites
                </Link>
              </DropdownMenuItem>
            </>
          )}

          {/* Profile link — shown for all roles */}
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/profile">
              <UserIcon className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Sign out */}
        <DropdownMenuItem
          className="cursor-pointer text-red-600 focus:text-red-600"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
