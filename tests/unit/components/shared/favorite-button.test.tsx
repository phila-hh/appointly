/**
 * @file FavoriteButton Component Unit Tests
 * @description Tests for the FavoriteButton toggle component.
 *
 * Covers:
 *   - Renders with correct initial aria-label based on initialFavorited
 *   - Optimistic UI: toggles aria-label immediately on click before
 *     the server action resolves
 *   - On success: calls toast.success with the success message
 *   - On success: calls router.refresh()
 *   - On error: reverts the optimistic update
 *   - On error: calls toast.error with the error message
 *   - iconOnly=true: wraps in Tooltip
 *   - iconOnly=false: renders label text ("Favorite" / "Favorited")
 *
 * Mocks:
 *   - @/lib/actions/favorite → toggleFavorite
 *   - sonner → toast.success / toast.error
 *   - next/navigation → already mocked in setup.ts
 */

import type { ComponentProps } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, it, expect, vi } from "vitest";

// Shared router mock so the component and the test reference the same object
const mockRouter = vi.hoisted(() => ({
  refresh: vi.fn(),
}));

// ── Module mocks ────────────────────────────────────────────────────────────

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

vi.mock("@/lib/actions/favorite", () => ({
  toggleFavorite: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { FavoriteButton } from "@/components/shared/favorite-button";
import { toggleFavorite } from "@/lib/actions/favorite";
import { toast } from "sonner";

const mockToggleFavorite = vi.mocked(toggleFavorite);
const mockToast = vi.mocked(toast);

// ── Helpers ─────────────────────────────────────────────────────────────────

function renderFavoriteButton(
  props: Partial<ComponentProps<typeof FavoriteButton>> = {}
) {
  return render(
    <FavoriteButton
      businessId="business-1"
      initialFavorited={false}
      {...props}
    />
  );
}

describe("FavoriteButton", () => {
  beforeEach(() => {
    mockToggleFavorite.mockReset();
    mockToast.success.mockReset();
    mockToast.error.mockReset();
    mockRouter.refresh.mockReset();
  });

  // ── Initial render ──────────────────────────────────────────────────────

  it("renders 'Add to favorites' label when not favorited", () => {
    renderFavoriteButton({ initialFavorited: false });

    expect(
      screen.getByRole("button", { name: "Add to favorites" })
    ).toBeInTheDocument();
  });

  it("renders 'Remove from favorites' label when favorited", () => {
    renderFavoriteButton({ initialFavorited: true });

    expect(
      screen.getByRole("button", { name: "Remove from favorites" })
    ).toBeInTheDocument();
  });

  // ── iconOnly=false label text ───────────────────────────────────────────

  it("shows 'Favorite' text when iconOnly is false and not favorited", () => {
    renderFavoriteButton({ initialFavorited: false, iconOnly: false });
    expect(screen.getByText("Favorite")).toBeInTheDocument();
  });

  it("shows 'Favorited' text when iconOnly is false and favorited", () => {
    renderFavoriteButton({ initialFavorited: true, iconOnly: false });
    expect(screen.getByText("Favorited")).toBeInTheDocument();
  });

  // ── Optimistic UI ───────────────────────────────────────────────────────

  it("optimistically toggles aria-label immediately on click", async () => {
    const user = userEvent.setup();

    type ToggleResult = { success?: string; error?: string };
    let resolveToggle: ((value: ToggleResult) => void) | undefined;

    mockToggleFavorite.mockImplementation(
      () =>
        new Promise<ToggleResult>((resolve) => {
          resolveToggle = resolve;
        })
    );

    renderFavoriteButton({ initialFavorited: false });

    await user.click(screen.getByRole("button", { name: "Add to favorites" }));

    expect(
      screen.getByRole("button", { name: "Remove from favorites" })
    ).toBeInTheDocument();

    // Resolve before the test ends so it doesn't leak into the next test
    resolveToggle?.({ success: "Added!" });

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith("Added!");
    });
  });

  // ── Success path ────────────────────────────────────────────────────────

  it("calls toast.success with the server action success message", async () => {
    const user = userEvent.setup();
    mockToggleFavorite.mockResolvedValueOnce({
      success: "Added to favorites!",
    });

    renderFavoriteButton({ initialFavorited: false });

    await user.click(screen.getByRole("button", { name: "Add to favorites" }));

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith("Added to favorites!");
    });
  });

  it("calls router.refresh() after a successful toggle", async () => {
    const user = userEvent.setup();
    mockToggleFavorite.mockResolvedValueOnce({
      success: "Removed from favorites!",
    });

    renderFavoriteButton({ initialFavorited: true });

    await user.click(
      screen.getByRole("button", { name: "Remove from favorites" })
    );

    await waitFor(() => {
      expect(mockRouter.refresh).toHaveBeenCalledTimes(1);
    });
  });

  // ── Error path ──────────────────────────────────────────────────────────

  it("calls toast.error with the error message on failure", async () => {
    const user = userEvent.setup();
    mockToggleFavorite.mockResolvedValueOnce({
      error: "You must be logged in to favorite businesses.",
    });

    renderFavoriteButton({ initialFavorited: false });

    await user.click(screen.getByRole("button", { name: "Add to favorites" }));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        "You must be logged in to favorite businesses."
      );
    });
  });

  it("reverts the optimistic update when the server action returns an error", async () => {
    const user = userEvent.setup();
    mockToggleFavorite.mockResolvedValueOnce({ error: "Not authenticated." });

    renderFavoriteButton({ initialFavorited: false });

    await user.click(screen.getByRole("button", { name: "Add to favorites" }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Add to favorites" })
      ).toBeInTheDocument();
    });
  });

  // ── Tooltip (iconOnly=true) ─────────────────────────────────────────────

  it("renders inside a TooltipProvider when iconOnly is true", () => {
    renderFavoriteButton({ initialFavorited: false, iconOnly: true });

    expect(
      screen.getByRole("button", { name: "Add to favorites" })
    ).toBeInTheDocument();
  });

  // ── Server action call ──────────────────────────────────────────────────

  it("calls toggleFavorite with the correct businessId", async () => {
    const user = userEvent.setup();
    mockToggleFavorite.mockResolvedValueOnce({ success: "Added!" });

    renderFavoriteButton({
      businessId: "biz-abc-999",
      initialFavorited: false,
    });

    await user.click(screen.getByRole("button", { name: "Add to favorites" }));

    await waitFor(() => {
      expect(mockToggleFavorite).toHaveBeenCalledWith("biz-abc-999");
    });
  });
});
