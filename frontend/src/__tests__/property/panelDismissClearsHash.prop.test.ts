import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import fc from "fast-check";
import { useMapState } from "../../hooks/useMapState";
import { MapEvent, SeverityLevel } from "../../types";

// Feature: crisis-text-simplifier, Property 27: Panel dismiss clears URL hash
// **Validates: Requirements 11.4**

// Arbitrary for generating MapEvent records
const severityLevelArbitrary = fc.oneof(
  fc.constant("low" as SeverityLevel),
  fc.constant("medium" as SeverityLevel),
  fc.constant("high" as SeverityLevel),
  fc.constant("critical" as SeverityLevel)
);

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

describe("Panel Dismiss - Property 27: Panel dismiss clears URL hash", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear URL hash before each test
    window.history.replaceState(null, "", window.location.pathname);
  });

  afterEach(() => {
    // Clean up URL hash after each test
    window.history.replaceState(null, "", window.location.pathname);
  });

  it("should clear URL hash when dismissEvent is called after selecting an event", () => {
    fc.assert(
      fc.property(mapEventArbitrary(), (event) => {
        const events = [event];

        // Render the hook
        const { result } = renderHook(() => useMapState(events));

        // Act: Select event (this sets the URL hash)
        act(() => {
          result.current.selectEvent(event.id);
        });

        // Pre-condition: Verify event is selected and hash is set
        expect(result.current.selectedEventId).toBe(event.id);
        expect(window.location.hash).toBe(`#event=${event.id}`);

        // Act: Dismiss the event panel
        act(() => {
          result.current.dismissEvent();
        });

        // Assert: selectedEventId is cleared
        expect(result.current.selectedEventId).toBeNull();

        // Assert: URL hash no longer contains event id
        expect(window.location.hash).toBe("");
        
        // Assert: URL hash does not contain the event id string
        expect(window.location.href).not.toContain(event.id);
      }),
      { numRuns: 100 }
    );
  });

  it("should clear URL hash for multiple sequential select-dismiss cycles", () => {
    fc.assert(
      fc.property(
        fc.array(mapEventArbitrary(), { minLength: 2, maxLength: 5 }),
        (events) => {
          // Ensure unique ids
          const uniqueEvents = events.filter(
            (event, index, self) => self.findIndex((e) => e.id === event.id) === index
          );
          if (uniqueEvents.length < 2) return;

          // Render the hook
          const { result } = renderHook(() => useMapState(uniqueEvents));

          // Act: For each event, select then dismiss
          uniqueEvents.forEach((event) => {
            // Select event
            act(() => {
              result.current.selectEvent(event.id);
            });

            // Verify hash is set
            expect(window.location.hash).toBe(`#event=${event.id}`);
            expect(result.current.selectedEventId).toBe(event.id);

            // Dismiss event
            act(() => {
              result.current.dismissEvent();
            });

            // Assert: Hash is cleared after each dismiss
            expect(window.location.hash).toBe("");
            expect(result.current.selectedEventId).toBeNull();
            
            // Assert: URL does not contain any event id
            expect(window.location.href).not.toContain("event=");
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should not leave any event id in URL after dismiss regardless of event id format", () => {
    fc.assert(
      fc.property(
        fc.array(mapEventArbitrary(), { minLength: 1, maxLength: 10 }),
        fc.integer({ min: 0, max: 9 }),
        (events, selectedIndex) => {
          if (events.length === 0) return;
          const targetIndex = selectedIndex % events.length;
          const targetEvent = events[targetIndex];

          // Render the hook
          const { result } = renderHook(() => useMapState(events));

          // Act: Select event
          act(() => {
            result.current.selectEvent(targetEvent.id);
          });

          // Pre-condition: Hash contains event id
          const hashBeforeDismiss = window.location.hash;
          expect(hashBeforeDismiss).toContain(targetEvent.id);

          // Act: Dismiss event
          act(() => {
            result.current.dismissEvent();
          });

          // Assert: URL hash is completely empty
          expect(window.location.hash).toBe("");

          // Assert: Full URL does not contain the event id anywhere
          expect(window.location.href).not.toContain(targetEvent.id);

          // Assert: Full URL does not contain "event=" parameter
          expect(window.location.href).not.toContain("event=");
        }
      ),
      { numRuns: 100 }
    );
  });
});
