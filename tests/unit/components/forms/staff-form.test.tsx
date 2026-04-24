/**
 * @file StaffForm Component Unit Tests
 * @description Tests for the staff member create/edit form.
 *
 * Covers:
 *   - CREATE mode: "Add Staff Member" button, empty default values
 *   - EDIT mode: "Save Changes" button, pre-filled field values
 *   - Validation: name is required (min 2 chars)
 *   - Validation: optional email must be valid format when provided
 *   - Successful create: calls createStaff with values, toast.success,
 *     resets form, calls onSuccess
 *   - Successful edit: calls updateStaff with staffId and values
 *   - Server error: calls toast.error, does not call onSuccess
 *
 * Mocks:
 *   - @/lib/actions/staff → createStaff, updateStaff
 *   - sonner → toast
 */

import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { StaffForm } from "@/components/forms/staff-form";

vi.mock("@/lib/actions/staff", () => ({
  createStaff: vi.fn(),
  updateStaff: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { createStaff, updateStaff } from "@/lib/actions/staff";
import { toast } from "sonner";

const mockCreateStaff = vi.mocked(createStaff);
const mockUpdateStaff = vi.mocked(updateStaff);
const mockToast = vi.mocked(toast);

// ── Helpers ──────────────────────────────────────────────────────────────────

function renderCreateForm(
  overrides: Partial<React.ComponentProps<typeof StaffForm>> = {}
) {
  return render(<StaffForm {...overrides} />);
}

function renderEditForm(
  overrides: Partial<React.ComponentProps<typeof StaffForm>> = {}
) {
  return render(
    <StaffForm
      initialData={{
        name: "Abebe Kebede",
        email: "abebe@example.com",
        phone: "+251911223344",
        title: "Senior Barber",
      }}
      staffId="staff-1"
      {...overrides}
    />
  );
}

/**
 * Submits the form element directly via fireEvent.submit, bypassing
 * JSDOM's native browser constraint validation on type="email" / type="tel".
 * Without this, JSDOM silently blocks submission before react-hook-form
 * or Zod ever runs, so validation error messages never appear.
 *
 * We use document.querySelector("form") instead of getByRole("form") because
 * the role "form" is only exposed when the element has an accessible name —
 * we deliberately avoid requiring that change in the component.
 */
function submitForm() {
  fireEvent.submit(document.querySelector("form")!);
}

// ── Reset mock call history before every test ────────────────────────────────
// Without this, call counts from earlier tests bleed into later assertions
// (e.g. "not.toHaveBeenCalled()" fails because it sees calls from prior tests).

beforeEach(() => {
  vi.clearAllMocks();
});

// ────────────────────────────────────────────────────────────────────────────

describe("StaffForm — Create mode", () => {
  // ── Rendering ───────────────────────────────────────────────────────────

  it("renders the 'Add Staff Member' submit button", () => {
    renderCreateForm();
    expect(
      screen.getByRole("button", { name: "Add Staff Member" })
    ).toBeInTheDocument();
  });

  it("renders all four input fields", () => {
    renderCreateForm();
    expect(
      screen.getByPlaceholderText("e.g., Abebe Kebede")
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("e.g., Senior Barber, Lead Stylist")
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("email@example.com")
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("+251-9XX-XXXXXX")).toBeInTheDocument();
  });

  it("starts with empty field values", () => {
    renderCreateForm();
    expect(screen.getByPlaceholderText("e.g., Abebe Kebede")).toHaveValue("");
    expect(
      screen.getByPlaceholderText("e.g., Senior Barber, Lead Stylist")
    ).toHaveValue("");
  });

  // ── Validation ──────────────────────────────────────────────────────────

  it("shows validation error when name is empty on submit", async () => {
    const user = userEvent.setup();
    renderCreateForm();

    await user.click(screen.getByRole("button", { name: "Add Staff Member" }));

    await waitFor(() => {
      expect(
        screen.getByText(/name must be at least 2 characters/i)
      ).toBeInTheDocument();
    });
  });

  it("shows validation error when name is only 1 character", async () => {
    const user = userEvent.setup();
    renderCreateForm();

    await user.type(screen.getByPlaceholderText("e.g., Abebe Kebede"), "A");
    await user.click(screen.getByRole("button", { name: "Add Staff Member" }));

    await waitFor(() => {
      expect(
        screen.getByText(/name must be at least 2 characters/i)
      ).toBeInTheDocument();
    });
  });

  it("shows validation error for invalid email format", async () => {
    renderCreateForm();

    // Set field values via fireEvent.change to bypass JSDOM's native
    // constraint validation on type="email", which would otherwise silently
    // block the submit event before react-hook-form / Zod ever runs.
    fireEvent.change(screen.getByPlaceholderText("e.g., Abebe Kebede"), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByPlaceholderText("email@example.com"), {
      target: { value: "not-an-email" },
    });

    // Submit via the form element directly — same reason as above.
    submitForm();

    await waitFor(() => {
      expect(
        screen.getByText(/please enter a valid email address/i)
      ).toBeInTheDocument();
    });
  });

  it("does not call createStaff when form is invalid", async () => {
    const user = userEvent.setup();
    renderCreateForm();

    await user.click(screen.getByRole("button", { name: "Add Staff Member" }));

    await waitFor(() => {
      expect(mockCreateStaff).not.toHaveBeenCalled();
    });
  });

  // ── Successful submission ───────────────────────────────────────────────

  it("calls createStaff with correct values on valid submission", async () => {
    const user = userEvent.setup();
    mockCreateStaff.mockResolvedValue({ success: "Staff member added!" });
    renderCreateForm();

    await user.type(
      screen.getByPlaceholderText("e.g., Abebe Kebede"),
      "Tigist Haile"
    );
    await user.type(
      screen.getByPlaceholderText("e.g., Senior Barber, Lead Stylist"),
      "Junior Stylist"
    );

    // Use fireEvent.change for email and phone to avoid JSDOM native
    // constraint validation blocking userEvent interactions on
    // type="email" and type="tel" inputs.
    fireEvent.change(screen.getByPlaceholderText("email@example.com"), {
      target: { value: "tigist@salon.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("+251-9XX-XXXXXX"), {
      target: { value: "+251922334455" },
    });

    await user.click(screen.getByRole("button", { name: "Add Staff Member" }));

    await waitFor(() => {
      expect(mockCreateStaff).toHaveBeenCalledWith({
        name: "Tigist Haile",
        title: "Junior Stylist",
        email: "tigist@salon.com",
        phone: "+251922334455",
      });
    });
  });

  it("calls createStaff with only name when optional fields are empty", async () => {
    const user = userEvent.setup();
    mockCreateStaff.mockResolvedValue({ success: "Staff member added!" });
    renderCreateForm();

    await user.type(
      screen.getByPlaceholderText("e.g., Abebe Kebede"),
      "Mekdes Alemu"
    );
    await user.click(screen.getByRole("button", { name: "Add Staff Member" }));

    await waitFor(() => {
      expect(mockCreateStaff).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Mekdes Alemu" })
      );
    });
  });

  it("calls toast.success after successful creation", async () => {
    const user = userEvent.setup();
    mockCreateStaff.mockResolvedValue({ success: "Staff member added!" });
    renderCreateForm();

    await user.type(
      screen.getByPlaceholderText("e.g., Abebe Kebede"),
      "Solomon Tesfaye"
    );
    await user.click(screen.getByRole("button", { name: "Add Staff Member" }));

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith("Staff member added!");
    });
  });

  it("calls onSuccess after successful creation", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    mockCreateStaff.mockResolvedValue({ success: "Added!" });
    renderCreateForm({ onSuccess });

    await user.type(
      screen.getByPlaceholderText("e.g., Abebe Kebede"),
      "Hiwot Bekele"
    );
    await user.click(screen.getByRole("button", { name: "Add Staff Member" }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledOnce();
    });
  });

  // ── Error handling ──────────────────────────────────────────────────────

  it("calls toast.error when server action returns an error", async () => {
    const user = userEvent.setup();
    mockCreateStaff.mockResolvedValue({ error: "Staff limit reached." });
    renderCreateForm();

    await user.type(
      screen.getByPlaceholderText("e.g., Abebe Kebede"),
      "New Staff"
    );
    await user.click(screen.getByRole("button", { name: "Add Staff Member" }));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("Staff limit reached.");
    });
  });

  it("does not call onSuccess when server action returns an error", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    mockCreateStaff.mockResolvedValue({ error: "Failed." });
    renderCreateForm({ onSuccess });

    await user.type(
      screen.getByPlaceholderText("e.g., Abebe Kebede"),
      "New Staff"
    );
    await user.click(screen.getByRole("button", { name: "Add Staff Member" }));

    await waitFor(() => {
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });
});

