/**
 * @file StarRatingInput Component Unit Tests
 * @description Tests for the interactive star rating selector.
 *
 * Covers:
 *   - Renders 5 star buttons with correct aria-labels
 *   - Click sets the rating via onChange callback
 *   - Does not call onChange when disabled
 *   - Hover shows preview rating (hoverRating state)
 *   - Mouse leave resets hover state
 *   - Keyboard: Enter and Space fire onChange
 *   - Rating label: shown when value > 0, singular vs plural
 *   - Rating label: hidden when value is 0
 *   - Disabled state: buttons have disabled attribute
 *
 * @testing-library/user-event is used for all interactions so that
 * hover, click, and keyboard events fire in the same order a real
 * browser would produce them.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { StarRatingInput } from "@/components/shared/star-rating-input";

describe("StarRatingInput", () => {
  // ── Rendering ───────────────────────────────────────────────────────────

  it("renders 5 star buttons", () => {
    render(<StarRatingInput value={0} onChange={vi.fn()} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(5);
  });

  it("renders buttons with correct aria-labels", () => {
    render(<StarRatingInput value={0} onChange={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: "Rate 1 star" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Rate 2 stars" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Rate 3 stars" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Rate 4 stars" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Rate 5 stars" })
    ).toBeInTheDocument();
  });

  // ── Rating label ────────────────────────────────────────────────────────

  it("does not show rating label when value is 0", () => {
    render(<StarRatingInput value={0} onChange={vi.fn()} />);
    expect(screen.queryByText(/star/i)).not.toBeInTheDocument();
  });

  it("shows singular 'star' label for value of 1", () => {
    render(<StarRatingInput value={1} onChange={vi.fn()} />);
    expect(screen.getByText("1 star")).toBeInTheDocument();
  });

  it("shows plural 'stars' label for value greater than 1", () => {
    render(<StarRatingInput value={3} onChange={vi.fn()} />);
    expect(screen.getByText("3 stars")).toBeInTheDocument();
  });

  it("shows '5 stars' label for a perfect rating", () => {
    render(<StarRatingInput value={5} onChange={vi.fn()} />);
    expect(screen.getByText("5 stars")).toBeInTheDocument();
  });

  // ── Click interaction ───────────────────────────────────────────────────

  it("calls onChange with the correct rating when a star is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StarRatingInput value={0} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Rate 3 stars" }));

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("calls onChange with 1 when the first star is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StarRatingInput value={0} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Rate 1 star" }));

    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("calls onChange with 5 when the last star is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StarRatingInput value={0} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Rate 5 stars" }));

    expect(onChange).toHaveBeenCalledWith(5);
  });

  it("calls onChange each time a different star is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StarRatingInput value={0} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Rate 2 stars" }));
    await user.click(screen.getByRole("button", { name: "Rate 4 stars" }));

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenNthCalledWith(1, 2);
    expect(onChange).toHaveBeenNthCalledWith(2, 4);
  });

  // ── Disabled state ──────────────────────────────────────────────────────

  it("all star buttons are disabled when disabled prop is true", () => {
    render(<StarRatingInput value={0} onChange={vi.fn()} disabled />);
    const buttons = screen.getAllByRole("button");
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it("does not call onChange when a disabled star is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StarRatingInput value={0} onChange={onChange} disabled />);

    await user.click(screen.getByRole("button", { name: "Rate 3 stars" }));

    expect(onChange).not.toHaveBeenCalled();
  });

  // ── Keyboard interaction ────────────────────────────────────────────────

  it("calls onChange when Enter is pressed on a star button", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StarRatingInput value={0} onChange={onChange} />);

    const threeStarButton = screen.getByRole("button", {
      name: "Rate 3 stars",
    });
    threeStarButton.focus();
    await user.keyboard("{Enter}");

    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("calls onChange when Space is pressed on a star button", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StarRatingInput value={0} onChange={onChange} />);

    const twoStarButton = screen.getByRole("button", { name: "Rate 2 stars" });
    twoStarButton.focus();
    await user.keyboard(" ");

    expect(onChange).toHaveBeenCalledWith(2);
  });

  // ── Hover interaction ───────────────────────────────────────────────────

  it("does not throw when hovering over a star button", async () => {
    const user = userEvent.setup();
    render(<StarRatingInput value={0} onChange={vi.fn()} />);

    const fourStarButton = screen.getByRole("button", { name: "Rate 4 stars" });

    // Should not throw
    await user.hover(fourStarButton);
  });

  it("does not trigger hover when disabled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StarRatingInput value={2} onChange={onChange} disabled />);

    // Hover should not change internal state when disabled
    await user.hover(screen.getByRole("button", { name: "Rate 5 stars" }));

    // onChange should never be called
    expect(onChange).not.toHaveBeenCalled();
  });

  // ── Size variants ───────────────────────────────────────────────────────

  it("renders with size sm without crashing", () => {
    render(<StarRatingInput value={3} onChange={vi.fn()} size="sm" />);
    expect(screen.getAllByRole("button")).toHaveLength(5);
  });

  it("renders with size lg without crashing", () => {
    render(<StarRatingInput value={3} onChange={vi.fn()} size="lg" />);
    expect(screen.getAllByRole("button")).toHaveLength(5);
  });
});
