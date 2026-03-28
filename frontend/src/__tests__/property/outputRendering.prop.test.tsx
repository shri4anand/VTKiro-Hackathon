import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { OutputPanel } from "../../components/OutputPanel";
import { SimplifiedVariant } from "../../types";

// Feature: crisis-text-simplifier, Property 4: All three variants are rendered simultaneously
// **Validates: Requirements 2.2**

describe("OutputPanel - Property 4: All three variants are rendered simultaneously", () => {
  it("should render all three reading level variants when status is success", () => {
    const grade3Score = Math.fround(2.5);
    const grade6Score = Math.fround(5.5);
    const grade9Score = Math.fround(8.5);

    const variants: SimplifiedVariant[] = [
      { level: "grade3", text: "Simple text.", fkScore: grade3Score },
      { level: "grade6", text: "Medium text.", fkScore: grade6Score },
      { level: "grade9", text: "Complex text.", fkScore: grade9Score },
    ];

    render(
      <OutputPanel
        status="success"
        variants={variants}
        error={null}
        inputText="test"
      />
    );

    // Assert all three cards are rendered
    expect(screen.getByText("Grade 3")).toBeInTheDocument();
    expect(screen.getByText("Grade 6")).toBeInTheDocument();
    expect(screen.getByText("Grade 9")).toBeInTheDocument();

    // Assert all three texts are rendered
    expect(screen.getByText("Simple text.")).toBeInTheDocument();
    expect(screen.getByText("Medium text.")).toBeInTheDocument();
    expect(screen.getByText("Complex text.")).toBeInTheDocument();
  });

  it("should render exactly three cards (no more, no less)", () => {
    const variants: SimplifiedVariant[] = [
      { level: "grade3", text: "Simple.", fkScore: 3.0 },
      { level: "grade6", text: "Medium.", fkScore: 5.5 },
      { level: "grade9", text: "Complex.", fkScore: 8.5 },
    ];

    render(
      <OutputPanel
        status="success"
        variants={variants}
        error={null}
        inputText="test"
      />
    );

    // Count the number of level badges (one per card)
    const badges = screen.getAllByText(/Grade [369]/);
    expect(badges).toHaveLength(3);
  });
});
