/**
 * @file Authorization Guards
 * @description Reusable server-side role guards for protected pages/actions.
 */

import { redirect } from "next/navigation";

import { type Role } from "@/generated/prisma/client";
import { getCurrentUser } from "@/lib/session";

/**
 * Ensures there is an authenticated user.
 * Redirects to sign-in when the request is unauthenticated.
 */
export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return user;
}

/**
 * Ensures the current user has the requested role.
 * Redirects unauthenticated users to sign-in and unauthorized users to home.
 */
export async function requireRole(role: Role) {
  const user = await requireUser();

  if (user.role !== role) {
    redirect("/");
  }

  return user;
}

/** Requires the current user to be an ADMIN. */
export async function requireAdmin() {
  return requireRole("ADMIN");
}
