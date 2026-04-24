/**
 * @file Rate Limiter Unit Tests
 * @description Tests for createRateLimiter() and the pre-configured aiSearchLimiter.
 *
 * Covers:
 *   - check(): allows requests within the limit
 *   - check(): returns correct `remaining` count after each request
 *   - check(): blocks requests once the limit is reached
 *   - check(): returns `retryAfterMs` > 0 when blocked
 *   - check(): resets the window correctly after windowMs elapses
 *   - check(): isolates state per userId (one user's limit does not
 *     affect another's)
 *   - check(): sliding window — only counts requests within the window,
 *     not all historical requests
 *   - aiSearchLimiter: allows 10 requests and blocks the 11th
 *
 * Strategy:
 *   - Each test creates its own limiter instance via createRateLimiter()
 *     so there is zero shared state between tests
 *   - vi.useFakeTimers() controls Date.now() precisely so window
 *     expiry is deterministic
 *
 * Pure unit test — no database, no network, no external services.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createRateLimiter, aiSearchLimiter } from "@/lib/rate-limit";

describe("createRateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Start at a fixed point in time
    vi.setSystemTime(new Date("2027-06-15T10:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Basic allow behavior ────────────────────────────────────────────────

  it("allows the first request for a new user", () => {
    const limiter = createRateLimiter({ maxRequests: 3, windowMs: 60_000 });

    const result = limiter.check("user-1");

    expect(result.allowed).toBe(true);
  });

  it("returns retryAfterMs of 0 when request is allowed", () => {
    const limiter = createRateLimiter({ maxRequests: 3, windowMs: 60_000 });

    const result = limiter.check("user-1");

    expect(result.retryAfterMs).toBe(0);
  });

  it("returns remaining count of maxRequests - 1 after the first request", () => {
    const limiter = createRateLimiter({ maxRequests: 3, windowMs: 60_000 });

    const result = limiter.check("user-1");

    expect(result.remaining).toBe(2);
  });

  it("decrements remaining count with each allowed request", () => {
    const limiter = createRateLimiter({ maxRequests: 3, windowMs: 60_000 });

    limiter.check("user-1"); // remaining: 2
    const second = limiter.check("user-1"); // remaining: 1
    const third = limiter.check("user-1"); // remaining: 0

    expect(second.remaining).toBe(1);
    expect(third.remaining).toBe(0);
  });

  // ── Blocking behavior ───────────────────────────────────────────────────

  it("blocks the request once the limit is reached", () => {
    const limiter = createRateLimiter({ maxRequests: 2, windowMs: 60_000 });

    limiter.check("user-1"); // 1st — allowed
    limiter.check("user-1"); // 2nd — allowed
    const third = limiter.check("user-1"); // 3rd — blocked

    expect(third.allowed).toBe(false);
  });

  it("returns remaining of 0 when blocked", () => {
    const limiter = createRateLimiter({ maxRequests: 2, windowMs: 60_000 });

    limiter.check("user-1");
    limiter.check("user-1");
    const blocked = limiter.check("user-1");

    expect(blocked.remaining).toBe(0);
  });

  it("returns a positive retryAfterMs when blocked", () => {
    const limiter = createRateLimiter({ maxRequests: 2, windowMs: 60_000 });

    limiter.check("user-1");
    limiter.check("user-1");
    const blocked = limiter.check("user-1");

    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("retryAfterMs is approximately equal to the remaining window duration", () => {
    const windowMs = 60_000; // 1 minute
    const limiter = createRateLimiter({ maxRequests: 1, windowMs });

    // First request recorded at t=0 (10:00:00)
    limiter.check("user-1");

    // Advance 10 seconds — now 50 seconds remain in the window
    vi.advanceTimersByTime(10_000);

    const blocked = limiter.check("user-1");

    // Oldest timestamp is at t=0, window expires at t=60s, now is t=10s
    // retryAfterMs ≈ 50_000
    expect(blocked.retryAfterMs).toBeGreaterThan(49_000);
    expect(blocked.retryAfterMs).toBeLessThanOrEqual(50_000);
  });

  // ── Window reset (sliding window behavior) ──────────────────────────────

  it("allows requests again after the full window has elapsed", () => {
    const windowMs = 60_000;
    const limiter = createRateLimiter({ maxRequests: 2, windowMs });

    // Use up the limit
    limiter.check("user-1");
    limiter.check("user-1");

    // Advance past the entire window
    vi.advanceTimersByTime(windowMs + 1);

    // Both old timestamps are now outside the window — should be allowed again
    const result = limiter.check("user-1");

    expect(result.allowed).toBe(true);
  });

  it("only counts requests within the current window (sliding)", () => {
    const windowMs = 60_000; // 1 minute
    const limiter = createRateLimiter({ maxRequests: 2, windowMs });

    // First request at t=0
    limiter.check("user-1");

    // Advance 40 seconds — first request is still within the window
    vi.advanceTimersByTime(40_000);

    // Second request at t=40s
    limiter.check("user-1");

    // Advance another 25 seconds (t=65s) — first request (t=0) is now expired
    vi.advanceTimersByTime(25_000);

    // Only the t=40s request is in the window — limit is 2, so this should be allowed
    const result = limiter.check("user-1");

    expect(result.allowed).toBe(true);
  });

  it("remaining resets correctly after old timestamps slide out", () => {
    const windowMs = 60_000;
    const limiter = createRateLimiter({ maxRequests: 3, windowMs });

    // Use 2 of 3 slots
    limiter.check("user-1");
    limiter.check("user-1");

    // Advance past the window so both timestamps expire
    vi.advanceTimersByTime(windowMs + 1);

    // Fresh window — remaining should be back to maxRequests - 1 (after this call)
    const result = limiter.check("user-1");

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2); // 3 - 1 = 2
  });

  // ── Per-user isolation ──────────────────────────────────────────────────

  it("tracks different users independently", () => {
    const limiter = createRateLimiter({ maxRequests: 1, windowMs: 60_000 });

    // user-1 uses their only request
    limiter.check("user-1");
    const user1Blocked = limiter.check("user-1");

    // user-2 is a fresh user — should still be allowed
    const user2First = limiter.check("user-2");

    expect(user1Blocked.allowed).toBe(false);
    expect(user2First.allowed).toBe(true);
  });

  it("does not share request counts across different users", () => {
    const limiter = createRateLimiter({ maxRequests: 3, windowMs: 60_000 });

    // user-1 makes 3 requests (hits limit)
    limiter.check("user-1");
    limiter.check("user-1");
    limiter.check("user-1");

    // user-2 should have full quota
    const result = limiter.check("user-2");

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2); // 3 - 1
  });

  // ── Multiple limiter instances ──────────────────────────────────────────

  it("two limiter instances have completely separate stores", () => {
    const limiterA = createRateLimiter({ maxRequests: 1, windowMs: 60_000 });
    const limiterB = createRateLimiter({ maxRequests: 5, windowMs: 60_000 });

    // Exhaust limiterA for user-1
    limiterA.check("user-1");
    const blockedInA = limiterA.check("user-1");

    // limiterB for the same user should be unaffected
    const allowedInB = limiterB.check("user-1");

    expect(blockedInA.allowed).toBe(false);
    expect(allowedInB.allowed).toBe(true);
  });

  // ── Edge cases ──────────────────────────────────────────────────────────

  it("allows exactly maxRequests requests and blocks the next one", () => {
    const maxRequests = 5;
    const limiter = createRateLimiter({ maxRequests, windowMs: 60_000 });

    const results = Array.from({ length: maxRequests }, () =>
      limiter.check("user-1")
    );

    // All maxRequests calls should be allowed
    results.forEach((r) => expect(r.allowed).toBe(true));

    // The next one should be blocked
    const blocked = limiter.check("user-1");
    expect(blocked.allowed).toBe(false);
  });

  it("handles a maxRequests of 1 correctly", () => {
    const limiter = createRateLimiter({ maxRequests: 1, windowMs: 60_000 });

    const first = limiter.check("user-1");
    const second = limiter.check("user-1");

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// aiSearchLimiter (pre-configured instance)
// ─────────────────────────────────────────────────────────────────────────────

describe("aiSearchLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-06-15T10:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows 10 requests within an hour", () => {
    // Use a unique userId to avoid state from other tests that may
    // have used the shared aiSearchLimiter instance
    const userId = `test-user-${Date.now()}`;

    const results = Array.from({ length: 10 }, () =>
      aiSearchLimiter.check(userId)
    );

    results.forEach((r) => expect(r.allowed).toBe(true));
  });

  it("blocks the 11th request within the same hour", () => {
    const userId = `test-user-${Date.now()}-b`;

    // Exhaust all 10 slots
    Array.from({ length: 10 }, () => aiSearchLimiter.check(userId));

    const eleventh = aiSearchLimiter.check(userId);

    expect(eleventh.allowed).toBe(false);
  });

  it("returns remaining of 9 after the first request", () => {
    const userId = `test-user-${Date.now()}-c`;

    const result = aiSearchLimiter.check(userId);

    expect(result.remaining).toBe(9);
  });
});
