import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { useMapState } from "../../hooks/useMapState";
import { MapEvent } from "../../types";

describe("useMapState", () => {
  const mockEvents: MapEvent[] = [
    {
      id: "evt-001",
      title: "Wildfire — Northern California",
      description: "A fast-moving wildfire has prompted evacuation orders.",
      latitude: 39.5,
      longitude: -121.8,
      timestamp: "2026-03-28T10:30:00Z",
      severity: "critical",
    },
    {
      id: "evt-002",
      title: "Hurricane Warning — Florida Coast",
      description: "Category 3 hurricane approaching the Florida coast.",
      latitude: 27.9,
      longitude: -82.5,
      timestamp: "2026-03-28T08:15:00Z",
      severity: "critical",
    },
    {
      id: "evt-003",
      title: "Earthquake — Tokyo Region",
      description: "Magnitude 6.2 earthquake struck near Tokyo.",
      latitude: 35.6762,
      longitude: 139.6503,
      timestamp: "2026-03-28T06:45:00Z",
      severity: "high",
    },
  ];

  // Store original location
  const originalLocation = window.location;

  beforeEach(() => {
    // Reset URL hash before each test
    window.history.replaceState(null, "", "/");
  });

  afterEach(() => {
    // Clean up URL hash after each test
    window.history.replaceState(null, "", "/");
  });

  it("should initialize with no selected event", () => {
    const { result } = renderHook(() => useMapState(mockEvents));

    expect(result.current.selectedEventId).toBeNull();
    expect(result.current.selectedEvent).toBeNull();
  });

  it("should select an event and update URL hash", () => {
    const { result } = renderHook(() => useMapState(mockEvents));

    act(() => {
      result.current.selectEvent("evt-001");
    });

    expect(result.current.selectedEventId).toBe("evt-001");
    expect(result.current.selectedEvent).toEqual(mockEvents[0]);
    expect(window.location.hash).toBe("#event=evt-001");
  });

  it("should dismiss event and clear URL hash", () => {
    const { result } = renderHook(() => useMapState(mockEvents));

    // First select an event
    act(() => {
      result.current.selectEvent("evt-002");
    });

    expect(result.current.selectedEventId).toBe("evt-002");
    expect(window.location.hash).toBe("#event=evt-002");

    // Then dismiss it
    act(() => {
      result.current.dismissEvent();
    });

    expect(result.current.selectedEventId).toBeNull();
    expect(result.current.selectedEvent).toBeNull();
    expect(window.location.hash).toBe("");
  });

  it("should read URL hash on mount and select valid event", () => {
    // Set URL hash before rendering hook
    window.history.replaceState(null, "", "#event=evt-003");

    const { result } = renderHook(() => useMapState(mockEvents));

    expect(result.current.selectedEventId).toBe("evt-003");
    expect(result.current.selectedEvent).toEqual(mockEvents[2]);
  });

  it("should not select event if URL hash contains invalid id", () => {
    // Set URL hash with non-existent event id
    window.history.replaceState(null, "", "#event=invalid-id");

    const { result } = renderHook(() => useMapState(mockEvents));

    expect(result.current.selectedEventId).toBeNull();
    expect(result.current.selectedEvent).toBeNull();
  });

  it("should not select event if URL hash format is incorrect", () => {
    // Set URL hash with wrong format
    window.history.replaceState(null, "", "#something-else");

    const { result } = renderHook(() => useMapState(mockEvents));

    expect(result.current.selectedEventId).toBeNull();
    expect(result.current.selectedEvent).toBeNull();
  });

  it("should return null selectedEvent when selectedEventId does not match any event", () => {
    const { result } = renderHook(() => useMapState(mockEvents));

    // Manually set an invalid id (simulating edge case)
    act(() => {
      result.current.selectEvent("non-existent-id");
    });

    expect(result.current.selectedEventId).toBe("non-existent-id");
    expect(result.current.selectedEvent).toBeNull();
  });

  it("should update selectedEvent when events array changes", () => {
    const { result, rerender } = renderHook(
      ({ events }) => useMapState(events),
      {
        initialProps: { events: mockEvents },
      }
    );

    act(() => {
      result.current.selectEvent("evt-001");
    });

    expect(result.current.selectedEvent).toEqual(mockEvents[0]);

    // Update events array with modified event
    const updatedEvents: MapEvent[] = [
      {
        ...mockEvents[0],
        title: "Updated Wildfire Title",
      },
      ...mockEvents.slice(1),
    ];

    rerender({ events: updatedEvents });

    expect(result.current.selectedEvent?.title).toBe("Updated Wildfire Title");
  });

  it("should handle multiple select calls correctly", () => {
    const { result } = renderHook(() => useMapState(mockEvents));

    act(() => {
      result.current.selectEvent("evt-001");
    });

    expect(result.current.selectedEventId).toBe("evt-001");
    expect(window.location.hash).toBe("#event=evt-001");

    act(() => {
      result.current.selectEvent("evt-002");
    });

    expect(result.current.selectedEventId).toBe("evt-002");
    expect(window.location.hash).toBe("#event=evt-002");
  });
});
