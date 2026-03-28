import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi, Mock } from "vitest";
import { MapView } from "../../components/MapView";
import { MapEvent, FeedItem, ReadingLevel } from "../../types";
import * as useMapStateModule from "../../hooks/useMapState";

// Mock mapbox-gl
vi.mock("mapbox-gl", () => ({
  default: {
    Map: vi.fn().mockImplementation(() => ({
      on: vi.fn(),
      addSource: vi.fn(),
      addLayer: vi.fn(),
      getSource: vi.fn(),
      isStyleLoaded: vi.fn(() => true),
      flyTo: vi.fn(),
      remove: vi.fn(),
      getCanvas: vi.fn(() => ({
        style: {},
      })),
      queryRenderedFeatures: vi.fn(() => []),
    })),
    accessToken: "",
  },
}));

// Mock hooks
vi.mock("../../hooks/useMapState");

describe("MapView", () => {
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
  ];

  const mockFeedItems: FeedItem[] = [];
  const activeLevel: ReadingLevel = "grade6";

  const mockSelectEvent = vi.fn();
  const mockDismissEvent = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Set default mock for VITE_MAPBOX_TOKEN
    import.meta.env.VITE_MAPBOX_TOKEN = "mock-token";

    // Default mock for useMapState
    (useMapStateModule.useMapState as Mock).mockReturnValue({
      selectedEventId: null,
      selectedEvent: null,
      selectEvent: mockSelectEvent,
      dismissEvent: mockDismissEvent,
    });
  });

  describe("Dataset load failure", () => {
    it("should show non-blocking error banner when dataset fails to load", async () => {
      // Mock useMapState
      (useMapStateModule.useMapState as Mock).mockReturnValue({
        selectedEventId: null,
        selectedEvent: null,
        selectEvent: mockSelectEvent,
        dismissEvent: mockDismissEvent,
      });

      render(
        <MapView
          events={[]}
          feedItems={mockFeedItems}
          activeLevel={activeLevel}
          datasetError="Could not load event data."
        />
      );

      // Wait for error banner to appear
      await waitFor(() => {
        const errorBanner = screen.getByText("Could not load event data.");
        expect(errorBanner).toBeInTheDocument();
      });

      // Verify error banner is visible
      const errorBanner = screen.getByText("Could not load event data.");
      expect(errorBanner).toHaveClass("bg-red-500");
    });

    it("should render map without markers when dataset fails to load", async () => {
      // Mock useMapState
      (useMapStateModule.useMapState as Mock).mockReturnValue({
        selectedEventId: null,
        selectedEvent: null,
        selectEvent: mockSelectEvent,
        dismissEvent: mockDismissEvent,
      });

      const { container } = render(
        <MapView
          events={[]}
          feedItems={mockFeedItems}
          activeLevel={activeLevel}
          datasetError="Could not load event data."
        />
      );

      // Verify map container is rendered
      await waitFor(() => {
        const mapContainer = container.querySelector("div[class*='w-full h-full']");
        expect(mapContainer).toBeInTheDocument();
      });

      // Verify no event detail panel is shown
      const panel = screen.queryByLabelText("Event detail panel");
      expect(panel).not.toBeInTheDocument();
    });
  });

  describe("Deep link with valid id", () => {
    it("should fly to event and open panel when deep link contains valid id", async () => {
      const selectedEvent = mockEvents[0];

      // Mock useMapState to return a selected event (simulating deep link on mount)
      (useMapStateModule.useMapState as Mock).mockReturnValue({
        selectedEventId: "evt-001",
        selectedEvent: selectedEvent,
        selectEvent: mockSelectEvent,
        dismissEvent: mockDismissEvent,
      });

      render(
        <MapView
          events={mockEvents}
          feedItems={mockFeedItems}
          activeLevel={activeLevel}
        />
      );

      // Wait for event detail panel to appear
      await waitFor(() => {
        const panel = screen.getByLabelText("Event detail panel");
        expect(panel).toBeInTheDocument();
      });

      // Verify panel shows the correct event
      expect(screen.getByText("Wildfire — Northern California")).toBeInTheDocument();
      expect(
        screen.getByText("A fast-moving wildfire has prompted evacuation orders.")
      ).toBeInTheDocument();
    });
  });

  describe("Deep link with invalid id", () => {
    it("should load map normally when deep link contains invalid id", async () => {
      // Mock useMapState to return null selectedEvent (invalid id was rejected)
      (useMapStateModule.useMapState as Mock).mockReturnValue({
        selectedEventId: null,
        selectedEvent: null,
        selectEvent: mockSelectEvent,
        dismissEvent: mockDismissEvent,
      });

      const { container } = render(
        <MapView
          events={mockEvents}
          feedItems={mockFeedItems}
          activeLevel={activeLevel}
        />
      );

      // Verify map container is rendered
      await waitFor(() => {
        const mapContainer = container.querySelector("div[class*='w-full h-full']");
        expect(mapContainer).toBeInTheDocument();
      });

      // Verify no event detail panel is shown
      const panel = screen.queryByLabelText("Event detail panel");
      expect(panel).not.toBeInTheDocument();

      // Verify no error banner is shown
      const errorBanner = screen.queryByText(/Event not found/i);
      expect(errorBanner).not.toBeInTheDocument();
    });
  });
});
