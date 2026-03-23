/**
 * @file NextAuth.js v5 Configuration
 * @description Central authentication configuration for the Appointly platform.
 *
 * This file configures:
 *   - Prisma adapter (stores users/accounts in PostgreSQL)
 *   - Credentials provider (email + password authentication)
 *   - JWT session strategy (stateless sessions via encrypted cookies)
 *   - Callbacks (enrich JWT and session with user role/id)
 *   - Custom page routes (our own sign-in page instead of NextAuth's default)
 *
 * Exports:
 *   - `handlers` — GET/POST route handlers for /api/auth/*
 *   - `auth`     — Server-side function to get the current session
 *   - `signIn`   — Server-side function to trigger sign-in
 *   - `signOut`  — Server-side function to trigger sign-out
 *
 * @example
 * ```ts
 * // In a Server Component:
 * import { auth } from "@/lib/auth";
 * const session = await auth();
 * console.log(session?.user.role); // "CUSTOMER" | "BUSINESS_OWNER"
 *
 * // In a Server Action:
 * import { signIn } from "@/lib/auth";
 * await signIn("credentials", { email, password, redirectTo: "/" });
 * ```
 *
 * @see https://authjs.dev/getting-started/installation?framework=next.js
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { type Role } from "@prisma/client";
import { compare } from "bcryptjs";

import db from "@/lib/db";
import { signInSchema } from "@/lib/validators/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  /**
   * Prisma Adapter
   * Connects NextAuth to our PostgreSQL database via Prisma.
   * Handles creating/reading User, Account, Session, and
   * VerificationToken records automatically.
   */
  adapter: PrismaAdapter(db),

  /**
   * Session Strategy
   * "jwt" = sessions are stored in an encrypted cookie, not in the database.
   * This is REQUIRED when using the Credentials provider because the Prisma
   * adapter's database session strategy doesn't work with Credentials.
   *
   * JWT is also more performant — no database query on every request.
   */
  session: { strategy: "jwt" },

  /**
   * Custom Pages
   * Override NextAuth's default sign-in page with our own.
   * Auth errors (wrong credentials, etc.) also redirect to our sign-in page.
   */
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },

  /**
   * Authentication Providers
   * Currently: Credentials (email + password)
   * Future: Could add Google, GitHub, etc. as additional providers.
   */
  providers: [
    Credentials({
      /**
       * Authorize callback — called when a user attempts to sign in.
       *
       * @param credentials - The email and password from the sign-in form
       * @returns The user object if valid, or null to deny access
       */
      async authorize(credentials) {
        // Step 1: Validate the input shape with our Zod schema.
        // safeParse returns { success: boolean, data?, error? } instead
        // of throwing an exception.
        const validatedFields = signInSchema.safeParse(credentials);

        if (!validatedFields.success) {
          return null;
        }

        const { email, password } = validatedFields.data;

        // Step 2: Look up the user by email.
        const user = await db.user.findUnique({
          where: { email },
        });

        // Step 3: Verify the user exists AND has a password.
        // user.password could be null if they signed up via OAuth (Google, etc.)
        // In that case, they can't use credentials to sign in.
        if (!user || !user.password) {
          return null;
        }

        // Step 4: Compare the provided password with the stored hash.
        // bcrypt.compare() handles the hashing internally — it extracts
        // the salt from the stored hash and re-hashes the input to compare.
        const passwordsMatch = await compare(password, user.password);

        if (!passwordsMatch) {
          return null;
        }

        // Step 5: Return the user object. These fields get passed to
        // the jwt() callback below. Returning null would deny access.
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],

  /**
   * Callbacks
   * Functions that run at specific points in the auth lifecycle.
   * Used to customize the JWT token and session data.
   */
  callbacks: {
    /**
     * JWT Callback
     * Called whenever a JWT is created (sign-in) or read (every request).
     *
     * On sign-in: `user` is available, so we copy id and role into the token.
     * On subsequent requests: `user` is undefined, but the token already has
     * our custom fields from the initial sign-in.
     *
     * @param token - The JWT being built or read
     * @param user  - The user object (only available on sign-in)
     * @returns The enriched JWT token
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },

    /**
     * Session Callback
     * Called whenever `auth()` or `useSession()` reads the session.
     * Copies our custom fields from the JWT into the session object
     * so they're accessible in components and server code.
     *
     * @param session - The session being built
     * @param token   - The JWT containing our custom fields
     * @returns The enriched session
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
});
