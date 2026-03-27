/**
 * @file Application Constants
 * @description Centralized constants used across the Appointly platform.
 *
 * Keeping constants in a single file ensure consistency and makes updates
 * easy — change a value here and it propagates everywhere. Constants are
 * grouped by domain: site metadata, navigation links, business categories.
 *
 * @example
 * ```ts
 * import { SITE_CONFIG, MAIN_NAV_LINKS } from "@/constants";
 * ```
 */

import {
  LayoutDashboard,
  CalendarDays,
  Scissors,
  Clock,
  Users,
  Star,
  Settings,
  type LucideIcon,
} from "lucide-react";

// =============================================================================
// Site Configuration
// =============================================================================

/** Global site metadata used in layouts, SEO, and branding */
export const SITE_CONFIG = {
  name: "Appointly",
  description:
    "Book appointments with local service providers. Manage your business, services, and schedule all in one place.",
  url: "https://appointly.vercel.app",
} as const;

// =============================================================================
// Navigation Links
// =============================================================================

/** Shape of a navigation link used in menus and sidebars */
export type NavLink = {
  /** Display label for the link */
  label: string;
  /** URL path the link navigates to */
  href: string;
  /** Optional Lucide icon component rendered beside the label */
  icon?: LucideIcon;
};

/** Primary navigation links shown in the main (customer-facing) navbar. */
export const MAIN_NAV_LINKS: NavLink[] = [
  { label: "Browse", href: "/browse" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "About", href: "/#about" },
];

/** SIdebar links for the business owner dashboard. */
export const DASHBOARD_NAV_LINK: NavLink[] = [
  { label: "Overview", href: "/dashboard/overview", icon: LayoutDashboard },
  { label: "Bookings", href: "/dashboard/bookings", icon: CalendarDays },
  { label: "Service", href: "/dashboard/service", icon: Scissors },
  { label: "Availability", href: "/dashboard/availability", icon: Clock },
  { label: "Customers", href: "/dashboard/customers", icon: Users },
  { label: "Reviews", href: "/dashboard/reviews", icon: Star },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

// =============================================================================
// Business Categories
// =============================================================================

/**
 * Human-readable labels for business categories.
 * Maps the database enum values to display strings.
 * Used in forms, filters, and display cards.
 */
export const BUSINESS_CATEGORIES: Record<string, string> = {
  BARBERSHOP: "Barbershop",
  SALON: "Salon",
  SPA: "Spa",
  FITNESS: "Fitness",
  DENTAL: "Dental",
  MEDICAL: "Medical",
  TUTORING: "Tutoring",
  CONSULTING: "Consulting",
  PHOTOGRAPHY: "Photography",
  AUTOMOTIVE: "Automotive",
  HOME_SERVICES: "Home Services",
  PET_SERVICES: "Pet Services",
  OTHER: "Other",
} as const;

// =============================================================================
//Booking Status Labels & Colors
// =============================================================================

/**
 * Display configuration for booking statuses.
 * Maps the database enum to a human-readable label and a Tailwind
 * badge color class for consistent UI presentation.
 */
export const BOOKING_STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-800",
  },
  CONFIRMED: {
    label: "Confirmed",
    className: "bg-blue-100 text-blue-800",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-green-100 text-green-800",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-red-100 text-red-800",
  },
  NO_SHOW: {
    label: "No Show",
    className: "bg-gray-100 text-gray-800",
  },
} as const;
