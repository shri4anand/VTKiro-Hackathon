// Feature: crisis-text-simplifier, Property 9: Playing indicator is shown during active playback
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fc from "fast-check";
import { render } from "@testing-library/react";
import { SimplifiedCard } from "../../components/SimplifiedCard";
import { AppStateProvider, useAppDispatch } from "../../store/appState";
import { ReactNode } from "react";
import { SimplifiedVariant, Language, ReadingLevel } from "../../types";

/**
 * Validates: Requirements 4.3
 */
describe("Property 9: Playing indicator is shown during active playback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock Web Speech API
    global.speechSynthesis = {
      speak: vi.fn(),
      cancel: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      getVoices: vi.fn(() => []),
    } as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Generator for valid SimplifiedVariant
  const variantArbitrary = (level: ReadingLevel) =>
    fc.tuple(
      fc.string({ minLength: 10, maxLength: 500 }),
      fc.float({ min: 0, max: 10, noNaN: true })
    ).map(([text, fkScore]) => ({
      level,
      text,
      fkScore,
    }));

  const levels: ReadingLevel[] = ["grade3", "grade6", "grade9"];

  it("should show playing indicator when playingLevel matches card level", () => {
    fc.assert(
      fc.property(
        fc.constantFrom<ReadingLevel>(...levels),
        fc.string({ minLength: 10, maxLength: 500 })
      ),
      (level, text) => {
        const variant: SimplifiedVariant = {
          level,
          text,
          fkScore: 5.0,
        };

        // Create a wrapper component that sets playingLevel
        const TestWrapper = ({ children }: { children: ReactNode }) => {
          const dispatch = useAppDispatch();
          // Set playingLevel to match the card level
          dispatch({ type: "SET_PLAYING_LEVEL", payload: level });
          return <>{children}</>;
        };

        const { container } = render(
          <AppStateProvider>
            <TestWrapper>
              <SimplifiedCard variant={variant} language="en" />
            </TestWrapper>
          </AppStateProvider>
        );

        // Assert that the playing indicator is visible
        const playingIndicator = container.querySelector(".animate-pulse");
        expect(playingIndicator).not.toBeNull();
        expect(playingIndicator?.textContent).toContain("Playing");
      },
      { numRuns: 100 }
    );
  });

  it("should not show playing indicator when playingLevel does not match card level", () => {
    fc.assert(
      fc.property(
        fc.constantFrom<ReadingLevel>(...levels),
        fc.constantFrom<ReadingLevel>(...levels),
        fc.string({ minLength: 10, maxLength: 500 })
      ),
      (cardLevel, playingLevel, text) => {
        // Skip if they're the same (we test that case separately)
        if (cardLevel === playingLevel) {
          return;
        }

        const variant: SimplifiedVariant = {
          level: cardLevel,
          text,
          fkScore: 5.0,
        };

        // Create a wrapper component that sets playingLevel to a different level
        const TestWrapper = ({ children }: { children: ReactNode }) => {
          const dispatch = useAppDispatch();
          dispatch({ type: "SET_PLAYING_LEVEL", payload: playingLevel });
          return <>{children}</>;
        };

        const { container } = render(
          <AppStateProvider>
            <TestWrapper>
              <SimplifiedCard variant={variant} language="en" />
            </TestWrapper>
          </AppStateProvider>
        );

        // Assert that the playing indicator is NOT visible
        const playingIndicator = container.querySelector(".animate-pulse");
        expect(playingIndicator).toBeNull();
      },
      { numRuns: 100 }
    );
  });

  it("should show playing indicator for all reading levels when they are active", () => {
    fc.assert(
      fc.property(
        fc.constantFrom<ReadingLevel>(...levels),
        fc.string({ minLength: 10, maxLength: 500 })
      ),
      (level, text) => {
        const variant: SimplifiedVariant = {
          level,
          text,
          fkScore: 5.0,
        };

        const TestWrapper = ({ children }: { children: ReactNode }) => {
          const dispatch = useAppDispatch();
          dispatch({ type: "SET_PLAYING_LEVEL", payload: level });
          return <>{children}</>;
        };

        const { container } = render(
          <AppStateProvider>
            <TestWrapper>
              <SimplifiedCard variant={variant} language="en" />
            </TestWrapper>
          </AppStateProvider>
        );

        // Assert that the playing indicator is visible
        const playingIndicator = container.querySelector(".animate-pulse");
        expect(playingIndicator).not.toBeNull();
        expect(playingIndicator?.textContent).toContain("♪");
      },
      { numRuns: 100 }
    );
  });
});
