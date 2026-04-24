/**
 * @file KPICard Component Unit Tests
 * @description Tests for the KPI Card dashboard component.
 *
 * Covers:
 *   - Loading state: renders Skeleton elements, hides real content
 *   - Title and value: always rendered when not loading
 *   - Trend: shown when provided, hidden when undefined
 *   - Trend positive: TrendingUp icon rendered, value is green
 *   - Trend negative: TrendingDown icon rendered, value is red
 *   - Trend zero: Minus icon rendered, muted color
 *   - Trend value: displayed as absolute percentage with 1 decimal
 *   - Description: shown with trend as "vs <description>"
 *   - Description: shown without trend as plain text
 *   - Icon: rendered in the header
 *   - String and number value types both render
 *
 * The LucideIcon prop is tested using a real Lucide icon (Users)
 * rather than a mock — Lucide icons are simple SVG components and
 * render cleanly in jsdom.
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Users } from "lucide-react";
import { KPICard } from "@/components/shared/kpi-card";

describe("KPICard", () => {
  const baseProps = {
    title: "Total Bookings",
    value: 142,
    icon: Users,
  };

  // ── Loading state ───────────────────────────────────────────────────────

  it("renders skeleton elements when isLoading is true", () => {
    const { container } = render(<KPICard {...baseProps} isLoading />);
    // Skeleton renders divs with the animate-pulse class from shadcn
    const skeletons = container.querySelectorAll(
      '[class*="animate-pulse"], [data-slot="skeleton"]'
    );
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("does not render title text when isLoading is true", () => {
    render(<KPICard {...baseProps} isLoading />);
    expect(screen.queryByText("Total Bookings")).not.toBeInTheDocument();
  });

  it("does not render value when isLoading is true", () => {
    render(<KPICard {...baseProps} isLoading />);
    expect(screen.queryByText("142")).not.toBeInTheDocument();
  });

  // ── Title and value ─────────────────────────────────────────────────────

  it("renders the title", () => {
    render(<KPICard {...baseProps} />);
    expect(screen.getByText("Total Bookings")).toBeInTheDocument();
  });

  it("renders a numeric value", () => {
    render(<KPICard {...baseProps} value={142} />);
    expect(screen.getByText("142")).toBeInTheDocument();
  });

  it("renders a string value", () => {
    render(<KPICard {...baseProps} value="ETB 2,500.00" />);
    expect(screen.getByText("ETB 2,500.00")).toBeInTheDocument();
  });

  it("renders a value of 0", () => {
    render(<KPICard {...baseProps} value={0} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  // ── Trend display ───────────────────────────────────────────────────────

  it("does not render trend section when trend is not provided", () => {
    render(<KPICard {...baseProps} />);
    // No percentage symbol should appear
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it("renders the trend percentage value when trend is provided", () => {
    render(<KPICard {...baseProps} trend={12.5} />);
    expect(screen.getByText("12.5%")).toBeInTheDocument();
  });

  it("renders trend as absolute value (no negative sign displayed)", () => {
    render(<KPICard {...baseProps} trend={-8.3} />);
    // Should display 8.3%, not -8.3%
    expect(screen.getByText("8.3%")).toBeInTheDocument();
    expect(screen.queryByText("-8.3%")).not.toBeInTheDocument();
  });

  it("renders trend formatted to 1 decimal place", () => {
    render(<KPICard {...baseProps} trend={10} />);
    expect(screen.getByText("10.0%")).toBeInTheDocument();
  });

  // ── Trend colors ────────────────────────────────────────────────────────

  it("applies green color class for positive trend", () => {
    render(<KPICard {...baseProps} trend={15} />);
    const trendText = screen.getByText("15.0%");
    expect(trendText.className).toContain("text-green-600");
  });

  it("applies red color class for negative trend", () => {
    render(<KPICard {...baseProps} trend={-5} />);
    const trendText = screen.getByText("5.0%");
    expect(trendText.className).toContain("text-red-600");
  });

  it("applies muted color class for zero trend", () => {
    render(<KPICard {...baseProps} trend={0} />);
    const trendText = screen.getByText("0.0%");
    expect(trendText.className).toContain("text-muted-foreground");
  });

  // ── Description ─────────────────────────────────────────────────────────

  it("renders 'vs description' when both trend and description are provided", () => {
    render(<KPICard {...baseProps} trend={10} description="previous period" />);
    expect(screen.getByText("vs previous period")).toBeInTheDocument();
  });

  it("renders plain description text when trend is not provided", () => {
    render(<KPICard {...baseProps} description="All time" />);
    expect(screen.getByText("All time")).toBeInTheDocument();
  });

  it("does not render 'vs' prefix when trend is undefined", () => {
    render(<KPICard {...baseProps} description="All time" />);
    expect(screen.queryByText(/^vs /)).not.toBeInTheDocument();
  });

  it("does not render description when neither trend nor description is provided", () => {
    render(<KPICard {...baseProps} />);
    // No description text
    expect(screen.queryByText(/period|time|vs/i)).not.toBeInTheDocument();
  });

  // ── Icon ────────────────────────────────────────────────────────────────

  it("renders the icon in the card header", () => {
    const { container } = render(<KPICard {...baseProps} icon={Users} />);
    // Lucide renders as an SVG element
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  // ── Edge cases ──────────────────────────────────────────────────────────

  it("renders a very large value without crashing", () => {
    render(<KPICard {...baseProps} value={1_000_000} />);
    expect(screen.getByText("1000000")).toBeInTheDocument();
  });

  it("renders with all props provided without crashing", () => {
    render(
      <KPICard
        title="Revenue"
        value="ETB 50,000"
        trend={22.3}
        icon={Users}
        description="last month"
        isLoading={false}
      />
    );
    expect(screen.getByText("Revenue")).toBeInTheDocument();
    expect(screen.getByText("ETB 50,000")).toBeInTheDocument();
    expect(screen.getByText("22.3%")).toBeInTheDocument();
    expect(screen.getByText("vs last month")).toBeInTheDocument();
  });
});
