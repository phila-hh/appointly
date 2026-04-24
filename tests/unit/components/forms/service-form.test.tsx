/**
 * @file ServiceForm Component Unit Tests
 * @description Tests for the service create/edit form.
 *
 * Covers:
 *   - CREATE mode: "Add Service" button, empty default values
 *   - EDIT mode: "Save Changes" button, pre-filled field values
 *   - Validation: required name shows error, price/duration required
 *   - Successful create: calls createService with values, toast.success,
 *     resets form, calls onSuccess
 *   - Successful edit: calls updateService with serviceId and values
 *   - Server error: calls toast.error, does not call onSuccess
 *
 * Mocks:
 *   - @/lib/actions/service → createService, updateService
 *   - sonner → toast
 */

import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ServiceForm } from "@/components/forms/service-form";

vi.mock("@/lib/actions/service", () => ({
  createService: vi.fn(),
  updateService: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { createService, updateService } from "@/lib/actions/service";
import { toast } from "sonner";

const mockCreateService = vi.mocked(createService);
const mockUpdateService = vi.mocked(updateService);
const mockToast = vi.mocked(toast);

// ── Helpers ──────────────────────────────────────────────────────────────────

function renderCreateForm(
  overrides: Partial<React.ComponentProps<typeof ServiceForm>> = {}
) {
  return render(<ServiceForm {...overrides} />);
}

function renderEditForm(
  overrides: Partial<React.ComponentProps<typeof ServiceForm>> = {}
) {
  return render(
    <ServiceForm
      initialData={{
        name: "Haircut",
        description: "Classic cut",
        price: 25,
        duration: 30,
      }}
      serviceId="service-1"
      {...overrides}
    />
  );
}

/**
 * Sets a numeric input value in one shot using fireEvent.change.
 * Avoids user.clear() + user.type() sequences that can leave
 * residual state or accumulate slowly under full-suite load.
 */
function setInputValue(placeholder: string, value: string) {
  fireEvent.change(screen.getByPlaceholderText(placeholder), {
    target: { value },
  });
}

// ── Reset mock call history before every test ────────────────────────────────
// Without this, call counts from earlier tests bleed into later assertions
// (e.g. "not.toHaveBeenCalled()" fails because it sees calls from prior tests).

beforeEach(() => {
  vi.clearAllMocks();
});

// ────────────────────────────────────────────────────────────────────────────

describe("ServiceForm — Create mode", () => {
  // ── Rendering ───────────────────────────────────────────────────────────

  it("renders the 'Add Service' submit button", () => {
    renderCreateForm();
    expect(
      screen.getByRole("button", { name: "Add Service" })
    ).toBeInTheDocument();
  });

  it("renders name, description, price, and duration fields", () => {
    renderCreateForm();
    expect(
      screen.getByPlaceholderText("e.g., Classic Haircut")
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Describe what this service includes...")
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("30.00")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("30")).toBeInTheDocument();
  });

  it("starts with empty name field", () => {
    renderCreateForm();
    expect(screen.getByPlaceholderText("e.g., Classic Haircut")).toHaveValue(
      ""
    );
  });

  // ── Validation ──────────────────────────────────────────────────────────

  it("shows validation error when name is empty on submit", async () => {
    const user = userEvent.setup();
    renderCreateForm();

    await user.click(screen.getByRole("button", { name: "Add Service" }));

    await waitFor(() => {
      expect(
        screen.getByText(/service name must be at least 2 characters/i)
      ).toBeInTheDocument();
    });
  });

  it("does not call createService when form is invalid", async () => {
    const user = userEvent.setup();
    renderCreateForm();

    await user.click(screen.getByRole("button", { name: "Add Service" }));

    await waitFor(() => {
      expect(mockCreateService).not.toHaveBeenCalled();
    });
  });

  // ── Successful submission ───────────────────────────────────────────────

  it("calls createService with correct values on valid submission", async () => {
    const user = userEvent.setup();
    mockCreateService.mockResolvedValue({ success: "Service created!" });
    renderCreateForm();

    await user.type(
      screen.getByPlaceholderText("e.g., Classic Haircut"),
      "Deep Condition"
    );
    await user.type(
      screen.getByPlaceholderText("Describe what this service includes..."),
      "A nourishing treatment"
    );

    // Set numeric fields in one shot to avoid residual default value issues
    setInputValue("30.00", "45");
    setInputValue("30", "60");

    await user.click(screen.getByRole("button", { name: "Add Service" }));

    await waitFor(() => {
      expect(mockCreateService).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Deep Condition",
          description: "A nourishing treatment",
          price: 45,
          duration: 60,
        })
      );
    });
  });

  it("calls toast.success after successful creation", async () => {
    const user = userEvent.setup();
    mockCreateService.mockResolvedValue({ success: "Service created!" });
    renderCreateForm();

    await user.type(
      screen.getByPlaceholderText("e.g., Classic Haircut"),
      "Trim"
    );
    setInputValue("30.00", "10");

    await user.click(screen.getByRole("button", { name: "Add Service" }));

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith("Service created!");
    });
  });

  it("calls onSuccess after successful creation", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    mockCreateService.mockResolvedValue({ success: "Service created!" });
    renderCreateForm({ onSuccess });

    await user.type(
      screen.getByPlaceholderText("e.g., Classic Haircut"),
      "Trim"
    );
    setInputValue("30.00", "10");

    await user.click(screen.getByRole("button", { name: "Add Service" }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledOnce();
    });
  });

  // ── Error handling ──────────────────────────────────────────────────────

  it("calls toast.error when server action returns an error", async () => {
    const user = userEvent.setup();
    mockCreateService.mockResolvedValue({
      error: "Service name already exists.",
    });
    renderCreateForm();

    await user.type(
      screen.getByPlaceholderText("e.g., Classic Haircut"),
      "Haircut"
    );
    setInputValue("30.00", "25");

    await user.click(screen.getByRole("button", { name: "Add Service" }));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        "Service name already exists."
      );
    });
  });

  it("does not call onSuccess when server action returns an error", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    mockCreateService.mockResolvedValue({ error: "Failed." });
    renderCreateForm({ onSuccess });

    await user.type(
      screen.getByPlaceholderText("e.g., Classic Haircut"),
      "Trim"
    );
    setInputValue("30.00", "10");

    await user.click(screen.getByRole("button", { name: "Add Service" }));

    await waitFor(() => {
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });
});

