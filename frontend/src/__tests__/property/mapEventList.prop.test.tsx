import { describe, it, expect, vi } from "vitest";
import fc from "fast-check";
import { render, screen } from "@testing-library/react";
import { MapEventList } from "../../components/MapEventList";
import { MapEvent, SeverityLevel } from "../../types";

// Feature: crisis-text-simplifier, Property 31: Map event list contains all events
// **Validates: Requirements 14.1**

// Arbitrary for generating SeverityLevel
const severityLevelArbitrary = fc.oneof(
  fc.constant("low" as SeverityLevel),
  fc.constant("medium" as SeverityLevel),
  fc.constant("high" as SeverityLevel),
  fc.constant("critical" as SeverityLevel)
);

// Arbitrary for generating MapEvent records
const mapEventArbitrary = (): fc.Arbitrary<MapEvent> => {
  return fc.record({
    id: fc.stringMatching(/^evt-[a-z0-9]{3,15}$/),
    title: fc.string({ minLength: 10, maxLength: 100 }).filter((s) => s.trim().length > 0),
    description: fc.string({ minLength: 20, maxLength: 300 }).filter((s) => s.trim().length > 0),
    latitude: fc.float({ min: -90, max: 90, noNaN: true }),
    longitude: fc.float({ min: -180, max: 180, noNaN: true }),
    timestamp: fc.date().map((d) => d.toISOString()),
    severity: severityLevelArbitrary,
  });
};

describe("MapEventList - Property 31: Map event list contains all events", () => {
  it("should render exactly as many list items as there are events in the array", () => {
    // Property-based test: for any array of MapEvent records,
    // the MapEventList component should render exactly as many list items as there are events
    fc.assert(
      fc.property(
        fc.array(mapEventArbitrary(), { minLength: 0, maxLength: 50 }),
        (events) => {
          // Ensure unique ids
          const uniqueEvents = Array.from(
            new Map(events.map((e) => [e.id, e])).values()
          );

          const mockSelectEvent = vi.fn();

          // Render MapEventList with generated events
          const { container } = render(
            <MapEventList events={uniqueEvents} selectEvent={mockSelectEvent} />
          );

          // Query all list items
          const listItems = container.querySelectorAll("li");

          // Assert: List item count equals event array length
          expect(listItems.length).toBe(uniqueEvents.length);

          // Assert: Every event has a corresponding list item
          uniqueEvents.forEach((event) => {
            const listItem = Array.from(listItems).find((li) =>
              li.textContent?.includes(event.title)
            );
            expect(listItem, `No list item found for event ${event.id}`).toBeDefined();
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should handle empty event arrays", () => {
    const mockSelectEvent = vi.fn();

    const { container } = render(
      <MapEventList events={[]} selectEvent={mockSelectEvent} />
    );

    const listItems = container.querySelectorAll("li");

    // Assert: Empty events array results in no list items
    expect(listItems.length).toBe(0);
  });

  it("should render list items with correct ARIA attributes", () => {
    fc.assert(
      fc.property(
        fc.array(mapEventArbitrary(), { minLength: 1, maxLength: 10 }),
        (events) => {
          const uniqueEvents = Array.from(
            new Map(events.map((e) => [e.id, e])).values()
          );

          const mockSelectEvent = vi.fn();

          const { container } = render(
            <MapEventList events={uniqueEvents} selectEvent={mockSelectEvent} />
          );

          const listItems = container.querySelectorAll("li");

          // Assert: Every list item has required ARIA attributes
          listItems.forEach((li) => {
            expect(li.getAttribute("role")).toBe("button");
            expect(li.getAttribute("tabIndex")).toBe("0");
            expect(li.getAttribute("aria-label")).toBeTruthy();
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
