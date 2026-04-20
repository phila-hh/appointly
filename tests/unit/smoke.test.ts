/**
 * @file Smoke Test
 * @description Verifies that the test infrastructure is working.
 * This file can be deleted after Phase 1 is confirmed working.
 */

import { describe, it, expect } from "vitest";

describe("Test Infrastructure", () => {
  it("can run a basic assertion", () => {
    expect(1 + 1).toBe(2);
  });

  it("has access to the test environment", () => {
    expect(process.env.NODE_ENV).toBe("test");
  });

  it("can resolve @/ path aliases", async () => {
    // This verifies that the vitest alias config matches tsconfig
    const utils = await import("@/lib/utils");
    expect(utils).toBeDefined();
  });
});
