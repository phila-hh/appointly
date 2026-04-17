/**
 * @file NextAuth.js v5 Configuration
 * @description Central authentication configuration for the Appointly platform.
 *
 * This file configures:
 *   - Prisma adapter (stores users/accounts in PostgreSQL)
 *   - Credentials provider (email + password authentication)
 *   - Google OAuth provider (social sign-in)
 *   - JWT session strategy (stateless sessions via encrypted cookies)
 *   - Callbacks (enrich JWT and session with user role/id)
 *   - Custom page routes
 *
 * OAuth Notes:
 *   - Google sign-in creates a User record automatically via PrismaAdapter
 *   - New Google users default to CUSTOMER role
 *   - Google users have emailVerified set automatically by the adapter
 *   - If a user signed up with credentials first, they can later link
 *     their Google account (same email)
 *
 * @see https://authjs.dev/getting-started/installation?framework=next.js
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";

import db from "@/lib/db";
import { signInSchema } from "@/lib/validators/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  /**
   * Prisma Adapter
   * Connects NextAuth to our PostgreSQL database via Prisma.
   */
  adapter: PrismaAdapter(db),

  /**
   * Session Strategy
   * "jwt" = sessions are stored in an encrypted cookie, not in the database.
   * REQUIRED when using the Credentials provider.
   */
  session: { strategy: "jwt" },

  /**
   * Custom Pages
   */
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },

  /**
   * Authentication Providers
   */
  providers: [
    // -------------------------------------------------------------------------
    // Google OAuth Provider
    // -------------------------------------------------------------------------
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      /**
       * By default, the PrismaAdapter creates users with no role field set.
       * We use the `profile` callback to ensure new Google users get the
       * CUSTOMER role. The adapter merges this into the User record.
       */
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "CUSTOMER", // Default role for OAuth sign-ups
        };
      },
    }),

    // -------------------------------------------------------------------------
    // Credentials Provider (email + password)
    // -------------------------------------------------------------------------
    Credentials({
      async authorize(credentials) {
        const validatedFields = signInSchema.safeParse(credentials);

        if (!validatedFields.success) {
          return null;
        }

        const { email, password } = validatedFields.data;

        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          return null;
        }

        const passwordsMatch = await compare(password, user.password);

        if (!passwordsMatch) {
          return null;
        }

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
   */
  callbacks: {
    /**
     * JWT Callback
     * On sign-in: copy id and role into the token.
     * On subsequent requests: token already has these fields.
     *
     * For OAuth sign-ins, `user` is the profile returned by the provider.
     * We need to fetch the role from the database since the OAuth profile
     * callback sets a default but the user may have been updated since.
     */
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }

      // On OAuth sign-in, the user object may not have the role from DB.
      // Fetch it to ensure we have the correct role.
      if (trigger === "signIn" && token.id) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
        }
      }

      return token;
    },

    /**
     * Session Callback
     * Copies custom fields from JWT into the session.
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
});