// ────────────────────────────────────────────────────────────────────────────

describe("StaffForm — Edit mode", () => {
  // ── Rendering ───────────────────────────────────────────────────────────

  it("renders 'Save Changes' button in edit mode", () => {
    renderEditForm();
    expect(
      screen.getByRole("button", { name: "Save Changes" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Add Staff Member" })
    ).not.toBeInTheDocument();
  });

  it("pre-fills name field with initialData", () => {
    renderEditForm();
    expect(screen.getByPlaceholderText("e.g., Abebe Kebede")).toHaveValue(
      "Abebe Kebede"
    );
  });

  it("pre-fills email field with initialData", () => {
    renderEditForm();
    expect(screen.getByPlaceholderText("email@example.com")).toHaveValue(
      "abebe@example.com"
    );
  });

  it("pre-fills phone field with initialData", () => {
    renderEditForm();
    expect(screen.getByPlaceholderText("+251-9XX-XXXXXX")).toHaveValue(
      "+251911223344"
    );
  });

  it("pre-fills title field with initialData", () => {
    renderEditForm();
    expect(
      screen.getByPlaceholderText("e.g., Senior Barber, Lead Stylist")
    ).toHaveValue("Senior Barber");
  });

  // ── Successful edit ─────────────────────────────────────────────────────

  it("calls updateStaff with staffId and updated values", async () => {
    const user = userEvent.setup();
    mockUpdateStaff.mockResolvedValue({ success: "Staff updated!" });
    renderEditForm();

    const nameInput = screen.getByPlaceholderText("e.g., Abebe Kebede");
    await user.clear(nameInput);
    await user.type(nameInput, "Abebe Girma");

    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(mockUpdateStaff).toHaveBeenCalledWith(
        "staff-1",
        expect.objectContaining({ name: "Abebe Girma" })
      );
    });
  });

  it("calls toast.success on successful update", async () => {
    const user = userEvent.setup();
    mockUpdateStaff.mockResolvedValue({ success: "Staff updated!" });
    renderEditForm();

    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith("Staff updated!");
    });
  });

  it("does not call createStaff in edit mode", async () => {
    const user = userEvent.setup();
    mockUpdateStaff.mockResolvedValue({ success: "Updated!" });
    renderEditForm();

    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(mockCreateStaff).not.toHaveBeenCalled();
    });
  });

  it("calls onSuccess after successful edit", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    mockUpdateStaff.mockResolvedValue({ success: "Updated!" });
    renderEditForm({ onSuccess });

    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledOnce();
    });
  });

  it("calls toast.error when update fails", async () => {
    const user = userEvent.setup();
    mockUpdateStaff.mockResolvedValue({ error: "Update failed." });
    renderEditForm();

    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("Update failed.");
    });
  });
});
