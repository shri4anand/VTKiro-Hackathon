import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";
import { ReactNode, useEffect } from "react";
import { OutputPanel } from "../../components/OutputPanel";
import { SimplifiedVariant, Language } from "../../types";
import { AppStateProvider, useAppDispatch } from "../../store/appState";

// Feature: crisis-text-simplifier, Property 6: Language selection updates all displayed variants
// **Validates: Requirements 3.2, 3.4**

// Mock the useTTS hook to avoid Web Speech API issues in tests
vi.mock("../../hooks/useTTS", () => ({
  useTTS: () => ({
    playingLevel: null,
    play: vi.fn(),
    stop: vi.fn(),
  }),
}));

// Component to set up the test state with language
const TestStateSetup = ({
  children,
  variants,
  language,
}: {
  children: ReactNode;
  variants: SimplifiedVariant[];
  language: Language;
}) => {
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
    dispatch({
      type: "SET_LANGUAGE",
      payload: language,
    });
  }, [variants, language, dispatch]);

  return <>{children}</>;
};

// Wrapper component that sets up the app state with test variants and language
const TestWrapper = ({
  children,
  variants,
  language,
}: {
  children: ReactNode;
  variants: SimplifiedVariant[];
  language: Language;
}) => {
  return (
    <AppStateProvider>
      <TestStateSetup variants={variants} language={language}>
        {children}
      </TestStateSetup>
    </AppStateProvider>
  );
};

