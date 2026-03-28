import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import fc from "fast-check";
import { useMapState } from "../../hooks/useMapState";
import { MapEvent, SeverityLevel } from "../../types";

// Feature: crisis-text-simplifier, Property 26: Deep link round-trip
// **Validates: Requirements 11.2, 11.5**

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

describe("Deep Link - Property 26: Deep link round-trip", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear URL hash before each test
    window.history.replaceState(null, "", window.location.pathname);
  });

  afterEach(() => {
    // Clean up URL hash after each test
    window.history.replaceState(null, "", window.location.pathname);
  });

  it("should encode and decode event id in URL hash with round-trip equality", () => {
    fc.assert(
      fc.property(mapEventArbitrary(), (event) => {
        // Generate a valid MapEvent
        const events = [event];

        // Render the hook
        const { result } = renderHook(() => useMapState(events));

        // Act: Select the event (this encodes id in URL hash)
        act(() => {
          result.current.selectEvent(event.id);
        });

        // Assert: URL hash contains the event id
        const expectedHash = `#event=${event.id}`;
        expect(window.location.hash).toBe(expectedHash);

        // Assert: Read back the id from the URL hash
        const hash = window.location.hash;
        const decodedId = hash.startsWith("#event=") ? hash.substring(7) : null;

        // Assert: Round-trip equality - decoded id matches original id
        expect(decodedId).toBe(event.id);

        // Assert: selectedEventId in state matches the original id
        expect(result.current.selectedEventId).toBe(event.id);
      }),
      { numRuns: 100 }
    );
  });

  it("should load app with deep link URL and select correct event", () => {
    fc.assert(
      fc.property(
        fc.array(mapEventArbitrary(), { minLength: 1, maxLength: 10 }),
        fc.integer({ min: 0, max: 9 }),
        (events, selectedIndex) => {
          // Ensure we have at least one event and valid index
          if (events.length === 0) return;
          const targetIndex = selectedIndex % events.length;
          const targetEvent = events[targetIndex];

          // Setup: Set URL hash before mounting the hook (simulates loading app with deep link)
          window.history.replaceState(null, "", `#event=${targetEvent.id}`);

          // Act: Mount the hook (this should read the URL hash and select the event)
          const { result } = renderHook(() => useMapState(events));

          // Assert: selectedEventId should equal the id from the URL hash
          expect(result.current.selectedEventId).toBe(targetEvent.id);

          // Assert: selectedEvent should be the correct event object
          expect(result.current.selectedEvent).toEqual(targetEvent);

          // Assert: URL hash should still contain the event id
          expect(window.location.hash).toBe(`#event=${targetEvent.id}`);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should handle round-trip for multiple sequential selections", () => {
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

          // Act: Select each event in sequence
          uniqueEvents.forEach((event) => {
            act(() => {
              result.current.selectEvent(event.id);
            });

            // Assert: URL hash matches current selection
            expect(window.location.hash).toBe(`#event=${event.id}`);

            // Assert: selectedEventId matches current selection
            expect(result.current.selectedEventId).toBe(event.id);

            // Assert: Round-trip - decode hash and verify equality
            const decodedId = window.location.hash.substring(7);
            expect(decodedId).toBe(event.id);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should handle dismiss clearing URL hash after selection", () => {
    fc.assert(
      fc.property(mapEventArbitrary(), (event) => {
        const events = [event];

        // Render the hook
        const { result } = renderHook(() => useMapState(events));

        // Act: Select event
        act(() => {
          result.current.selectEvent(event.id);
        });

        // Assert: Event is selected and hash is set
        expect(result.current.selectedEventId).toBe(event.id);
        expect(window.location.hash).toBe(`#event=${event.id}`);

        // Act: Dismiss event
        act(() => {
          result.current.dismissEvent();
        });

        // Assert: selectedEventId is null
        expect(result.current.selectedEventId).toBeNull();

        // Assert: URL hash is cleared
        expect(window.location.hash).toBe("");
      }),
      { numRuns: 100 }
    );
  });

  it("should handle invalid event id in URL hash gracefully", () => {
    fc.assert(
      fc.property(
        fc.array(mapEventArbitrary(), { minLength: 1, maxLength: 5 }),
        fc.stringMatching(/^evt-[a-z0-9]{3,15}$/),
        (events, invalidId) => {
          // Ensure invalidId is not in the events array
          const eventIds = events.map((e) => e.id);
          if (eventIds.includes(invalidId)) return; // Skip if randomly generated id exists

          // Setup: Set URL hash with invalid id
          window.history.replaceState(null, "", `#event=${invalidId}`);

          // Act: Mount the hook
          const { result } = renderHook(() => useMapState(events));

          // Assert: selectedEventId should be null (invalid id not selected)
          expect(result.current.selectedEventId).toBeNull();

          // Assert: selectedEvent should be null
          expect(result.current.selectedEvent).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should preserve round-trip equality for all valid event ids", () => {
    fc.assert(
      fc.property(
        fc.array(mapEventArbitrary(), { minLength: 1, maxLength: 10 }),
        (events) => {
          // Ensure unique ids
          const uniqueEvents = events.filter(
            (event, index, self) => self.findIndex((e) => e.id === event.id) === index
          );

          // Render the hook
          const { result } = renderHook(() => useMapState(uniqueEvents));

          // For each event, verify round-trip equality
          uniqueEvents.forEach((event) => {
            // Act: Select event
            act(() => {
              result.current.selectEvent(event.id);
            });

            // Assert: Encode id in URL
            const encodedHash = window.location.hash;
            expect(encodedHash).toBe(`#event=${event.id}`);

            // Assert: Decode id from URL
            const decodedId = encodedHash.startsWith("#event=")
              ? encodedHash.substring(7)
              : null;

            // Assert: Round-trip equality
            expect(decodedId).toBe(event.id);

            // Assert: State reflects the selected event
            expect(result.current.selectedEventId).toBe(event.id);
            expect(result.current.selectedEvent?.id).toBe(event.id);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