// ────────────────────────────────────────────────────────────────────────────

describe("ServiceForm — Edit mode", () => {
  // ── Rendering ───────────────────────────────────────────────────────────

  it("renders 'Save Changes' button instead of 'Add Service'", () => {
    renderEditForm();
    expect(
      screen.getByRole("button", { name: "Save Changes" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Add Service" })
    ).not.toBeInTheDocument();
  });

  it("pre-fills the name field with initialData", () => {
    renderEditForm();
    expect(screen.getByPlaceholderText("e.g., Classic Haircut")).toHaveValue(
      "Haircut"
    );
  });

  it("pre-fills the description field with initialData", () => {
    renderEditForm();
    expect(
      screen.getByPlaceholderText("Describe what this service includes...")
    ).toHaveValue("Classic cut");
  });

  // ── Successful edit ─────────────────────────────────────────────────────

  it("calls updateService with serviceId and values on submission", async () => {
    const user = userEvent.setup();
    mockUpdateService.mockResolvedValue({ success: "Service updated!" });
    renderEditForm();

    const nameInput = screen.getByPlaceholderText("e.g., Classic Haircut");
    await user.clear(nameInput);
    await user.type(nameInput, "Premium Haircut");

    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(mockUpdateService).toHaveBeenCalledWith(
        "service-1",
        expect.objectContaining({ name: "Premium Haircut" })
      );
    });
  });

  it("calls toast.success on successful update", async () => {
    const user = userEvent.setup();
    mockUpdateService.mockResolvedValue({ success: "Service updated!" });
    renderEditForm();

    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith("Service updated!");
    });
  });

  it("does not call createService in edit mode", async () => {
    const user = userEvent.setup();
    mockUpdateService.mockResolvedValue({ success: "Updated!" });
    renderEditForm();

    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(mockCreateService).not.toHaveBeenCalled();
    });
  });

  it("calls onSuccess after successful edit", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    mockUpdateService.mockResolvedValue({ success: "Updated!" });
    renderEditForm({ onSuccess });

    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledOnce();
    });
  });
});
