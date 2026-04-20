/**
 * @file Global Test Setup
 * @description Runs before every test file. Configures jest-dom matchers
 * and sets up global mocks for Next.js framework features.
 *
 * This file is referenced in vitest.config.ts → test.setupFiles
 */

import "@testing-library/jest-dom";
import { vi } from "vitest";

// ---------------------------------------------------------------------------
// Mock next/navigation — used in many components and server actions
// ---------------------------------------------------------------------------
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Mock next/cache — prevents revalidatePath errors in server actions
// ---------------------------------------------------------------------------
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Mock next-auth/react — prevents auth hook errors in client components
// ---------------------------------------------------------------------------
vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  useSession: vi.fn(() => ({ data: null, status: "unauthenticated" })),
}));

// ---------------------------------------------------------------------------
// Suppress noisy console output in tests
// Tests that need to assert on console output can use vi.spyOn
// ---------------------------------------------------------------------------
vi.spyOn(console, "warn").mockImplementation(() => {});
vi.spyOn(console, "error").mockImplementation(() => {});

// ---------------------------------------------------------------------------
// Clean up mocks after each test to prevent state leakage
// ---------------------------------------------------------------------------
afterEach(() => {
  vi.clearAllMocks();
});
