import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import fc from "fast-check";
import { EventDetailPanel } from "../../components/EventDetailPanel";
import { MapEvent, SeverityLevel } from "../../types";

// Feature: crisis-text-simplifier, Property 24: Event detail panel contains all required fields
// **Validates: Requirements 9.4**

describe("Event Detail Panel - Property 24: Event detail panel contains all required fields", () => {
  it("should contain title, description, timestamp, and severity for any MapEvent", () => {
    // Property-based test: for any generated MapEvent,
    // the EventDetailPanel should render all four required fields
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
          const { container, unmount } = render(
            <EventDetailPanel
              event={mapEvent}
              activeLevel="grade6"
              dismissEvent={vi.fn()}
            />
          );

          // Assert: Title is present in the h2 element
          const titleElement = container.querySelector("h2.text-xl.font-bold");
          expect(titleElement).toBeInTheDocument();
          expect(titleElement?.textContent).toBe(mapEvent.title);

          // Assert: Description is present in the content div
          const contentDiv = container.querySelector("div.text-gray-800.leading-relaxed");
          expect(contentDiv).toBeInTheDocument();
          expect(contentDiv?.textContent).toBe(mapEvent.description);

          // Assert: Timestamp is present (formatted or raw)
          const timestampElement = container.querySelector("p.text-sm.text-gray-500");
          expect(timestampElement).toBeInTheDocument();
          expect(timestampElement?.textContent).not.toBe("");
          expect(timestampElement?.textContent?.length).toBeGreaterThan(0);

          // Assert: Severity badge is present
          const severityBadge = container.querySelector("span.inline-block.px-3.py-1.rounded-full");
          expect(severityBadge).toBeInTheDocument();
          expect(severityBadge?.textContent).not.toBe("");
          
          // Verify severity badge shows the correct severity level
          const severityLabels: Record<SeverityLevel, string> = {
            low: "Low",
            medium: "Medium",
            high: "High",
            critical: "Critical",
          };
          expect(severityBadge?.textContent).toBe(severityLabels[mapEvent.severity]);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should render all required fields with correct content for edge case MapEvents", () => {
    // Test with specific edge cases to ensure robustness
    fc.assert(
      fc.property(
        fc.record({
          id: fc.constantFrom("evt-001", "evt-999", "a", "z"),
          title: fc.constantFrom(
            "Wildfire — Northern California",
            "Emergency Alert: Evacuation Order",
            "x".repeat(100)
          ),
          description: fc.constantFrom(
            "Short desc.",
            "A".repeat(500),
            "Multi\nline\ndescription"
          ),
          latitude: fc.constantFrom(-90, 0, 90, 37.77),
          longitude: fc.constantFrom(-180, 0, 180, -122.41),
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
          const { container, unmount } = render(
            <EventDetailPanel
              event={mapEvent}
              activeLevel="grade3"
              dismissEvent={vi.fn()}
            />
          );

          // Assert: Title is present in the h2 element
          const titleElement = container.querySelector("h2.text-xl.font-bold");
          expect(titleElement).toBeInTheDocument();
          expect(titleElement?.textContent).toBe(mapEvent.title);

          // Assert: Description is present in the content div
          const contentDiv = container.querySelector("div.text-gray-800.leading-relaxed");
          expect(contentDiv).toBeInTheDocument();
          expect(contentDiv?.textContent).toBe(mapEvent.description);
          
          // Assert: Timestamp is present
          const timestampElement = container.querySelector("p.text-sm.text-gray-500");
          expect(timestampElement).toBeInTheDocument();
          expect(timestampElement?.textContent).not.toBe("");
          
          // Assert: Severity badge is present
          const severityBadge = container.querySelector("span.inline-block.px-3.py-1.rounded-full");
          expect(severityBadge).toBeInTheDocument();
          expect(severityBadge?.textContent).not.toBe("");

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});
