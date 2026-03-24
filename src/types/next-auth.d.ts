/**
 * @file NextAuth.js Type Extension
 * @description Extends the default NextAuth type definitions to include
 * application-specific fields (id, role) on the User, Session, and JWT objects.
 *
 * @see https://next-auth.js.org/getting-started/typescript
 */

import { type DefaultSession } from "next-auth";
import { type Role } from "@prisma/client";

/**
 * Extends the built-in NextAuth types to include our custom fields.
 * "declare-module" tells Typescript: "merge these declarations with
 * the existing module's types."
 */
declare module "next-auth" {
  /**
   * The Session object available via "auth()" or "useSession()".
   * We add "id" and "role" to "session.user".
   */
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  /**
   * The User object returned by the "authorize" callback.
   * We add "role" so it flows through the JWT and Session.
   */
  interface User {
    role: Role;
  }
}

/**
 * Extend the JWT type to carry our custom fields between requests.
 * The JWT is an encrypted token stored in a cookie. It holds user data
 * between page loads so we don't query the database on every request.
 */
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}

/**
 * Extend the AdapterUser type to include our custom fields.
 * This ensures that the user object returned by database adapters
 * (e.g., Prisma Adapter) includes the "role" field.
 *
 * By adding "role" here, we guarantee type safety when interacting
 * with adapter-level user data throughout the authentication flow.
 */
declare module "@auth/core/adapters" {
  interface AdapterUser {
    role: Role;
  }
}
