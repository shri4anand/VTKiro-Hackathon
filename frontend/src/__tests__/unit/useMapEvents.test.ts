import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useMapEvents } from "../../hooks/useMapEvents";
import { MapEvent } from "../../types";

describe("useMapEvents", () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    global.fetch = vi.fn();
  });

  it("should fetch map events successfully on mount", async () => {
    const mockEvents: MapEvent[] = [
      {
        id: "evt-001",
        title: "Test Event",
        description: "Test description",
        latitude: 40.7128,
        longitude: -74.006,
        timestamp: "2026-03-28T10:30:00Z",
        severity: "high",
      },
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEvents,
    } as Response);

    const { result } = renderHook(() => useMapEvents());

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.events).toEqual([]);
    expect(result.current.error).toBeNull();

    // Wait for fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // After successful fetch
    expect(result.current.events).toEqual(mockEvents);
    expect(result.current.error).toBeNull();
  });

  it("should return empty events array and set error on fetch failure", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      statusText: "Not Found",
    } as Response);

    const { result } = renderHook(() => useMapEvents());

    // Wait for fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // After failed fetch
    expect(result.current.events).toEqual([]); // Empty array so map renders without markers
    expect(result.current.error).toBeTruthy();
    expect(result.current.error).toContain("Failed to load map events");
  });

  it("should handle network errors gracefully", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("Network error")
    );

    const { result } = renderHook(() => useMapEvents());

    // Wait for fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // After network error
    expect(result.current.events).toEqual([]); // Empty array so map renders without markers
    expect(result.current.error).toBe("Network error");
  });

  it("should fetch from the correct endpoint", async () => {
    const mockEvents: MapEvent[] = [];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEvents,
    } as Response);

    renderHook(() => useMapEvents());

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/data/map-events.json");
    });
  });
});
