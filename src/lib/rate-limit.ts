/**
 * @file Rate Limiter
 * @description In-memory rate limiting for AI-powered features.
 *
 * Implements a sliding window rate limiter using a simple Map.
 * Each user gets a fixed number of requests per time window.
 *
 * Architecture decisions:
 *   - In-memory (no Redis) — sufficient for single-instance deployments
 *   - Per-user tracking via user ID
 *   - Automatic cleanup of expired entries to prevent memory leaks
 *   - Extension point for subscription-based tier overrides
 *
 * Limitations:
 *   - Rate limit state is lost on server restart
 *   - Not shared across multiple server instances (for multi-instance
 *     deployments, swap to Redis or an external rate limit service)
 *
 * @example
 * ```ts
 * const limiter = createRateLimiter({ maxRequests: 10, windowMs: 60 * 60 * 1000 });
 *
 * const result = limiter.check("user_123");
 * if (!result.allowed) {
 *   return { error: `Rate limit exceeded. Try again in ${result.retryAfterMs}ms.` };
 * }
 * ```
 */

// =============================================================================
// Types
// =============================================================================

/** Configuration for a rate limiter instance. */
export interface RateLimiterConfig {
  /** Maximum number of requests allowed per window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
}

/** Result of a rate limit check */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Number of remaining requests in the current window */
  remaining: number;
  /** Milliseconds until the rate limit resets (0 if allowed) */
  retryAfterMs: number;
}

/** Tracked request timestamp for a single user */
interface UserRequests {
  /** Timestamps (n ms) of requests within the current window */
  timestamps: number[];
}

// =============================================================================
// Rate Limiter Factory
// =============================================================================

/**
 * Creates a rate limit instance with the specified configuration.
 *
 * Each limiter maintains its own in-memory store of request timestamps
 * per user. Multiple limiters can exist for different features.
 *
 * @param config - Rate limiting configuration
 * @returns Object with `check` method for rate limit enforcement
 */
export function createRateLimiter(config: RateLimiterConfig) {
  const { maxRequests, windowMs } = config;

  /** In-memory store : userId → request timestamps. */
  const store = new Map<string, UserRequests>();

  /**
   * Interval to periodically clean up expired entries.
   * Runs every 5 minutes to prevent unbounded memory growth.
   */
  const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

  let cleanupTimer: ReturnType<typeof setInterval> | null = null;

  /** Starts the clean up timer (only on first use) */
  function ensureCleanup() {
    if (cleanupTimer) return;

    cleanupTimer = setInterval(() => {
      const now = Date.now();
      const cutoff = now - windowMs;

      for (const [userId, data] of store.entries()) {
        // Remove timestamps outside the window
        data.timestamps = data.timestamps.filter((t) => t > cutoff);

        // Remove the user entry entirely if no timestamps remain
        if (data.timestamps.length === 0) {
          store.delete(userId);
        }
      }
    }, CLEANUP_INTERVAL_MS);

    // Don't block process exit
    if (
      cleanupTimer &&
      typeof cleanupTimer === "object" &&
      "unref" in cleanupTimer
    ) {
      cleanupTimer.unref();
    }
  }

  /**
   * Checks whether a user is within their rate limit, and if so,
   * records the request.
   *
   * @param userId - The user's unique identifier
   * @returns RateLimitResult indicating whether the request is allowed
   */
  function check(userId: string): RateLimitResult {
    ensureCleanup();

    const now = Date.now();
    const windowStart = now - windowMs;

    // Get or create the user's request history
    let userData = store.get(userId);

    if (!userData) {
      userData = { timestamps: [] };
      store.set(userId, userData);
    }

    // Filter out timestamps outside the current window
    userData.timestamps = userData.timestamps.filter((t) => t > windowStart);

    // Check if the user has exceeded their limit
    if (userData.timestamps.length >= maxRequests) {
      // Find the oldest timestamp in the window to calculate retry time
      const oldestTimestamp = userData.timestamps[0];
      const retryAfterMs = oldestTimestamp + windowMs - now;

      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: Math.max(0, retryAfterMs),
      };
    }

    // Record this request
    userData.timestamps.push(now);

    return {
      allowed: true,
      remaining: maxRequests - userData.timestamps.length,
      retryAfterMs: 0,
    };
  }

  return { check };
}

// =============================================================================
// Pre-configured Rate Limiters
// =============================================================================

/**
 * Rate limiters for AI-powered search.
 * 10 searches per hour per user.
 */
export const aiSearchLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 60 * 60 * 1000, // 1 hour
});
