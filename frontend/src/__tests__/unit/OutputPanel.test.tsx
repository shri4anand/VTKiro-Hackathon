import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { OutputPanel } from "../../components/OutputPanel";
import { SimplifiedVariant } from "../../types";

const mockVariants: SimplifiedVariant[] = [
  { level: "grade3", text: "Simple text here.", fkScore: 3.2 },
  { level: "grade6", text: "Medium complexity text.", fkScore: 5.8 },
  { level: "grade9", text: "Complex and sophisticated text.", fkScore: 8.4 },
];

describe("OutputPanel", () => {
  it("renders nothing when status is idle", () => {
    const { container } = render(
      <OutputPanel
        status="idle"
        variants={null}
        error={null}
        inputText=""
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows loading spinner when status is loading", () => {
    render(
      <OutputPanel
        status="loading"
        variants={null}
        error={null}
        inputText=""
      />
    );
    expect(screen.getByText("Simplifying your alert…")).toBeInTheDocument();
  });

  it("renders all three cards on success", () => {
    render(
      <OutputPanel
        status="success"
        variants={mockVariants}
        error={null}
        inputText="test"
      />
    );
    expect(screen.getByText("Grade 3")).toBeInTheDocument();
    expect(screen.getByText("Grade 6")).toBeInTheDocument();
    expect(screen.getByText("Grade 9")).toBeInTheDocument();
    expect(screen.getByText("Simple text here.")).toBeInTheDocument();
    expect(screen.getByText("Medium complexity text.")).toBeInTheDocument();
    expect(screen.getByText("Complex and sophisticated text.")).toBeInTheDocument();
  });

  it("displays FK scores for each card", () => {
    render(
      <OutputPanel
        status="success"
        variants={mockVariants}
        error={null}
        inputText="test"
      />
    );
    expect(screen.getByText("3.2")).toBeInTheDocument();
    expect(screen.getByText("5.8")).toBeInTheDocument();
    expect(screen.getByText("8.4")).toBeInTheDocument();
  });

  it("shows error message on error status", () => {
    render(
      <OutputPanel
        status="error"
        variants={null}
        error={{
          error: "The simplification service is currently unavailable.",
          code: "LLM_UNAVAILABLE",
        }}
        inputText=""
      />
    );
    expect(screen.getByText("The simplification service is currently unavailable.")).toBeInTheDocument();
  });

  it("shows retry button on LLM_UNAVAILABLE error", () => {
    render(
      <OutputPanel
        status="error"
        variants={null}
        error={{
          error: "Service unavailable.",
          code: "LLM_UNAVAILABLE",
        }}
        inputText=""
        onRetry={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: "Retry simplification" })).toBeInTheDocument();
  });

  it("shows retry button on TIMEOUT error", () => {
    render(
      <OutputPanel
        status="error"
        variants={null}
        error={{
          error: "Request timed out.",
          code: "TIMEOUT",
        }}
        inputText=""
        onRetry={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: "Retry simplification" })).toBeInTheDocument();
  });

  it("shows fix input button on VALIDATION_ERROR", () => {
    render(
      <OutputPanel
        status="error"
        variants={null}
        error={{
          error: "Invalid input.",
          code: "VALIDATION_ERROR",
        }}
        inputText=""
        onHighlightInput={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: "Focus on input field" })).toBeInTheDocument();
  });

  it("calls onRetry when retry button is clicked", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <OutputPanel
        status="error"
        variants={null}
        error={{
          error: "Service unavailable.",
          code: "LLM_UNAVAILABLE",
        }}
        inputText=""
        onRetry={onRetry}
      />
    );
    await user.click(screen.getByRole("button", { name: "Retry simplification" }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("calls onHighlightInput when fix input button is clicked", async () => {
    const user = userEvent.setup();
    const onHighlightInput = vi.fn();
    render(
      <OutputPanel
        status="error"
        variants={null}
        error={{
          error: "Invalid input.",
          code: "VALIDATION_ERROR",
        }}
        inputText=""
        onHighlightInput={onHighlightInput}
      />
    );
    await user.click(screen.getByRole("button", { name: "Focus on input field" }));
    expect(onHighlightInput).toHaveBeenCalled();
  });

  it("does not show retry button on MALFORMED_RESPONSE error", () => {
    render(
      <OutputPanel
        status="error"
        variants={null}
        error={{
          error: "Something went wrong.",
          code: "MALFORMED_RESPONSE",
        }}
        inputText=""
        onRetry={vi.fn()}
      />
    );
    expect(screen.queryByRole("button", { name: "Retry simplification" })).not.toBeInTheDocument();
  });
});
