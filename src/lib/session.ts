/**
 * @file Session Helper
 * @description Utility function for accessing the current user's session
 * in Server Components and Server Actions.
 *
 * Wraps NextAuth's `auth()` function with convenience methods for
 * common session checks.
 *
 * @example
 * ```ts
 * import { getCurrentUser } from "@/lib/session";
 *
 * const user = await getCurrentUser();
 * if (!user) redirect("/sign-in");
 * console.log(user.role); // "CUSTOMER" | "BUSINESS_OWNER"
 * ```
 */

import { auth } from "@/lib/auth";

/**
 * Retrieves the current authenticated user from the session.
 *
 * @returns The user object (id, name, email, image, role) or null
 *          if the user is not authenticated.
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}
