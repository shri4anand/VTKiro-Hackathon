import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";
import { ReactNode, useEffect } from "react";
import { OutputPanel } from "../../components/OutputPanel";
import { SimplifiedVariant } from "../../types";
import { AppStateProvider, useAppDispatch } from "../../store/appState";

// Feature: crisis-text-simplifier, Property 4: All three variants are rendered simultaneously
// **Validates: Requirements 2.2**

// Mock the useTTS hook to avoid Web Speech API issues in tests
vi.mock("../../hooks/useTTS", () => ({
  useTTS: () => ({
    playingLevel: null,
    play: vi.fn(),
    stop: vi.fn(),
  }),
}));

// Component to set up the test state
const TestStateSetup = ({ children, variants }: { children: ReactNode; variants: SimplifiedVariant[] }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch({
      type: "SET_VARIANTS",
      payload: variants,
    });
    dispatch({
      type: "SET_STATUS",
      payload: "success",
    });
  }, [variants, dispatch]);

  return <>{children}</>;
};

// Wrapper component that sets up the app state with test variants
const TestWrapper = ({ children, variants }: { children: ReactNode; variants: SimplifiedVariant[] }) => {
  return (
    <AppStateProvider>
      <TestStateSetup variants={variants}>{children}</TestStateSetup>
    </AppStateProvider>
  );
};

describe("OutputPanel - Property 4: All three variants are rendered simultaneously", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
      <TestWrapper variants={variants}>
        <OutputPanel />
      </TestWrapper>
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
      <TestWrapper variants={variants}>
        <OutputPanel />
      </TestWrapper>
    );

    // Count the number of level badges (one per card)
    const badges = screen.getAllByText(/Grade [369]/);
    expect(badges).toHaveLength(3);
  });

  it("should render all three variants simultaneously for any valid response", () => {
    // Property-based test: for any valid response with three variants,
    // all three should be rendered simultaneously in the output panel
    fc.assert(
      fc.property(
        fc.record({
          grade3Text: fc.string({ minLength: 10, maxLength: 100 }),
          grade6Text: fc.string({ minLength: 10, maxLength: 100 }),
          grade9Text: fc.string({ minLength: 10, maxLength: 100 }),
          grade3Score: fc.float({ min: 0.1, max: 4.0 }),
          grade6Score: fc.float({ min: 4.1, max: 7.0 }),
          grade9Score: fc.float({ min: 7.1, max: 10.0 }),
        }),
        ({ grade3Text, grade6Text, grade9Text, grade3Score, grade6Score, grade9Score }) => {
          const variants: SimplifiedVariant[] = [
            { level: "grade3", text: grade3Text, fkScore: grade3Score },
            { level: "grade6", text: grade6Text, fkScore: grade6Score },
            { level: "grade9", text: grade9Text, fkScore: grade9Score },
          ];

          const { unmount } = render(
            <TestWrapper variants={variants}>
              <OutputPanel />
            </TestWrapper>
          );

          // Assert: All three grade level badges are present
          expect(screen.getByText("Grade 3")).toBeInTheDocument();
          expect(screen.getByText("Grade 6")).toBeInTheDocument();
          expect(screen.getByText("Grade 9")).toBeInTheDocument();

          // Assert: All three variant texts are present simultaneously
          expect(screen.getByText(grade3Text)).toBeInTheDocument();
          expect(screen.getByText(grade6Text)).toBeInTheDocument();
          expect(screen.getByText(grade9Text)).toBeInTheDocument();

          // Assert: All three FK scores are displayed
          expect(screen.getByText(`FK Score: ${grade3Score.toFixed(1)}`)).toBeInTheDocument();
          expect(screen.getByText(`FK Score: ${grade6Score.toFixed(1)}`)).toBeInTheDocument();
          expect(screen.getByText(`FK Score: ${grade9Score.toFixed(1)}`)).toBeInTheDocument();

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should render all three cards in the correct grid layout", () => {
    const variants: SimplifiedVariant[] = [
      { level: "grade3", text: "Simple.", fkScore: 3.0 },
      { level: "grade6", text: "Medium.", fkScore: 5.5 },
      { level: "grade9", text: "Complex.", fkScore: 8.5 },
    ];

    const { container } = render(
      <TestWrapper variants={variants}>
        <OutputPanel />
      </TestWrapper>
    );

    // Assert: The grid container exists and has the correct class
    const gridContainer = container.querySelector(".grid");
    expect(gridContainer).toBeInTheDocument();

    // Assert: All three cards are rendered as children of the grid
    const cards = container.querySelectorAll(".bg-white.rounded-lg.shadow-md");
    expect(cards.length).toBeGreaterThanOrEqual(3);
  });
});
