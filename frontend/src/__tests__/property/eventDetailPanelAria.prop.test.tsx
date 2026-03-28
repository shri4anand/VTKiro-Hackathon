import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import fc from "fast-check";
import { EventDetailPanel } from "../../components/EventDetailPanel";
import { MapEvent, SeverityLevel } from "../../types";

// Feature: crisis-text-simplifier, Property 32: Event detail panel has ARIA label and announces title on open
// **Validates: Requirements 14.4, 14.5**

describe("EventDetailPanel - Property 32: Event detail panel has ARIA label and announces title on open", () => {
  it("should have aria-label and announce title on open for any MapEvent", () => {
    // Property-based test: for any generated MapEvent,
    // the EventDetailPanel should have a non-empty aria-label attribute
    // and the onOpen callback should be called with the event title
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }),
          title: fc.string({ minLength: 5, maxLength: 100 }),
          description: fc.string({ minLength: 10, maxLength: 500 }),
          latitude: fc.float({ min: -90, max: 90 }),
          longitude: fc.float({ min: -180, max: 180 }),
          timestamp: fc.date({ min: new Date("2020-01-01"), max: new Date("2026-12-31") }).map(d => d.toISOString()),
          severity: fc.oneof(
            fc.constant("low"),
            fc.constant("medium"),
            fc.constant("high"),
            fc.constant("critical")
          ) as fc.Arbitrary<SeverityLevel>,
        }),
        (mapEvent: MapEvent) => {
          const mockOnOpen = vi.fn();

          const { container, unmount } = render(
            <EventDetailPanel
              event={mapEvent}
              activeLevel="grade6"
              dismissEvent={vi.fn()}
              onOpen={mockOnOpen}
            />
          );

          // Assert: Panel has aria-label attribute
          const panel = container.querySelector('[aria-label]');
          expect(panel).toBeInTheDocument();
          
          const ariaLabel = panel?.getAttribute("aria-label");
          expect(ariaLabel).not.toBeNull();
          expect(ariaLabel).not.toBe("");
          expect(ariaLabel?.length).toBeGreaterThan(0);

          // Assert: onOpen callback was called with the event title
          // This simulates the ARIA live region announcement
          expect(mockOnOpen).toHaveBeenCalledWith(mapEvent.title);
          expect(mockOnOpen).toHaveBeenCalledTimes(1);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should have aria-label for edge case MapEvents", () => {
    // Test with specific edge cases to ensure robustness
    fc.assert(
      fc.property(
        fc.record({
          id: fc.constantFrom("evt-001", "evt-999", "a", "z", "x".repeat(20)),
          title: fc.constantFrom(
            "Wildfire — Northern California",
            "Emergency Alert: Evacuation Order",
            "x".repeat(100),
            "Short",
            "Title with special chars: @#$%"
          ),
          description: fc.constantFrom(
            "Short desc.",
            "A".repeat(500),
            "Multi\nline\ndescription",
            "Description with special chars: <>&\""
          ),
          latitude: fc.constantFrom(-90, 0, 90, 37.77, -45.5),
          longitude: fc.constantFrom(-180, 0, 180, -122.41, 120.3),
          timestamp: fc.constantFrom(
            "2020-01-01T00:00:00Z",
            "2026-12-31T23:59:59Z",
            new Date().toISOString()
          ),
          severity: fc.oneof(
            fc.constant("low"),
            fc.constant("medium"),
            fc.constant("high"),
            fc.constant("critical")
          ) as fc.Arbitrary<SeverityLevel>,
        }),
        (mapEvent: MapEvent) => {
          const mockOnOpen = vi.fn();

          const { container, unmount } = render(
            <EventDetailPanel
              event={mapEvent}
              activeLevel="grade3"
              dismissEvent={vi.fn()}
              onOpen={mockOnOpen}
            />
          );

          // Assert: Panel has non-empty aria-label
          const panel = container.querySelector('[aria-label]');
          expect(panel).toBeInTheDocument();
          
          const ariaLabel = panel?.getAttribute("aria-label");
          expect(ariaLabel).not.toBeNull();
          expect(ariaLabel).not.toBe("");

          // Assert: onOpen was called with the event title
          expect(mockOnOpen).toHaveBeenCalledWith(mapEvent.title);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should have consistent aria-label across multiple renders", () => {
    // Property-based test: verify that the aria-label remains consistent
    // when the same event is rendered multiple times
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }),
          title: fc.string({ minLength: 5, maxLength: 100 }),
          description: fc.string({ minLength: 10, maxLength: 500 }),
          latitude: fc.float({ min: -90, max: 90 }),
          longitude: fc.float({ min: -180, max: 180 }),
          timestamp: fc.date({ min: new Date("2020-01-01"), max: new Date("2026-12-31") }).map(d => d.toISOString()),
          severity: fc.oneof(
            fc.constant("low"),
            fc.constant("medium"),
            fc.constant("high"),
            fc.constant("critical")
          ) as fc.Arbitrary<SeverityLevel>,
        }),
        (mapEvent: MapEvent) => {
          const mockOnOpen1 = vi.fn();
          const mockOnOpen2 = vi.fn();

          // First render
          const { container: container1, unmount: unmount1 } = render(
            <EventDetailPanel
              event={mapEvent}
              activeLevel="grade6"
              dismissEvent={vi.fn()}
              onOpen={mockOnOpen1}
            />
          );

          const ariaLabel1 = container1.querySelector('[aria-label]')?.getAttribute("aria-label");

          unmount1();

          // Second render
          const { container: container2, unmount: unmount2 } = render(
            <EventDetailPanel
              event={mapEvent}
              activeLevel="grade9"
              dismissEvent={vi.fn()}
              onOpen={mockOnOpen2}
            />
          );

          const ariaLabel2 = container2.querySelector('[aria-label]')?.getAttribute("aria-label");

          // Assert: aria-label is consistent across renders
          expect(ariaLabel1).toBe(ariaLabel2);
          expect(ariaLabel1).not.toBe("");

          // Assert: onOpen was called with the same title both times
          expect(mockOnOpen1).toHaveBeenCalledWith(mapEvent.title);
          expect(mockOnOpen2).toHaveBeenCalledWith(mapEvent.title);

          unmount2();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should call onOpen with title for any severity level", () => {
    // Property-based test: verify that onOpen is called with the title
    // regardless of the event's severity level
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }),
          title: fc.string({ minLength: 5, maxLength: 100 }),
          description: fc.string({ minLength: 10, maxLength: 500 }),
          latitude: fc.float({ min: -90, max: 90 }),
          longitude: fc.float({ min: -180, max: 180 }),
          timestamp: fc.date({ min: new Date("2020-01-01"), max: new Date("2026-12-31") }).map(d => d.toISOString()),
          severity: fc.oneof(
            fc.constant("low"),
            fc.constant("medium"),
            fc.constant("high"),
            fc.constant("critical")
          ) as fc.Arbitrary<SeverityLevel>,
        }),
        (mapEvent: MapEvent) => {
          const mockOnOpen = vi.fn();

          const { unmount } = render(
            <EventDetailPanel
              event={mapEvent}
              activeLevel="grade6"
              dismissEvent={vi.fn()}
              onOpen={mockOnOpen}
            />
          );

          // Assert: onOpen was called exactly once with the event title
          expect(mockOnOpen).toHaveBeenCalledTimes(1);
          expect(mockOnOpen).toHaveBeenCalledWith(mapEvent.title);

          // Verify the title passed is the exact title from the event
          const callArgs = mockOnOpen.mock.calls[0];
          expect(callArgs[0]).toBe(mapEvent.title);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});
