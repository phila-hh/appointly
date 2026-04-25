/**
 * @file Review Validator Unit Tests
 * @description Tests for reviewSchema and createReviewSchema Zod validation.
 *
 * Covers:
 *   - reviewSchema: rating (1-5 integer), comment (optional, max 1000)
 *   - createReviewSchema: extends reviewSchema with required bookingId
 *
 * Pure input/output — no database, no network.
 */

import { describe, it, expect } from "vitest";
import { reviewSchema, createReviewSchema } from "@/lib/validators/review";

// ─────────────────────────────────────────────────────────────────────────────
// reviewSchema
// ─────────────────────────────────────────────────────────────────────────────

describe("reviewSchema", () => {
  // ── Happy path ──────────────────────────────────────────────────────────

  it("accepts valid rating with comment", () => {
    const result = reviewSchema.safeParse({
      rating: 5,
      comment: "Great service!",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid rating without comment", () => {
    const result = reviewSchema.safeParse({ rating: 3 });
    expect(result.success).toBe(true);
  });

  it("accepts valid rating with empty string comment", () => {
    const result = reviewSchema.safeParse({ rating: 4, comment: "" });
    expect(result.success).toBe(true);
  });

  // ── Rating validation ───────────────────────────────────────────────────

  it("accepts all valid rating values (1 through 5)", () => {
    for (let rating = 1; rating <= 5; rating++) {
      const result = reviewSchema.safeParse({ rating });
      expect(result.success, `Expected rating ${rating} to be valid`).toBe(
        true
      );
    }
  });

  it("rejects rating of 0", () => {
    const result = reviewSchema.safeParse({ rating: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects rating of 6", () => {
    const result = reviewSchema.safeParse({ rating: 6 });
    expect(result.success).toBe(false);
  });

  it("rejects negative rating", () => {
    const result = reviewSchema.safeParse({ rating: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects decimal rating", () => {
    const result = reviewSchema.safeParse({ rating: 3.5 });
    expect(result.success).toBe(false);
  });

  it("rejects non-number rating", () => {
    const result = reviewSchema.safeParse({ rating: "five" });
    expect(result.success).toBe(false);
  });

  it("rejects missing rating", () => {
    const result = reviewSchema.safeParse({ comment: "Great!" });
    expect(result.success).toBe(false);
  });

  // ── Comment validation ──────────────────────────────────────────────────

  it("rejects comment exceeding 1000 characters", () => {
    const result = reviewSchema.safeParse({
      rating: 5,
      comment: "A".repeat(1001),
    });
    expect(result.success).toBe(false);
  });

  it("accepts comment at exactly 1000 characters", () => {
    const result = reviewSchema.safeParse({
      rating: 5,
      comment: "A".repeat(1000),
    });
    expect(result.success).toBe(true);
  });

  // ── Empty object ────────────────────────────────────────────────────────

  it("rejects completely empty object", () => {
    const result = reviewSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// createReviewSchema (extends reviewSchema with bookingId)
// ─────────────────────────────────────────────────────────────────────────────

describe("createReviewSchema", () => {
  const validPayload = {
    rating: 4,
    comment: "Very good experience",
    bookingId: "booking-abc-123",
  };

  // ── Happy path ──────────────────────────────────────────────────────────

  it("accepts valid review with bookingId", () => {
    const result = createReviewSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("accepts review with bookingId and no comment", () => {
    const { comment: _comment, ...rest } = validPayload;
    const result = createReviewSchema.safeParse(rest);
    expect(result.success).toBe(true);
  });

  // ── bookingId validation ────────────────────────────────────────────────

  it("rejects empty bookingId", () => {
    const result = createReviewSchema.safeParse({
      ...validPayload,
      bookingId: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing bookingId", () => {
    const { bookingId: _bookingId, ...rest } = validPayload;
    const result = createReviewSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  // ── Inherits rating validation from reviewSchema ─────────────────────────

  it("still rejects invalid rating", () => {
    const result = createReviewSchema.safeParse({
      ...validPayload,
      rating: 0,
    });
    expect(result.success).toBe(false);
  });

  it("still rejects decimal rating", () => {
    const result = createReviewSchema.safeParse({
      ...validPayload,
      rating: 4.5,
    });
    expect(result.success).toBe(false);
  });

  // ── Inherits comment validation from reviewSchema ────────────────────────

  it("still rejects comment over 1000 characters", () => {
    const result = createReviewSchema.safeParse({
      ...validPayload,
      comment: "A".repeat(1001),
    });
    expect(result.success).toBe(false);
  });
});
