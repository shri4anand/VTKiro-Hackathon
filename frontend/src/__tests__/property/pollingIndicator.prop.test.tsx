// Feature: crisis-text-simplifier, Property 18: Polling indicator is shown during active poll
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { render } from "@testing-library/react";
import { FeedStatusBar } from "../../components/FeedStatusBar";
import { FeedError } from "../../types";

/**
 * Validates: Requirements 7.5
 */
describe("Property 18: Polling indicator is shown during active poll", () => {
  // Generator for FeedError (optional)
  const feedErrorArbitrary = fc.option(
    fc.record({
      error: fc.string({ minLength: 1, maxLength: 100 }),
      code: fc.constantFrom<FeedError["code"]>(
        "NEWS_SOURCE_UNAVAILABLE",
        "TIMEOUT",
        "MALFORMED_RESPONSE"
      ),
    })
  );

  it("should display polling indicator when isPolling is true", () => {
    fc.assert(
      fc.property(feedErrorArbitrary, (feedError) => {
        const { container } = render(
          <FeedStatusBar isPolling={true} feedError={feedError} />
        );

        // Assert that the polling indicator element is present
        const pollingIndicator = container.querySelector('[role="status"]');
        expect(pollingIndicator).not.toBeNull();

        // Assert that it has the correct aria-label
        expect(pollingIndicator).toHaveAttribute(
          "aria-label",
          "Feed is refreshing"
        );

        // Assert that the indicator contains the text "Refreshing feed..."
        expect(pollingIndicator?.textContent).toContain("Refreshing feed...");

        // Assert that the indicator contains the animated dots
        const dots = pollingIndicator?.querySelectorAll(".animate-bounce");
        expect(dots?.length).toBe(3);
      }),
      { numRuns: 100 }
    );
  });

  it("should not display polling indicator when isPolling is false", () => {
    fc.assert(
      fc.property(feedErrorArbitrary, (feedError) => {
        const { container } = render(
          <FeedStatusBar isPolling={false} feedError={feedError} />
        );

        // Assert that the polling indicator element is NOT present
        const pollingIndicator = container.querySelector('[role="status"]');
        expect(pollingIndicator).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it("should display polling indicator with correct styling when isPolling is true", () => {
    fc.assert(
      fc.property(feedErrorArbitrary, (feedError) => {
        const { container } = render(
          <FeedStatusBar isPolling={true} feedError={feedError} />
        );

        const pollingIndicator = container.querySelector('[role="status"]');
        expect(pollingIndicator).not.toBeNull();

        // Assert that the indicator has the correct CSS classes for styling
        expect(pollingIndicator?.className).toContain("flex");
        expect(pollingIndicator?.className).toContain("items-center");
        expect(pollingIndicator?.className).toContain("gap-2");
        expect(pollingIndicator?.className).toContain("px-4");
        expect(pollingIndicator?.className).toContain("py-2");
        expect(pollingIndicator?.className).toContain("bg-blue-50");
        expect(pollingIndicator?.className).toContain("border");
        expect(pollingIndicator?.className).toContain("border-blue-200");
        expect(pollingIndicator?.className).toContain("rounded-lg");
      }),
      { numRuns: 100 }
    );
  });

  it("should display polling indicator regardless of feedError state", () => {
    fc.assert(
      fc.property(feedErrorArbitrary, (feedError) => {
        const { container } = render(
          <FeedStatusBar isPolling={true} feedError={feedError} />
        );

        // Polling indicator should always be present when isPolling is true
        const pollingIndicator = container.querySelector('[role="status"]');
        expect(pollingIndicator).not.toBeNull();
        expect(pollingIndicator).toHaveAttribute(
          "aria-label",
          "Feed is refreshing"
        );
      }),
      { numRuns: 100 }
    );
  });
});
