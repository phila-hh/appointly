/**
 * @file Route Protection Middleware (Now named proxy)
 * @description Runs before every matched request to enforce authentication
 * and role-based access control.
 *
 * Protection rules:
 *   1. Auth pages (/sign-in, /sign-up): Redirect logged-in users away
 *      (no reason to show login to an already authenticated user)
 *   2. Dashboard routes (/dashboard/*): Require BUSINESS_OWNER role
 *   3. Customer routes (/bookings, /profile): Require authentication
 *   4. All other routes: publicly accessible
 *
 * @note
 * This file uses the "proxy.ts" convention introduced in Next.js 16,
 * replacing the legacy "middleware.ts". Despite the name change,
 * it serves the same purpose: intercepting and handling requests
 * before they reach route handlers.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/proxy
 */

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Auth-wrapped middleware function.
 * The `auth()` wrapper injects `req.auth` with the current session
 * (or null if not authenticated).
 */
export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  // -----------------------------------------------------------------------
  // Define route categories
  // -----------------------------------------------------------------------

  /** Authentication pages that logged-in users shouldn't see */
  const isAuthPage =
    nextUrl.pathname.startsWith("/sign-in") ||
    nextUrl.pathname.startsWith("/sign-up");

  /** Business owner dashboard — requires BUSINESS_OWNER role */
  const isDashboardPage = nextUrl.pathname.startsWith("/dashboard");

  /** Customer-only pages — requires any authenticated user */
  const isProtectedCustomerPage =
    nextUrl.pathname.startsWith("/bookings") ||
    nextUrl.pathname.startsWith("/profile");

  // -----------------------------------------------------------------------
  // Rule 1: Redirect authenticated users away from auth pages
  // -----------------------------------------------------------------------
  if (isAuthPage && isLoggedIn) {
    // Send business owners to their dashboard, customers to browse
    const redirectPath =
      userRole === "BUSINESS_OWNER" ? "/dashboard/overview" : "/browse";
    return NextResponse.redirect(new URL(redirectPath, nextUrl));
  }

  // -----------------------------------------------------------------------
  // Rule 2: Protect dashboard — must be a BUSINESS_OWNER
  // -----------------------------------------------------------------------
  if (isDashboardPage) {
    if (!isLoggedIn) {
      // Not logged in → redirect to sign-in
      return NextResponse.redirect(new URL("/sign-in", nextUrl));
    }
    if (userRole !== "BUSINESS_OWNER") {
      // Logged in but wrong role → redirect to home
      return NextResponse.redirect(new URL("/", nextUrl));
    }
  }

  // -----------------------------------------------------------------------
  // Rule 3: Protect customer pages — must be authenticated
  // -----------------------------------------------------------------------
  if (isProtectedCustomerPage && !isLoggedIn) {
    return NextResponse.redirect(new URL("/sign-in", nextUrl));
  }

  // -----------------------------------------------------------------------
  // Rule 4: All other routes — allow access
  // -----------------------------------------------------------------------
  return NextResponse.next();
});

/**
 * Middleware matcher configuration.
 * Defines which routes the middleware should run on.
 *
 * This regex EXCLUDES:
 *   - /api routes (API routes handle their own auth)
 *   - /_next/static (static files)
 *   - /_next/image (image optimization)
 *   - /favicon.ico (browser icon)
 *   - Common image/font file extensions
 *
 * Running middleware on static files would waste resources and could
 * cause issues with asset loading.
 */
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
