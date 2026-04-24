/**
 * @file ReviewForm Component Unit Tests
 * @description Tests for the review create/edit form.
 *
 * Covers:
 *   - CREATE mode rendering: context block, "Submit Review" button
 *   - EDIT mode rendering: "Editing review for:" label, "Update Review" button,
 *     pre-filled values
 *   - Business name and service name displayed in context block
 *   - Comment character counter display and color change near limit
 *   - Submit without rating shows validation error
 *   - Successful create: calls createReview, toast.success, router.push("/bookings")
 *   - Successful create with onSuccess: calls onSuccess instead of router.push
 *   - Successful edit: calls updateReview with review id and values, toast.success
 *   - Server action error: calls toast.error, does not navigate
 *   - Cancel button calls router.back()
 *
 * Mocks:
 *   - @/lib/actions/review → createReview, updateReview
 *   - sonner → toast
 *   - next/navigation → overridden locally for stable router instance
 */

import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReviewForm } from "@/components/forms/review-form";

// ── Stable router mock ──────────────────────────────────────────────────────

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  refresh: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

// ── Other mocks ─────────────────────────────────────────────────────────────

vi.mock("@/lib/actions/review", () => ({
  createReview: vi.fn(),
  updateReview: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { createReview, updateReview } from "@/lib/actions/review";
import { toast } from "sonner";

const mockCreateReview = vi.mocked(createReview);
const mockUpdateReview = vi.mocked(updateReview);
const mockToast = vi.mocked(toast);

// ── Helpers ─────────────────────────────────────────────────────────────────

const baseProps = {
  bookingId: "booking-1",
  businessName: "Fresh Cuts",
  serviceName: "Classic Haircut",
};

function renderCreateForm(
  overrides: Partial<React.ComponentProps<typeof ReviewForm>> = {}
) {
  return render(<ReviewForm {...baseProps} {...overrides} />);
}

function renderEditForm(
  overrides: Partial<React.ComponentProps<typeof ReviewForm>> = {}
) {
  return render(
    <ReviewForm
      {...baseProps}
      initialData={{ id: "review-1", rating: 4, comment: "Great service!" }}
      {...overrides}
    />
  );
}

/**
 * Sets the textarea value in one shot using fireEvent.change.
 * This avoids the expensive per-keystroke overhead of userEvent.type,
 * which can time out for long strings under full-suite load.
 */
function setTextareaValue(value: string) {
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ────────────────────────────────────────────────────────────────────────────

describe("ReviewForm — Create mode", () => {
  // ── Static rendering ────────────────────────────────────────────────────

  it("renders the service name in the context block", () => {
    renderCreateForm();
    expect(screen.getByText("Classic Haircut")).toBeInTheDocument();
  });

  it("renders the business name in the context block", () => {
    renderCreateForm();
    expect(screen.getByText("Fresh Cuts")).toBeInTheDocument();
  });

  it("renders 'Reviewing:' label in create mode", () => {
    renderCreateForm();
    expect(screen.getByText("Reviewing:")).toBeInTheDocument();
  });

  it("renders the 'Submit Review' button", () => {
    renderCreateForm();
    expect(
      screen.getByRole("button", { name: "Submit Review" })
    ).toBeInTheDocument();
  });

  it("renders the Cancel button", () => {
    renderCreateForm();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("renders the star rating input", () => {
    renderCreateForm();
    expect(
      screen.getByRole("button", { name: "Rate 1 star" })
    ).toBeInTheDocument();
  });

  it("renders the comment textarea", () => {
    renderCreateForm();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders the character counter starting at 0/1000", () => {
    renderCreateForm();
    expect(screen.getByText("0 / 1000")).toBeInTheDocument();
  });

  // ── Character counter ───────────────────────────────────────────────────

  it("updates character counter as user types", async () => {
    const user = userEvent.setup();
    renderCreateForm();

    await user.type(screen.getByRole("textbox"), "Hello");

    expect(screen.getByText("5 / 1000")).toBeInTheDocument();
  });

  it("applies destructive color class when comment exceeds 90% of limit", () => {
    renderCreateForm();

    setTextareaValue("A".repeat(901));

    expect(screen.getByText("901 / 1000")).toHaveClass("text-destructive");
  });

  it("uses muted color class when comment is below 90% of limit", () => {
    renderCreateForm();

    setTextareaValue("Short comment");

    expect(screen.getByText("13 / 1000")).toHaveClass("text-muted-foreground");
  });

  // ── Validation ──────────────────────────────────────────────────────────

  it("shows rating validation error when submitting without selecting a rating", async () => {
    const user = userEvent.setup();
    renderCreateForm();

    await user.click(screen.getByRole("button", { name: "Submit Review" }));

    await waitFor(() => {
      expect(
        screen.getByText(/rating must be at least 1 star/i)
      ).toBeInTheDocument();
    });
  });

  it("does not call createReview when form is invalid", async () => {
    const user = userEvent.setup();
    renderCreateForm();

    await user.click(screen.getByRole("button", { name: "Submit Review" }));

    await waitFor(() => {
      expect(mockCreateReview).not.toHaveBeenCalled();
    });
  });

  // ── Successful submission ───────────────────────────────────────────────

  it("calls createReview with correct values on valid submission", async () => {
    const user = userEvent.setup();
    mockCreateReview.mockResolvedValue({ success: "Review submitted!" });
    renderCreateForm();

    await user.click(screen.getByRole("button", { name: "Rate 5 stars" }));
    setTextareaValue("Excellent service!");
    await user.click(screen.getByRole("button", { name: "Submit Review" }));

    await waitFor(() => {
      expect(mockCreateReview).toHaveBeenCalledWith({
        bookingId: "booking-1",
        rating: 5,
        comment: "Excellent service!",
      });
    });
  });

  it("calls toast.success on successful submission", async () => {
    const user = userEvent.setup();
    mockCreateReview.mockResolvedValue({ success: "Review submitted!" });
    renderCreateForm();

    await user.click(screen.getByRole("button", { name: "Rate 4 stars" }));
    await user.click(screen.getByRole("button", { name: "Submit Review" }));

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith("Review submitted!");
    });
  });

  it("navigates to /bookings after successful submission when no onSuccess prop", async () => {
    const user = userEvent.setup();
    mockCreateReview.mockResolvedValue({ success: "Review submitted!" });
    renderCreateForm();

    await user.click(screen.getByRole("button", { name: "Rate 3 stars" }));
    await user.click(screen.getByRole("button", { name: "Submit Review" }));

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/bookings");
    });
  });

  it("calls onSuccess callback instead of router.push when provided", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    mockCreateReview.mockResolvedValue({ success: "Review submitted!" });
    renderCreateForm({ onSuccess });

    await user.click(screen.getByRole("button", { name: "Rate 5 stars" }));
    await user.click(screen.getByRole("button", { name: "Submit Review" }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledOnce();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  // ── Error handling ──────────────────────────────────────────────────────

  it("calls toast.error when server action returns an error", async () => {
    const user = userEvent.setup();
    mockCreateReview.mockResolvedValue({
      error: "You already reviewed this booking.",
    });
    renderCreateForm();

    await user.click(screen.getByRole("button", { name: "Rate 2 stars" }));
    await user.click(screen.getByRole("button", { name: "Submit Review" }));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        "You already reviewed this booking."
      );
    });
  });

  it("does not navigate when server action returns an error", async () => {
    const user = userEvent.setup();
    mockCreateReview.mockResolvedValue({ error: "Already reviewed." });
    renderCreateForm();

    await user.click(screen.getByRole("button", { name: "Rate 1 star" }));
    await user.click(screen.getByRole("button", { name: "Submit Review" }));

    await waitFor(() => {
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  // ── Cancel ──────────────────────────────────────────────────────────────

  it("calls router.back() when Cancel is clicked", async () => {
    const user = userEvent.setup();
    renderCreateForm();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(mockRouter.back).toHaveBeenCalled();
  });
});

// ────────────────────────────────────────────────────────────────────────────

describe("ReviewForm — Edit mode", () => {
  it("renders 'Editing review for:' label", () => {
    renderEditForm();
    expect(screen.getByText("Editing review for:")).toBeInTheDocument();
  });

  it("renders 'Update Review' button instead of 'Submit Review'", () => {
    renderEditForm();
    expect(
      screen.getByRole("button", { name: "Update Review" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Submit Review" })
    ).not.toBeInTheDocument();
  });

  it("pre-fills comment with initialData value", () => {
    renderEditForm();
    expect(screen.getByRole("textbox")).toHaveValue("Great service!");
  });

  it("pre-fills character counter with the initial comment length", () => {
    renderEditForm();
    expect(screen.getByText("14 / 1000")).toBeInTheDocument();
  });

  it("calls updateReview with the review id and form values on submission", async () => {
    const user = userEvent.setup();
    mockUpdateReview.mockResolvedValue({ success: "Review updated!" });
    renderEditForm();

    await user.clear(screen.getByRole("textbox"));
    setTextareaValue("Even better on reflection!");

    await user.click(screen.getByRole("button", { name: "Update Review" }));

    await waitFor(() => {
      expect(mockUpdateReview).toHaveBeenCalledWith("review-1", {
        rating: 4,
        comment: "Even better on reflection!",
      });
    });
  });

  it("calls toast.success on successful update", async () => {
    const user = userEvent.setup();
    mockUpdateReview.mockResolvedValue({ success: "Review updated!" });
    renderEditForm();

    await user.click(screen.getByRole("button", { name: "Update Review" }));

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith("Review updated!");
    });
  });

  it("does not call createReview in edit mode", async () => {
    const user = userEvent.setup();
    mockUpdateReview.mockResolvedValue({ success: "Updated!" });
    renderEditForm();

    await user.click(screen.getByRole("button", { name: "Update Review" }));

    await waitFor(() => {
      expect(mockCreateReview).not.toHaveBeenCalled();
    });
  });
});
