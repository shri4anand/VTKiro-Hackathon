import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useMapEvents } from "../../hooks/useMapEvents";

describe("useMapEvents integration", () => {
  beforeEach(() => {
    // Mock fetch to simulate loading the actual map-events.json file
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === "/data/map-events.json") {
        // Simulate the actual file structure
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: "evt-001",
              title: "Wildfire — Northern California",
              description:
                "A fast-moving wildfire has prompted evacuation orders for three counties in Northern California. Residents are advised to leave immediately.",
              latitude: 39.5,
              longitude: -121.8,
              timestamp: "2026-03-28T10:30:00Z",
              severity: "critical",
            },
            {
              id: "evt-002",
              title: "Hurricane Warning — Florida Coast",
              description:
                "Category 3 hurricane approaching the Florida coast. Coastal areas under mandatory evacuation.",
              latitude: 27.9,
              longitude: -82.5,
              timestamp: "2026-03-28T08:15:00Z",
              severity: "critical",
            },
          ],
        } as Response);
      }
      return Promise.reject(new Error("Not found"));
    });
  });

  it("should load map events with correct structure from mock data", async () => {
    const { result } = renderHook(() => useMapEvents());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.events).toHaveLength(2);

    // Verify first event has all required fields
    const firstEvent = result.current.events[0];
    expect(firstEvent).toHaveProperty("id");
    expect(firstEvent).toHaveProperty("title");
    expect(firstEvent).toHaveProperty("description");
    expect(firstEvent).toHaveProperty("latitude");
    expect(firstEvent).toHaveProperty("longitude");
    expect(firstEvent).toHaveProperty("timestamp");
    expect(firstEvent).toHaveProperty("severity");

    // Verify severity levels are valid
    expect(["low", "medium", "high", "critical"]).toContain(
      firstEvent.severity
    );
  });

  it("should handle all severity levels correctly", async () => {
    // Mock with all severity levels
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: "evt-low",
          title: "Low Severity Event",
          description: "Test",
          latitude: 0,
          longitude: 0,
          timestamp: "2026-03-28T10:30:00Z",
          severity: "low",
        },
        {
          id: "evt-medium",
          title: "Medium Severity Event",
          description: "Test",
          latitude: 0,
          longitude: 0,
          timestamp: "2026-03-28T10:30:00Z",
          severity: "medium",
        },
        {
          id: "evt-high",
          title: "High Severity Event",
          description: "Test",
          latitude: 0,
          longitude: 0,
          timestamp: "2026-03-28T10:30:00Z",
          severity: "high",
        },
        {
          id: "evt-critical",
          title: "Critical Severity Event",
          description: "Test",
          latitude: 0,
          longitude: 0,
          timestamp: "2026-03-28T10:30:00Z",
          severity: "critical",
        },
      ],
    } as Response);

    const { result } = renderHook(() => useMapEvents());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.events).toHaveLength(4);
    const severities = result.current.events.map((e) => e.severity);
    expect(severities).toContain("low");
    expect(severities).toContain("medium");
    expect(severities).toContain("high");
    expect(severities).toContain("critical");
  });
});
