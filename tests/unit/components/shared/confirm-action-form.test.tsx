/**
 * @file ConfirmActionForm Component Unit Tests
 * @description Tests for the confirmation dialog form component.
 *
 * Covers:
 *   - Renders trigger button with correct label and variant
 *   - Dialog is closed by default
 *   - Dialog opens on trigger click
 *   - Dialog renders title and description
 *   - Without requiresReason: confirm button calls action immediately
 *   - Without requiresReason: no textarea rendered
 *   - With requiresReason: textarea is rendered
 *   - With requiresReason: shows character count
 *   - With requiresReason: shows "minimum 10 characters" warning
 *     when 1-9 chars entered
 *   - With requiresReason: confirm button disabled until reason >= 10 chars
 *   - With requiresReason: calls action with entityId and reason on confirm
 *   - On success: calls toast.success and closes dialog
 *   - On error: calls toast.error and does NOT close dialog
 *   - Cancel button closes the dialog without calling action
 *
 * The action prop is a plain vi.fn() — no module mock needed.
 * toast from sonner is mocked at the module level.
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ConfirmActionForm } from "@/components/shared/confirm-action-form";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { toast } from "sonner";

const mockToast = vi.mocked(toast);

// ── Helpers ─────────────────────────────────────────────────────────────────

const defaultProps = {
  entityId: "entity-1",
  title: "Are you sure?",
  description: "This action cannot be undone.",
  label: "Delete",
};

/**
 * Opens the dialog by clicking the trigger button.
 * Returns the userEvent instance for chaining.
 */
async function openDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Delete" }));
}

