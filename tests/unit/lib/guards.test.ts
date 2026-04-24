/**
 * @file Guards Unit Tests
 * @description Tests for requireUser(), requireRole(), and requireAdmin().
 *
 * Covers:
 *   - requireUser: returns user when authenticated, redirects to /sign-in
 *     when unauthenticated
 *   - requireRole: returns user when role matches, redirects to /sign-in
 *     when unauthenticated, redirects to / when wrong role
 *   - requireAdmin: convenience wrapper — redirects when not ADMIN,
 *     returns user when ADMIN
 *
 * Strategy:
 *   - getCurrentUser() is mocked at the module level so we control
 *     the returned user without touching NextAuth or the database
 *   - redirect() is mocked in tests/helpers/setup.ts so we can assert
 *     it was called with the correct path without actually navigating
 *   - redirect() in Next.js throws internally after being called,
 *     so tests that expect a redirect must use try/catch or expect
 *     the function to throw
 *
 * Pure unit test — no database, no network, no real auth.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { redirect } from "next/navigation";
import { requireUser, requireRole, requireAdmin } from "@/lib/guards";

// Clear previous mocks to avoid pollution
beforeEach(() => {
  vi.clearAllMocks();
});

// Mock getCurrentUser so we control the session in every test
vi.mock("@/lib/session", () => ({
  getCurrentUser: vi.fn(),
}));

import { getCurrentUser } from "@/lib/session";

// Typed mock reference for cleaner test code
const mockGetCurrentUser = vi.mocked(getCurrentUser);

// ─────────────────────────────────────────────────────────────────────────────
// Shared test users
// ─────────────────────────────────────────────────────────────────────────────

const customerUser = {
  id: "user-1",
  name: "Alice",
  email: "alice@example.com",
  role: "CUSTOMER" as const,
  image: null,
};

const businessOwnerUser = {
  id: "user-2",
  name: "Bob",
  email: "bob@example.com",
  role: "BUSINESS_OWNER" as const,
  image: null,
};

const adminUser = {
  id: "user-3",
  name: "Carol",
  email: "carol@example.com",
  role: "ADMIN" as const,
  image: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// requireUser
// ─────────────────────────────────────────────────────────────────────────────

describe("requireUser", () => {
  it("returns the user when authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(customerUser);

    const user = await requireUser();

    expect(user).toEqual(customerUser);
  });

  it("calls redirect('/sign-in') when there is no authenticated user", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    // redirect() in Next.js throws after being called — we catch that
    try {
      await requireUser();
    } catch {
      // expected — redirect throws internally in Next.js
    }

    expect(redirect).toHaveBeenCalledWith("/sign-in");
  });

  it("does NOT call redirect when the user is authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(customerUser);

    await requireUser();

    expect(redirect).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// requireRole
// ─────────────────────────────────────────────────────────────────────────────

describe("requireRole", () => {
  // ── Authenticated user with matching role ───────────────────────────────

  it("returns the user when their role matches", async () => {
    mockGetCurrentUser.mockResolvedValue(customerUser);

    const user = await requireRole("CUSTOMER");

    expect(user).toEqual(customerUser);
  });

  it("returns BUSINESS_OWNER when role matches", async () => {
    mockGetCurrentUser.mockResolvedValue(businessOwnerUser);

    const user = await requireRole("BUSINESS_OWNER");

    expect(user).toEqual(businessOwnerUser);
  });

  it("returns ADMIN user when role matches", async () => {
    mockGetCurrentUser.mockResolvedValue(adminUser);

    const user = await requireRole("ADMIN");

    expect(user).toEqual(adminUser);
  });

  // ── Wrong role ──────────────────────────────────────────────────────────

  it("calls redirect('/') when user role does not match required role", async () => {
    mockGetCurrentUser.mockResolvedValue(customerUser); // CUSTOMER, not ADMIN

    try {
      await requireRole("ADMIN");
    } catch {
      // expected — redirect throws
    }

    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("calls redirect('/') when BUSINESS_OWNER tries to access ADMIN route", async () => {
    mockGetCurrentUser.mockResolvedValue(businessOwnerUser);

    try {
      await requireRole("ADMIN");
    } catch {
      // expected
    }

    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("calls redirect('/') when ADMIN tries to access CUSTOMER-only route", async () => {
    mockGetCurrentUser.mockResolvedValue(adminUser);

    try {
      await requireRole("CUSTOMER");
    } catch {
      // expected
    }

    expect(redirect).toHaveBeenCalledWith("/");
  });

  // ── Unauthenticated ─────────────────────────────────────────────────────

  it("calls redirect('/sign-in') when there is no authenticated user", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    try {
      await requireRole("CUSTOMER");
    } catch {
      // expected
    }

    // requireUser is called first — it redirects to /sign-in
    expect(redirect).toHaveBeenCalledWith("/sign-in");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// requireAdmin
// ─────────────────────────────────────────────────────────────────────────────

describe("requireAdmin", () => {
  it("returns the user when they are an ADMIN", async () => {
    mockGetCurrentUser.mockResolvedValue(adminUser);

    const user = await requireAdmin();

    expect(user).toEqual(adminUser);
  });

  it("calls redirect('/') when user is CUSTOMER", async () => {
    mockGetCurrentUser.mockResolvedValue(customerUser);

    try {
      await requireAdmin();
    } catch {
      // expected
    }

    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("calls redirect('/') when user is BUSINESS_OWNER", async () => {
    mockGetCurrentUser.mockResolvedValue(businessOwnerUser);

    try {
      await requireAdmin();
    } catch {
      // expected
    }

    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("calls redirect('/sign-in') when unauthenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    try {
      await requireAdmin();
    } catch {
      // expected
    }

    expect(redirect).toHaveBeenCalledWith("/sign-in");
  });

  it("does NOT call redirect when the user is ADMIN", async () => {
    mockGetCurrentUser.mockResolvedValue(adminUser);

    await requireAdmin();

    expect(redirect).not.toHaveBeenCalled();
  });
});
