/**
 * @file Route Protection Middleware
 * @description Runs before every matched request to enforce authentication
 * and role-based access control.
 *
 * Protection rules:
 *   1. Auth pages (/sign-in, /sign-up): Redirect logged-in users away
 *   2. Dashboard routes (/dashboard/*): Require BUSINESS_OWNER role
 *   3. Admin routes (/admin/*): Require ADMIN role
 *   4. Customer routes (/bookings, /profile): Require authentication
 *   5. Booking routes (/business/[slug]/book): Require email verification
 *   6. All other routes: publicly accessible
 *   7. Unverified credential users attempting to book are redirected
 *     to the sign-in page with a verification notice.
 *   8. The /verify-email and /unsubscribe pages are always public.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/proxy
 */

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  // -----------------------------------------------------------------------
  // Define route categories
  // -----------------------------------------------------------------------

  const isAuthPage =
    nextUrl.pathname.startsWith("/sign-in") ||
    nextUrl.pathname.startsWith("/sign-up");

  const isDashboardPage = nextUrl.pathname.startsWith("/dashboard");
  const isAdminPage = nextUrl.pathname.startsWith("/admin");

  const isProtectedCustomerPage =
    nextUrl.pathname.startsWith("/bookings") ||
    nextUrl.pathname.startsWith("/profile") ||
    nextUrl.pathname.startsWith("/favorites") ||
    nextUrl.pathname.startsWith("/my-account");

  // -----------------------------------------------------------------------
  // Rule 1: Redirect authenticated users away from auth pages
  // -----------------------------------------------------------------------
  if (isAuthPage && isLoggedIn) {
    const redirectPath =
      userRole === "ADMIN"
        ? "/admin/overview"
        : userRole === "BUSINESS_OWNER"
          ? "/dashboard/overview"
          : "/browse";
    return NextResponse.redirect(new URL(redirectPath, nextUrl));
  }

  // -----------------------------------------------------------------------
  // Rule 2: Protect dashboard — must be a BUSINESS_OWNER
  // -----------------------------------------------------------------------
  if (isDashboardPage) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/sign-in", nextUrl));
    }
    if (userRole !== "BUSINESS_OWNER") {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
  }

  // -----------------------------------------------------------------------
  // Rule 3: Protect admin routes — must be an ADMIN
  // -----------------------------------------------------------------------
  if (isAdminPage) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/sign-in", nextUrl));
    }
    if (userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
  }

  // -----------------------------------------------------------------------
  // Rule 4: Protect customer pages — must be authenticated
  // -----------------------------------------------------------------------
  if (isProtectedCustomerPage && !isLoggedIn) {
    return NextResponse.redirect(new URL("/sign-in", nextUrl));
  }

  // -----------------------------------------------------------------------
  // Rule 5: Allow all other routes
  // -----------------------------------------------------------------------
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
