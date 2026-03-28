import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { SimplifiedCard } from "../../components/SimplifiedCard";
import { SimplifiedVariant } from "../../types";

const mockVariant: SimplifiedVariant = {
  level: "grade3",
  text: "This is simple text.",
  fkScore: 3.2,
};

describe("SimplifiedCard", () => {
  it("renders level badge with correct label", () => {
    render(<SimplifiedCard variant={mockVariant} />);
    expect(screen.getByText("Grade 3")).toBeInTheDocument();
  });

  it("renders simplified text", () => {
    render(<SimplifiedCard variant={mockVariant} />);
    expect(screen.getByText("This is simple text.")).toBeInTheDocument();
  });

  it("displays FK score with one decimal place", () => {
    render(<SimplifiedCard variant={mockVariant} />);
    expect(screen.getByText("3.2")).toBeInTheDocument();
  });

  it("renders Grade 6 badge correctly", () => {
    const grade6Variant: SimplifiedVariant = {
      level: "grade6",
      text: "Medium text.",
      fkScore: 5.8,
    };
    render(<SimplifiedCard variant={grade6Variant} />);
    expect(screen.getByText("Grade 6")).toBeInTheDocument();
  });

  it("renders Grade 9 badge correctly", () => {
    const grade9Variant: SimplifiedVariant = {
      level: "grade9",
      text: "Complex text.",
      fkScore: 8.4,
    };
    render(<SimplifiedCard variant={grade9Variant} />);
    expect(screen.getByText("Grade 9")).toBeInTheDocument();
  });

  it("does not show retry button by default", () => {
    render(<SimplifiedCard variant={mockVariant} />);
    expect(screen.queryByRole("button", { name: "Retry simplification" })).not.toBeInTheDocument();
  });

  it("shows retry button when showRetryButton is true", () => {
    render(
      <SimplifiedCard
        variant={mockVariant}
        showRetryButton={true}
        onRetry={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: "Retry simplification" })).toBeInTheDocument();
  });

  it("calls onRetry when retry button is clicked", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <SimplifiedCard
        variant={mockVariant}
        showRetryButton={true}
        onRetry={onRetry}
      />
    );
    await user.click(screen.getByRole("button", { name: "Retry simplification" }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("formats FK score with one decimal place for various scores", () => {
    const variants: SimplifiedVariant[] = [
      { level: "grade3", text: "text", fkScore: 2.0 },
      { level: "grade6", text: "text", fkScore: 5.55 },
      { level: "grade9", text: "text", fkScore: 9.999 },
    ];

    variants.forEach((variant) => {
      const { unmount } = render(<SimplifiedCard variant={variant} />);
      expect(screen.getByText(variant.fkScore.toFixed(1))).toBeInTheDocument();
      unmount();
    });
  });
});
