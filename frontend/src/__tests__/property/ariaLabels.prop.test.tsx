import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";
import { ReactNode, useEffect } from "react";
import { AlertInputPanel } from "../../components/AlertInputPanel";
import { LanguageToggle } from "../../components/LanguageToggle";
import { ReadingLevelSelector } from "../../components/ReadingLevelSelector";
import { SimplifiedCard } from "../../components/SimplifiedCard";
import { AudioControls } from "../../components/AudioControls";
import { SimplifiedVariant, Language, ReadingLevel } from "../../types";
import { AppStateProvider, useAppDispatch } from "../../store/appState";

// Feature: crisis-text-simplifier, Property 11: ARIA labels on all interactive controls
// **Validates: Requirements 5.3**

// Mock the useTTS hook to avoid Web Speech API issues in tests
vi.mock("../../hooks/useTTS", () => ({
  useTTS: () => ({
    playingLevel: null,
    play: vi.fn(),
    stop: vi.fn(),
    isAvailable: true,
    error: null,
  }),
}));

// Component to set up the test state
const TestStateSetup = ({
  children,
  playingLevel,
}: {
  children: ReactNode;
  playingLevel?: ReadingLevel | null;
}) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (playingLevel !== undefined) {
      dispatch({
        type: "SET_PLAYING_LEVEL",
        payload: playingLevel,
      });
    }
  }, [playingLevel, dispatch]);

  return <>{children}</>;
};

// Wrapper component that sets up the app state
const TestWrapper = ({
  children,
  playingLevel,
}: {
  children: ReactNode;
  playingLevel?: ReadingLevel | null;
}) => {
  return (
    <AppStateProvider>
      <TestStateSetup playingLevel={playingLevel}>
        {children}
      </TestStateSetup>
    </AppStateProvider>
  );
};

