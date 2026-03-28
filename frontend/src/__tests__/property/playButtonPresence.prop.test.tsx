// Feature: crisis-text-simplifier, Property 7: Each output card has a play button
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import fc from "fast-check";
import { SimplifiedCard } from "../../components/SimplifiedCard";
import { AppStateProvider } from "../../store/appState";
import { ReactNode } from "react";
import { SimplifiedVariant, Language } from "../../types";

/**
 * Validates: Requirements 4.1
 */
describe("Property 7: Each output card has a play button", () => {
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

  // Generator for valid SimplifyResponse with three variants
  const simplifyResponseArbitrary = fc.tuple(
    fc.string({ minLength: 10, maxLength: 500 }),
    fc.string({ minLength: 10, maxLength: 500 }),
    fc.string({ minLength: 10, maxLength: 500 })
  ).map(([grade3Text, grade6Text, grade9Text]) => ({
    variants: [
      { level: "grade3" as const, text: grade3Text, fkScore: 3.5 },
      { level: "grade6" as const, text: grade6Text, fkScore: 6.0 },
      { level: "grade9" as const, text: grade9Text, fkScore: 8.5 },
    ],
  }));

  it("should render a play button for each output card variant", () => {
    fc.assert(
      fc.property(simplifyResponseArbitrary, (response) => {
        // Test each variant individually
        response.variants.forEach((variant) => {
          const { container } = render(
            <AppStateProvider>
              <SimplifiedCard variant={variant} language="en" />
            </AppStateProvider>
          );

          // Assert that the card contains a play button
          const playButton = container.querySelector(
            'button[aria-label*="Play audio"]'
          );
          expect(playButton).not.toBeNull();
          expect(playButton?.textContent).toMatch(/Play|Playing/);
        });
      }),
      { numRuns: 100 }
    );
  });

  it("should render play buttons with correct aria-labels for each level", () => {
    fc.assert(
      fc.property(simplifyResponseArbitrary, (response) => {
        response.variants.forEach((variant) => {
          const { container } = render(
            <AppStateProvider>
              <SimplifiedCard variant={variant} language="en" />
            </AppStateProvider>
          );

          // Assert that the play button has the correct aria-label
          const playButton = container.querySelector(
            `button[aria-label*="${variant.level}"]`
          );
          expect(playButton).not.toBeNull();
          expect(playButton?.getAttribute("aria-label")).toContain(
            variant.level
          );
        });
      }),
      { numRuns: 100 }
    );
  });
});