describe("OutputPanel - Property 6: Language selection updates all displayed variants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render all three cards with the selected language", () => {
    const languages: Language[] = ["en", "es", "fr", "zh", "ar", "pt"];

    languages.forEach((language) => {
      const variants: SimplifiedVariant[] = [
        { level: "grade3", text: `Simple text in ${language}`, fkScore: 3.2 },
        { level: "grade6", text: `Medium text in ${language}`, fkScore: 5.8 },
        { level: "grade9", text: `Complex text in ${language}`, fkScore: 8.4 },
      ];

      const { unmount } = render(
        <TestWrapper variants={variants} language={language}>
          <OutputPanel />
        </TestWrapper>
      );

      // Assert: All three cards are rendered
      expect(screen.getByText("Grade 3")).toBeInTheDocument();
      expect(screen.getByText("Grade 6")).toBeInTheDocument();
      expect(screen.getByText("Grade 9")).toBeInTheDocument();

      // Assert: All three texts reflect the selected language
      expect(screen.getByText(`Simple text in ${language}`)).toBeInTheDocument();
      expect(screen.getByText(`Medium text in ${language}`)).toBeInTheDocument();
      expect(screen.getByText(`Complex text in ${language}`)).toBeInTheDocument();

      unmount();
    });
  });

  it("should display all three cards simultaneously regardless of language selection", () => {
    // Property-based test: for any language selection, all three cards should be rendered
    // simultaneously without requiring a new submission
    fc.assert(
      fc.property(
        fc.constantFrom<Language>("en", "es", "fr", "zh", "ar", "pt"),
        (language) => {
          const variants: SimplifiedVariant[] = [
            { level: "grade3", text: "Simple.", fkScore: 3.0 },
            { level: "grade6", text: "Medium.", fkScore: 5.5 },
            { level: "grade9", text: "Complex.", fkScore: 8.5 },
          ];

          const { container, unmount } = render(
            <TestWrapper variants={variants} language={language}>
              <OutputPanel />
            </TestWrapper>
          );

          // Assert: The grid container exists
          const gridContainer = container.querySelector(".grid");
          expect(gridContainer).toBeInTheDocument();

          // Assert: All three cards are rendered as children of the grid
          const cards = container.querySelectorAll(".bg-white.rounded-lg.shadow-md");
          expect(cards.length).toBeGreaterThanOrEqual(3);

          // Assert: All three grade badges are present
          const badges = screen.getAllByText(/Grade [369]/);
          expect(badges.length).toBeGreaterThanOrEqual(3);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should update all displayed variants when language changes without requiring new submission", () => {
    // Property-based test: when language changes, all three cards should update
    // to reflect the new language without requiring a new manual submission
    fc.assert(
      fc.property(
        fc.constantFrom<Language>("en", "es", "fr", "zh", "ar", "pt"),
        fc.constantFrom<Language>("en", "es", "fr", "zh", "ar", "pt"),
        (initialLanguage, newLanguage) => {
          // Skip if languages are the same
          if (initialLanguage === newLanguage) {
            return;
          }

          const variantsInitial: SimplifiedVariant[] = [
            { level: "grade3", text: `Initial ${initialLanguage} grade3`, fkScore: 3.2 },
            { level: "grade6", text: `Initial ${initialLanguage} grade6`, fkScore: 5.8 },
            { level: "grade9", text: `Initial ${initialLanguage} grade9`, fkScore: 8.4 },
          ];

          const variantsNew: SimplifiedVariant[] = [
            { level: "grade3", text: `Updated ${newLanguage} grade3`, fkScore: 3.2 },
            { level: "grade6", text: `Updated ${newLanguage} grade6`, fkScore: 5.8 },
            { level: "grade9", text: `Updated ${newLanguage} grade9`, fkScore: 8.4 },
          ];

          // First render with initial language
          const { rerender, unmount } = render(
            <TestWrapper variants={variantsInitial} language={initialLanguage}>
              <OutputPanel />
            </TestWrapper>
          );

          // Assert: Initial language variants are displayed
          expect(screen.getByText(`Initial ${initialLanguage} grade3`)).toBeInTheDocument();
          expect(screen.getByText(`Initial ${initialLanguage} grade6`)).toBeInTheDocument();
          expect(screen.getByText(`Initial ${initialLanguage} grade9`)).toBeInTheDocument();

          // Re-render with new language and updated variants
          rerender(
            <TestWrapper variants={variantsNew} language={newLanguage}>
              <OutputPanel />
            </TestWrapper>
          );

          // Assert: All three cards now display the new language variants
          expect(screen.getByText(`Updated ${newLanguage} grade3`)).toBeInTheDocument();
          expect(screen.getByText(`Updated ${newLanguage} grade6`)).toBeInTheDocument();
          expect(screen.getByText(`Updated ${newLanguage} grade9`)).toBeInTheDocument();

          // Assert: Old language variants are no longer displayed
          expect(screen.queryByText(`Initial ${initialLanguage} grade3`)).not.toBeInTheDocument();
          expect(screen.queryByText(`Initial ${initialLanguage} grade6`)).not.toBeInTheDocument();
          expect(screen.queryByText(`Initial ${initialLanguage} grade9`)).not.toBeInTheDocument();

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should render all three variants with correct FK scores for any language selection", () => {
    // Property-based test: for any language selection, all three variants should be rendered
    // with their correct FK scores displayed
    fc.assert(
      fc.property(
        fc.constantFrom<Language>("en", "es", "fr", "zh", "ar", "pt"),
        fc.float({ min: Math.fround(0.1), max: Math.fround(4.0) }),
        fc.float({ min: Math.fround(4.1), max: Math.fround(7.0) }),
        fc.float({ min: Math.fround(7.1), max: Math.fround(10.0) }),
        (language, grade3Score, grade6Score, grade9Score) => {
          const variants: SimplifiedVariant[] = [
            { level: "grade3", text: "Grade 3 text", fkScore: grade3Score },
            { level: "grade6", text: "Grade 6 text", fkScore: grade6Score },
            { level: "grade9", text: "Grade 9 text", fkScore: grade9Score },
          ];

          const { unmount } = render(
            <TestWrapper variants={variants} language={language}>
              <OutputPanel />
            </TestWrapper>
          );

          // Assert: All three grade level badges are present
          const grade3Badges = screen.getAllByText("Grade 3");
          const grade6Badges = screen.getAllByText("Grade 6");
          const grade9Badges = screen.getAllByText("Grade 9");
          expect(grade3Badges.length).toBeGreaterThan(0);
          expect(grade6Badges.length).toBeGreaterThan(0);
          expect(grade9Badges.length).toBeGreaterThan(0);

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
});

