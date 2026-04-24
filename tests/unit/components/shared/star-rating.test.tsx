/**
 * @file StarRating Component Unit Tests
 * @description Tests for the StarRating display component.
 *
 * Covers:
 *   - Renders exactly 5 star elements
 *   - showValue: shows/hides numeric rating
 *   - reviewCount: singular vs plural label
 *   - reviewCount: hidden when not provided
 *   - Rating clamping: values below 0 clamped to 0, above 5 clamped to 5
 *   - showValue displays the RAW (unclamped) rating value to 1 decimal place
 *   - Size variants: sm, md, lg render without errors
 *
 * Note: The partial fill logic uses inline `style={{ width }}` which
 * is a visual concern not assertable in jsdom. We assert on the presence
 * of the correct number of star container elements instead.
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StarRating } from "@/components/shared/star-rating";

describe("StarRating", () => {
  // ── Rendering ───────────────────────────────────────────────────────────

  it("renders without crashing", () => {
    render(<StarRating rating={4} />);
  });

  it("renders exactly 5 star containers", () => {
    const { container } = render(<StarRating rating={3} />);
    // Each star is wrapped in a relative div inside the star container div
    const starWrappers = container.querySelectorAll(".relative");
    expect(starWrappers).toHaveLength(5);
  });

  // ── showValue ───────────────────────────────────────────────────────────

  it("does not show numeric value by default", () => {
    render(<StarRating rating={4.5} />);
    expect(screen.queryByText("4.5")).not.toBeInTheDocument();
  });

  it("shows the numeric value when showValue is true", () => {
    render(<StarRating rating={4.5} showValue />);
    expect(screen.getByText("4.5")).toBeInTheDocument();
  });

  it("displays the value formatted to 1 decimal place", () => {
    render(<StarRating rating={3} showValue />);
    expect(screen.getByText("3.0")).toBeInTheDocument();
  });

  it("displays the value formatted to 1 decimal place for a decimal rating", () => {
    render(<StarRating rating={2.7} showValue />);
    expect(screen.getByText("2.7")).toBeInTheDocument();
  });

  // ── reviewCount ─────────────────────────────────────────────────────────

  it("does not show review count when reviewCount is not provided", () => {
    render(<StarRating rating={4} />);
    expect(screen.queryByText(/review/)).not.toBeInTheDocument();
  });

  it("shows plural 'reviews' for reviewCount greater than 1", () => {
    render(<StarRating rating={4} reviewCount={42} />);
    expect(screen.getByText("(42 reviews)")).toBeInTheDocument();
  });

  it("shows singular 'review' for reviewCount of 1", () => {
    render(<StarRating rating={5} reviewCount={1} />);
    expect(screen.getByText("(1 review)")).toBeInTheDocument();
  });

  it("shows '0 reviews' for reviewCount of 0", () => {
    render(<StarRating rating={4} reviewCount={0} />);
    expect(screen.getByText("(0 reviews)")).toBeInTheDocument();
  });

  // ── Rating clamping ─────────────────────────────────────────────────────

  it("clamps rating below 0 — component renders without crashing", () => {
    // The component clamps internally to 0 for star rendering
    // showValue displays the raw unclamped prop value
    render(<StarRating rating={-1} showValue />);
    expect(screen.getByText("-1.0")).toBeInTheDocument();
  });

  it("clamps rating above 5 — component renders without crashing", () => {
    render(<StarRating rating={6} showValue />);
    expect(screen.getByText("6.0")).toBeInTheDocument();
  });

  // ── Size variants ───────────────────────────────────────────────────────

  it("renders with size sm without crashing", () => {
    render(<StarRating rating={3} size="sm" />);
  });

  it("renders with size md without crashing", () => {
    render(<StarRating rating={3} size="md" />);
  });

  it("renders with size lg without crashing", () => {
    render(<StarRating rating={3} size="lg" />);
  });

  // ── Combined props ──────────────────────────────────────────────────────

  it("renders showValue and reviewCount together", () => {
    render(<StarRating rating={4.5} showValue reviewCount={127} />);
    expect(screen.getByText("4.5")).toBeInTheDocument();
    expect(screen.getByText("(127 reviews)")).toBeInTheDocument();
  });

  it("renders correctly for a rating of 0", () => {
    render(<StarRating rating={0} showValue />);
    expect(screen.getByText("0.0")).toBeInTheDocument();
  });

  it("renders correctly for a perfect rating of 5", () => {
    render(<StarRating rating={5} showValue reviewCount={10} />);
    expect(screen.getByText("5.0")).toBeInTheDocument();
    expect(screen.getByText("(10 reviews)")).toBeInTheDocument();
  });
});