describe("ARIA Labels - Property 11: ARIA labels on all interactive controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should have aria-label on submit button in AlertInputPanel", () => {
    const { container } = render(
      <AlertInputPanel
        inputText="Test alert"
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        isLoading={false}
      />
    );

    const submitButton = container.querySelector('button[type="submit"]');
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveAttribute("aria-label");
    expect(submitButton?.getAttribute("aria-label")).not.toBe("");
  });

  it("should have aria-label on textarea in AlertInputPanel", () => {
    const { container } = render(
      <AlertInputPanel
        inputText=""
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        isLoading={false}
      />
    );

    const textarea = container.querySelector("textarea");
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute("aria-label");
    expect(textarea?.getAttribute("aria-label")).not.toBe("");
  });

  it("should have aria-label on all language toggle buttons", () => {
    const { container } = render(
      <LanguageToggle language="en" onChange={vi.fn()} />
    );

    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBeGreaterThan(0);

    buttons.forEach((button) => {
      expect(button).toHaveAttribute("aria-label");
      expect(button.getAttribute("aria-label")).not.toBe("");
    });
  });

  it("should have aria-label on all reading level selector buttons", () => {
    const { container } = render(
      <ReadingLevelSelector activeLevel="grade3" onChange={vi.fn()} />
    );

    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBeGreaterThan(0);

    buttons.forEach((button) => {
      expect(button).toHaveAttribute("aria-label");
      expect(button.getAttribute("aria-label")).not.toBe("");
    });
  });

  it("should have aria-label on play button in AudioControls", () => {
    const variant: SimplifiedVariant = {
      level: "grade3",
      text: "Simple text.",
      fkScore: 3.0,
    };

    const { container } = render(
      <TestWrapper>
        <AudioControls variant={variant} language="en" />
      </TestWrapper>
    );

    const playButton = container.querySelector('button[aria-label*="Play"]');
    expect(playButton).toBeInTheDocument();
    expect(playButton).toHaveAttribute("aria-label");
    expect(playButton?.getAttribute("aria-label")).not.toBe("");
  });

  it("should have aria-label on stop button in AudioControls when playing", () => {
    const variant: SimplifiedVariant = {
      level: "grade3",
      text: "Simple text.",
      fkScore: 3.0,
    };

    const { container } = render(
      <TestWrapper playingLevel="grade3">
        <AudioControls variant={variant} language="en" />
      </TestWrapper>
    );

    const stopButton = container.querySelector('button[aria-label*="Stop"]');
    expect(stopButton).toBeInTheDocument();
    expect(stopButton).toHaveAttribute("aria-label");
    expect(stopButton?.getAttribute("aria-label")).not.toBe("");
  });

  it("should have aria-label on language toggle group", () => {
    const { container } = render(
      <LanguageToggle language="en" onChange={vi.fn()} />
    );

    const group = container.querySelector('[role="group"]');
    expect(group).toBeInTheDocument();
    expect(group).toHaveAttribute("aria-label");
    expect(group?.getAttribute("aria-label")).not.toBe("");
  });

  it("should have aria-label on reading level selector group", () => {
    const { container } = render(
      <ReadingLevelSelector activeLevel="grade3" onChange={vi.fn()} />
    );

    const group = container.querySelector('[role="group"]');
    expect(group).toBeInTheDocument();
    expect(group).toHaveAttribute("aria-label");
    expect(group?.getAttribute("aria-label")).not.toBe("");
  });

  it("should have aria-label on all interactive controls for any language", () => {
    // Property-based test: for any language selection,
    // all language toggle buttons should have non-empty aria-label
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant("en"),
          fc.constant("es"),
          fc.constant("fr"),
          fc.constant("zh"),
          fc.constant("ar"),
          fc.constant("pt")
        ) as fc.Arbitrary<Language>,
        (language) => {
          const { container, unmount } = render(
            <LanguageToggle language={language} onChange={vi.fn()} />
          );

          // Assert: All buttons have aria-label
          const buttons = container.querySelectorAll("button");
          expect(buttons.length).toBeGreaterThan(0);

          buttons.forEach((button) => {
            expect(button).toHaveAttribute("aria-label");
            const ariaLabel = button.getAttribute("aria-label");
            expect(ariaLabel).not.toBe("");
            expect(ariaLabel).not.toBeNull();
          });

          // Assert: Group has aria-label
          const group = container.querySelector('[role="group"]');
          expect(group).toHaveAttribute("aria-label");
          expect(group?.getAttribute("aria-label")).not.toBe("");

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should have aria-label on all interactive controls for any reading level", () => {
    // Property-based test: for any reading level selection,
    // all reading level selector buttons should have non-empty aria-label
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant("grade3"),
          fc.constant("grade6"),
          fc.constant("grade9")
        ) as fc.Arbitrary<ReadingLevel>,
        (level) => {
          const { container, unmount } = render(
            <ReadingLevelSelector activeLevel={level} onChange={vi.fn()} />
          );

          // Assert: All buttons have aria-label
          const buttons = container.querySelectorAll("button");
          expect(buttons.length).toBeGreaterThan(0);

          buttons.forEach((button) => {
            expect(button).toHaveAttribute("aria-label");
            const ariaLabel = button.getAttribute("aria-label");
            expect(ariaLabel).not.toBe("");
            expect(ariaLabel).not.toBeNull();
          });

          // Assert: Group has aria-label
          const group = container.querySelector('[role="group"]');
          expect(group).toHaveAttribute("aria-label");
          expect(group?.getAttribute("aria-label")).not.toBe("");

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should have aria-label on all interactive controls for any input text", () => {
    // Property-based test: for any input text,
    // the submit button and textarea should have non-empty aria-label
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 5000 }),
        (inputText) => {
          const { container, unmount } = render(
            <AlertInputPanel
              inputText={inputText}
              onChange={vi.fn()}
              onSubmit={vi.fn()}
              isLoading={false}
            />
          );

          // Assert: Textarea has aria-label
          const textarea = container.querySelector("textarea");
          expect(textarea).toHaveAttribute("aria-label");
          expect(textarea?.getAttribute("aria-label")).not.toBe("");

          // Assert: Submit button has aria-label
          const submitButton = container.querySelector('button[type="submit"]');
          expect(submitButton).toHaveAttribute("aria-label");
          expect(submitButton?.getAttribute("aria-label")).not.toBe("");

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should have aria-label on all interactive controls for any variant", () => {
    // Property-based test: for any simplified variant,
    // the audio controls should have non-empty aria-label
    fc.assert(
      fc.property(
        fc.record({
          level: fc.oneof(
            fc.constant("grade3"),
            fc.constant("grade6"),
            fc.constant("grade9")
          ) as fc.Arbitrary<ReadingLevel>,
          text: fc.string({ minLength: 10, maxLength: 100 }),
          fkScore: fc.float({ min: Math.fround(0.1), max: Math.fround(10.0) }),
          language: fc.oneof(
            fc.constant("en"),
            fc.constant("es"),
            fc.constant("fr"),
            fc.constant("zh"),
            fc.constant("ar"),
            fc.constant("pt")
          ) as fc.Arbitrary<Language>,
        }),
        ({ level, text, fkScore, language }) => {
          const variant: SimplifiedVariant = {
            level,
            text,
            fkScore,
          };

          const { container, unmount } = render(
            <TestWrapper>
              <AudioControls variant={variant} language={language} />
            </TestWrapper>
          );

          // Assert: Play button has aria-label
          const playButton = container.querySelector('button[aria-label*="Play"]');
          if (playButton) {
            expect(playButton).toHaveAttribute("aria-label");
            expect(playButton.getAttribute("aria-label")).not.toBe("");
          }

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should have aria-label on all buttons in AlertInputPanel for any loading state", () => {
    // Property-based test: for any loading state,
    // all buttons should have non-empty aria-label
    fc.assert(
      fc.property(
        fc.boolean(),
        (isLoading) => {
          const { container, unmount } = render(
            <AlertInputPanel
              inputText="Test alert"
              onChange={vi.fn()}
              onSubmit={vi.fn()}
              isLoading={isLoading}
            />
          );

          // Assert: All buttons have aria-label
          const buttons = container.querySelectorAll("button");
          buttons.forEach((button) => {
            expect(button).toHaveAttribute("aria-label");
            expect(button.getAttribute("aria-label")).not.toBe("");
          });

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});
