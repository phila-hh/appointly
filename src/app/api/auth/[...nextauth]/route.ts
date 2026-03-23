/**
 * @file NextAuth API Route Handler
 * @description Handles all authentication-related HTTP requests.
 *
 * The [...nextauth] catch-all route handles these endpoints:
 *
 * GET /api/auth/session
 * Returns the current session
 *
 * POST /api/auth/signin
 * Processes sign-in attempts
 *
 * POST /api/auth/signout
 * Processes sign-out
 *
 * GET /api/auth/providers
 * List available auth providers
 *
 * GET /api/auth/csrf
 * Returns CSRF token
 *
 * The `handlers` object from our auth config provides the GET and POST
 * functions that NextAuth needs. We simply re-export them.
 *
 * @see https://authjs.dev/getting-started/installation?framework=next.js
 */
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