describe("ConfirmActionForm", () => {
  // ── Trigger button ──────────────────────────────────────────────────────

  it("renders the trigger button with the correct label", () => {
    const action = vi.fn().mockResolvedValue({ success: "Done!" });
    render(<ConfirmActionForm {...defaultProps} action={action} />);
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("renders trigger button with custom label", () => {
    const action = vi.fn().mockResolvedValue({ success: "Done!" });
    render(
      <ConfirmActionForm {...defaultProps} action={action} label="Suspend" />
    );
    expect(screen.getByRole("button", { name: "Suspend" })).toBeInTheDocument();
  });

  // ── Dialog open/close ───────────────────────────────────────────────────

  it("does not show dialog content by default", () => {
    const action = vi.fn().mockResolvedValue({ success: "Done!" });
    render(<ConfirmActionForm {...defaultProps} action={action} />);
    expect(screen.queryByText("Are you sure?")).not.toBeInTheDocument();
  });

  it("opens the dialog when trigger is clicked", async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue({ success: "Done!" });
    render(<ConfirmActionForm {...defaultProps} action={action} />);

    await openDialog(user);

    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
    expect(
      screen.getByText("This action cannot be undone.")
    ).toBeInTheDocument();
  });

  it("closes the dialog when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue({ success: "Done!" });
    render(<ConfirmActionForm {...defaultProps} action={action} />);

    await openDialog(user);
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(screen.queryByText("Are you sure?")).not.toBeInTheDocument();
    });
  });

  it("does not call action when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue({ success: "Done!" });
    render(<ConfirmActionForm {...defaultProps} action={action} />);

    await openDialog(user);
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(action).not.toHaveBeenCalled();
  });

  // ── Without requiresReason ──────────────────────────────────────────────

  it("does not render a textarea when requiresReason is false", async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue({ success: "Done!" });
    render(<ConfirmActionForm {...defaultProps} action={action} />);

    await openDialog(user);

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("calls action with entityId when confirmed without reason", async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue({ success: "Done!" });
    render(<ConfirmActionForm {...defaultProps} action={action} />);

    await openDialog(user);

    // The confirm button has the same label as the trigger
    const confirmButton = screen.getAllByRole("button", { name: "Delete" });
    // The confirm button is inside the dialog (second button)
    await user.click(confirmButton[confirmButton.length - 1]);

    await waitFor(() => {
      expect(action).toHaveBeenCalledWith("entity-1");
    });
  });

  it("calls toast.success and closes dialog on success", async () => {
    const user = userEvent.setup();
    const action = vi
      .fn()
      .mockResolvedValue({ success: "Deleted successfully!" });
    render(<ConfirmActionForm {...defaultProps} action={action} />);

    await openDialog(user);
    const confirmButtons = screen.getAllByRole("button", { name: "Delete" });
    await user.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith("Deleted successfully!");
    });

    await waitFor(() => {
      expect(screen.queryByText("Are you sure?")).not.toBeInTheDocument();
    });
  });

  it("calls toast.error and keeps dialog open on error", async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue({ error: "Permission denied." });
    render(<ConfirmActionForm {...defaultProps} action={action} />);

    await openDialog(user);
    const confirmButtons = screen.getAllByRole("button", { name: "Delete" });
    await user.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("Permission denied.");
    });

    // Dialog should remain open
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
  });

  // ── With requiresReason ─────────────────────────────────────────────────

  it("renders a textarea when requiresReason is true", async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue({ success: "Done!" });
    render(
      <ConfirmActionForm {...defaultProps} action={action} requiresReason />
    );

    await openDialog(user);

    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("shows character count as user types", async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue({ success: "Done!" });
    render(
      <ConfirmActionForm {...defaultProps} action={action} requiresReason />
    );

    await openDialog(user);
    await user.type(screen.getByRole("textbox"), "Hello");

    expect(screen.getByText(/5\/500 characters/)).toBeInTheDocument();
  });

  it("shows 'minimum 10 characters' warning when reason is 1-9 chars", async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue({ success: "Done!" });
    render(
      <ConfirmActionForm {...defaultProps} action={action} requiresReason />
    );

    await openDialog(user);
    await user.type(screen.getByRole("textbox"), "Too short");

    expect(screen.getByText(/minimum 10 characters/i)).toBeInTheDocument();
  });

  it("hides 'minimum 10 characters' warning when reason reaches 10 chars", async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue({ success: "Done!" });
    render(
      <ConfirmActionForm {...defaultProps} action={action} requiresReason />
    );

    await openDialog(user);
    await user.type(screen.getByRole("textbox"), "Exactly ten");

    expect(
      screen.queryByText(/minimum 10 characters/i)
    ).not.toBeInTheDocument();
  });

  it("confirm button is disabled when reason is empty", async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue({ success: "Done!" });
    render(
      <ConfirmActionForm {...defaultProps} action={action} requiresReason />
    );

    await openDialog(user);

    const confirmButtons = screen.getAllByRole("button", { name: "Delete" });
    const confirmButton = confirmButtons[confirmButtons.length - 1];
    expect(confirmButton).toBeDisabled();
  });

  it("confirm button is disabled when reason is fewer than 10 characters", async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue({ success: "Done!" });
    render(
      <ConfirmActionForm {...defaultProps} action={action} requiresReason />
    );

    await openDialog(user);
    await user.type(screen.getByRole("textbox"), "Short");

    const confirmButtons = screen.getAllByRole("button", { name: "Delete" });
    expect(confirmButtons[confirmButtons.length - 1]).toBeDisabled();
  });

  it("confirm button is enabled once reason has 10 or more characters", async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue({ success: "Done!" });
    render(
      <ConfirmActionForm {...defaultProps} action={action} requiresReason />
    );

    await openDialog(user);
    await user.type(
      screen.getByRole("textbox"),
      "This is a sufficient reason."
    );

    const confirmButtons = screen.getAllByRole("button", { name: "Delete" });
    expect(confirmButtons[confirmButtons.length - 1]).not.toBeDisabled();
  });

  it("calls action with entityId and trimmed reason on confirm", async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue({ success: "Done!" });
    render(
      <ConfirmActionForm {...defaultProps} action={action} requiresReason />
    );

    await openDialog(user);
    await user.type(
      screen.getByRole("textbox"),
      "  Repeated policy violations.  "
    );

    const confirmButtons = screen.getAllByRole("button", { name: "Delete" });
    await user.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => {
      expect(action).toHaveBeenCalledWith(
        "entity-1",
        "Repeated policy violations."
      );
    });
  });

  it("clears the reason field after successful confirmation", async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue({ success: "Done!" });
    render(
      <ConfirmActionForm {...defaultProps} action={action} requiresReason />
    );

    await openDialog(user);
    await user.type(
      screen.getByRole("textbox"),
      "A valid reason for this action."
    );

    const confirmButtons = screen.getAllByRole("button", { name: "Delete" });
    await user.click(confirmButtons[confirmButtons.length - 1]);

    // After dialog closes and reopens, reason should be cleared
    await waitFor(() => {
      expect(screen.queryByText("Are you sure?")).not.toBeInTheDocument();
    });

    // Reopen dialog — reason should be empty
    await openDialog(user);
    expect(screen.getByRole("textbox")).toHaveValue("");
  });
});
