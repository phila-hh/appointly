// tests/unit/components/shared/browse-pagination.test.tsx

/**
 * @file BrowsePagination Component Unit Tests
 * @description Tests for the URL-based pagination component.
 *
 * Covers:
 *   - Returns null when totalPages <= 1
 *   - Renders when totalPages > 1
 *   - getPageNumbers() windowing logic:
 *       - First page: shows pages 1-5
 *       - Middle page: centers around current page
 *       - Last page: shows last 5 pages
 *       - Total pages < 5: shows all pages
 *   - Previous button: disabled on page 1 (opacity-50 class)
 *   - Next button: disabled on last page (opacity-50 class)
 *   - Clicking a page number calls router.push with the correct URL
 *   - Clicking Next calls router.push with currentPage + 1
 *   - Clicking Previous calls router.push with currentPage - 1
 *   - Page 1 URL has no 'page' param (clean URL)
 *   - Page > 1 URL includes 'page' param
 *   - Existing search params are preserved when navigating
 *
 * Mocks:
 *   - next/navigation: locally overridden for stable behavior
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowsePagination } from "@/components/shared/browse-pagination";

// ── Stable navigation mocks ────────────────────────────────────────────────

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  useSearchParams: vi.fn(),
  usePathname: vi.fn(),
}));

import { useSearchParams, usePathname } from "next/navigation";

const mockUseSearchParams = vi.mocked(useSearchParams);
const mockUsePathname = vi.mocked(usePathname);

// ── Default mock setup ─────────────────────────────────────────────────────

function setupMocks({
  pathname = "/browse",
  searchParams = new URLSearchParams(),
} = {}) {
  mockUsePathname.mockReturnValue(pathname);
  mockUseSearchParams.mockReturnValue(searchParams as any);
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ──────────────────────────────────────────────────────────────────────────

describe("BrowsePagination", () => {
  // ── Null rendering ──────────────────────────────────────────────────────

  it("returns null when totalPages is 1", () => {
    setupMocks();
    const { container } = render(
      <BrowsePagination currentPage={1} totalPages={1} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("returns null when totalPages is 0", () => {
    setupMocks();
    const { container } = render(
      <BrowsePagination currentPage={1} totalPages={0} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders pagination when totalPages is greater than 1", () => {
    setupMocks();
    render(<BrowsePagination currentPage={1} totalPages={5} />);
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  // ── Page number windowing ──────────────────────────────────────────────

  it("shows pages 1-5 when on page 1 with many total pages", () => {
    setupMocks();
    render(<BrowsePagination currentPage={1} totalPages={10} />);

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.queryByText("6")).not.toBeInTheDocument();
  });

  it("centers window around current page in the middle", () => {
    setupMocks();
    render(<BrowsePagination currentPage={5} totalPages={10} />);

    expect(screen.queryByText("2")).not.toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.queryByText("8")).not.toBeInTheDocument();
  });

  it("shows last 5 pages when on the last page", () => {
    setupMocks();
    render(<BrowsePagination currentPage={10} totalPages={10} />);

    expect(screen.queryByText("5")).not.toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("shows all pages when totalPages is less than 5", () => {
    setupMocks();
    render(<BrowsePagination currentPage={2} totalPages={3} />);

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("shows exactly 2 pages when totalPages is 2", () => {
    setupMocks();
    render(<BrowsePagination currentPage={1} totalPages={2} />);

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  // ── Previous / Next disabled state ──────────────────────────────────────

  it("previous button has pointer-events-none class on page 1", () => {
    setupMocks();
    render(<BrowsePagination currentPage={1} totalPages={5} />);

    const prevLink = screen.getByLabelText(/go to previous page/i);
    expect(prevLink.className).toContain("pointer-events-none");
  });

  it("next button has pointer-events-none class on the last page", () => {
    setupMocks();
    render(<BrowsePagination currentPage={5} totalPages={5} />);

    const nextLink = screen.getByLabelText(/go to next page/i);
    expect(nextLink.className).toContain("pointer-events-none");
  });

  it("previous button does not have pointer-events-none on pages > 1", () => {
    setupMocks();
    render(<BrowsePagination currentPage={3} totalPages={5} />);

    const prevLink = screen.getByLabelText(/go to previous page/i);
    expect(prevLink.classList).not.toContain("pointer-events-none");
  });

  it("next button does not have pointer-events-none when not on last page", () => {
    setupMocks();
    render(<BrowsePagination currentPage={3} totalPages={5} />);

    const nextLink = screen.getByLabelText(/go to next page/i);
    expect(nextLink.classList).not.toContain("pointer-events-none");
  });

  // ── Router navigation ───────────────────────────────────────────────────

  it("calls router.push when a page number is clicked", async () => {
    const user = userEvent.setup();
    setupMocks();

    render(<BrowsePagination currentPage={1} totalPages={5} />);

    await user.click(screen.getByText("3"));

    expect(pushMock).toHaveBeenCalledWith("/browse?page=3", { scroll: true });
  });

  it("navigates to page without 'page' param when navigating to page 1", async () => {
    const user = userEvent.setup();
    setupMocks({ searchParams: new URLSearchParams("page=3") });

    render(<BrowsePagination currentPage={3} totalPages={5} />);

    await user.click(screen.getByText("1"));

    expect(pushMock).toHaveBeenCalledWith("/browse", { scroll: true });
  });

  it("calls router.push with currentPage + 1 when Next is clicked", async () => {
    const user = userEvent.setup();
    setupMocks();

    render(<BrowsePagination currentPage={2} totalPages={5} />);

    await user.click(screen.getByLabelText(/go to next page/i));

    expect(pushMock).toHaveBeenCalledWith("/browse?page=3", { scroll: true });
  });

  it("calls router.push with currentPage - 1 when Previous is clicked", async () => {
    const user = userEvent.setup();
    setupMocks({ searchParams: new URLSearchParams("page=3") });

    render(<BrowsePagination currentPage={3} totalPages={5} />);

    await user.click(screen.getByLabelText(/go to previous page/i));

    expect(pushMock).toHaveBeenCalledWith("/browse?page=2", { scroll: true });
  });

  // ── Search param preservation ───────────────────────────────────────────

  it("preserves existing search params when navigating to a new page", async () => {
    const user = userEvent.setup();

    setupMocks({
      searchParams: new URLSearchParams("category=SALON&city=Addis+Ababa"),
    });

    render(<BrowsePagination currentPage={1} totalPages={5} />);

    await user.click(screen.getByText("2"));

    const calledUrl = pushMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain("category=SALON");
    expect(calledUrl).toContain("city=Addis+Ababa");
    expect(calledUrl).toContain("page=2");
  });

  it("uses the current pathname in the navigated URL", async () => {
    const user = userEvent.setup();
    setupMocks({ pathname: "/admin/businesses" });

    render(<BrowsePagination currentPage={1} totalPages={3} />);

    await user.click(screen.getByText("2"));

    expect(pushMock).toHaveBeenCalledWith("/admin/businesses?page=2", {
      scroll: true,
    });
  });
});
