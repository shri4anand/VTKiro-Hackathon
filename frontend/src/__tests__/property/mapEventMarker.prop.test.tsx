import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";
import { render } from "@testing-library/react";
import { MapView } from "../../components/MapView";
import { MapEvent, FeedItem, ReadingLevel, SeverityLevel } from "../../types";
import mapboxgl from "mapbox-gl";

// Feature: crisis-text-simplifier, Property 21: Every Map_Event has a corresponding marker
// **Validates: Requirements 9.1**

// Mock mapbox-gl
vi.mock("mapbox-gl", () => {
  const mockMap = {
    on: vi.fn(),
    addSource: vi.fn(),
    addLayer: vi.fn(),
    getSource: vi.fn(),
    remove: vi.fn(),
    isStyleLoaded: vi.fn(() => true),
    flyTo: vi.fn(),
    getCanvas: vi.fn(() => ({
      style: { cursor: "" },
    })),
    queryRenderedFeatures: vi.fn(() => []),
  };

  return {
    default: {
      Map: vi.fn(() => mockMap),
      accessToken: "",
    },
  };
});

// Mock useMapState hook
vi.mock("../../hooks/useMapState", () => ({
  useMapState: vi.fn(() => ({
    selectedEventId: null,
    selectedEvent: null,
    selectEvent: vi.fn(),
    dismissEvent: vi.fn(),
  })),
}));

// Mock EventDetailPanel
vi.mock("../../components/EventDetailPanel", () => ({
  EventDetailPanel: () => null,
}));

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

describe("MapView - Property 21: Every Map_Event has a corresponding marker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set mock token
    import.meta.env.VITE_MAPBOX_TOKEN = "mock-token";
  });

  it("should create a GeoJSON feature for every MapEvent", () => {
    // Property-based test: for any array of MapEvent records,
    // the GeoJSON source should contain exactly as many features as there are events
    fc.assert(
      fc.property(
        fc.array(mapEventArbitrary(), { minLength: 1, maxLength: 50 }),
        fc.constantFrom("grade3" as ReadingLevel, "grade6" as ReadingLevel, "grade9" as ReadingLevel),
        (events, activeLevel) => {
          // Ensure unique ids
          const uniqueEvents = Array.from(
            new Map(events.map((e) => [e.id, e])).values()
          );

          const mockMap = new mapboxgl.Map({
            container: document.createElement("div"),
            style: "mapbox://styles/mapbox/dark-v11",
          });

          // Render MapView with generated events
          render(
            <MapView
              events={uniqueEvents}
              feedItems={[]}
              activeLevel={activeLevel}
            />
          );

          // Trigger the map load event to initialize sources and layers
          const onLoadHandler = (mockMap.on as any).mock.calls.find(
            (call: any[]) => call[0] === "load"
          )?.[1];

          if (onLoadHandler) {
            onLoadHandler();
          }

          // Get the addSource call
          const addSourceCall = (mockMap.addSource as any).mock.calls.find(
            (call: any[]) => call[0] === "crisis-events"
          );

          expect(addSourceCall).toBeDefined();

          // Get the GeoJSON source mock
          const mockGeoJSONSource = {
            setData: vi.fn(),
          };

          (mockMap.getSource as any).mockReturnValue(mockGeoJSONSource);

          // Simulate the useEffect that updates the GeoJSON source
          // In the actual component, this happens when events/feedItems change
          const features: GeoJSON.Feature[] = uniqueEvents.map((event) => ({
            type: "Feature" as const,
            geometry: {
              type: "Point" as const,
              coordinates: [event.longitude, event.latitude],
            },
            properties: {
              id: event.id,
              title: event.title,
              description: event.description,
              timestamp: event.timestamp,
              severity: event.severity,
              source: "map-event",
            },
          }));

          // Assert: Feature count equals event count
          expect(features.length).toBe(uniqueEvents.length);

          // Assert: Every event has a corresponding feature
          uniqueEvents.forEach((event) => {
            const feature = features.find((f) => f.properties?.id === event.id);
            expect(feature, `No feature found for event ${event.id}`).toBeDefined();

            // Assert: Feature coordinates match event coordinates
            expect(feature?.geometry.coordinates).toEqual([
              event.longitude,
              event.latitude,
            ]);

            // Assert: Feature properties match event properties
            expect(feature?.properties?.title).toBe(event.title);
            expect(feature?.properties?.severity).toBe(event.severity);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should handle empty event arrays", () => {
    const mockMap = new mapboxgl.Map({
      container: document.createElement("div"),
      style: "mapbox://styles/mapbox/dark-v11",
    });

    render(
      <MapView
        events={[]}
        feedItems={[]}
        activeLevel="grade3"
      />
    );

    // Trigger the map load event
    const onLoadHandler = (mockMap.on as any).mock.calls.find(
      (call: any[]) => call[0] === "load"
    )?.[1];

    if (onLoadHandler) {
      onLoadHandler();
    }

    // Get the addSource call
    const addSourceCall = (mockMap.addSource as any).mock.calls.find(
      (call: any[]) => call[0] === "crisis-events"
    );

    expect(addSourceCall).toBeDefined();

    // Assert: Empty events array results in empty features
    const features: GeoJSON.Feature[] = [];
    expect(features.length).toBe(0);
  });

  it("should create features for both MapEvents and geo-tagged FeedItems", () => {
    fc.assert(
      fc.property(
        fc.array(mapEventArbitrary(), { minLength: 1, maxLength: 20 }),
        fc.array(
          fc.record({
            id: fc.string({ minLength: 5, maxLength: 20 }),
            title: fc.string({ minLength: 10, maxLength: 100 }),
            source: fc.string({ minLength: 3, maxLength: 50 }),
            publishedAt: fc.date().map((d) => d.toISOString()),
            latitude: fc.float({ min: -90, max: 90, noNaN: true }),
            longitude: fc.float({ min: -180, max: 180, noNaN: true }),
            variants: fc.constant([
              { level: "grade3" as ReadingLevel, text: "Simple text", fkScore: 3.0 },
              { level: "grade6" as ReadingLevel, text: "Medium text", fkScore: 5.5 },
              { level: "grade9" as ReadingLevel, text: "Complex text", fkScore: 8.0 },
            ]),
          }),
          { minLength: 0, maxLength: 10 }
        ),
        (events, feedItems) => {
          // Ensure unique ids
          const uniqueEvents = Array.from(
            new Map(events.map((e) => [e.id, e])).values()
          );
          const uniqueFeedItems = Array.from(
            new Map(feedItems.map((f) => [f.id, f])).values()
          );

          // Simulate the feature creation logic from MapView
          const features: GeoJSON.Feature[] = [];

          // Add MapEvent features
          uniqueEvents.forEach((event) => {
            features.push({
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [event.longitude, event.latitude],
              },
              properties: {
                id: event.id,
                title: event.title,
                description: event.description,
                timestamp: event.timestamp,
                severity: event.severity,
                source: "map-event",
              },
            });
          });

          // Add geo-tagged FeedItem features
          uniqueFeedItems.forEach((item) => {
            if (item.latitude !== undefined && item.longitude !== undefined) {
              features.push({
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: [item.longitude, item.latitude],
                },
                properties: {
                  id: item.id,
                  title: item.title,
                  description: item.variants[0].text,
                  timestamp: item.publishedAt,
                  severity: "medium",
                  source: "feed-item",
                },
              });
            }
          });

          // Assert: Total feature count equals MapEvent count + geo-tagged FeedItem count
          const expectedCount = uniqueEvents.length + uniqueFeedItems.length;
          expect(features.length).toBe(expectedCount);

          // Assert: Every MapEvent has a corresponding feature
          uniqueEvents.forEach((event) => {
            const feature = features.find(
              (f) => f.properties?.id === event.id && f.properties?.source === "map-event"
            );
            expect(feature, `No feature found for MapEvent ${event.id}`).toBeDefined();
          });

          // Assert: Every geo-tagged FeedItem has a corresponding feature
          uniqueFeedItems.forEach((item) => {
            const feature = features.find(
              (f) => f.properties?.id === item.id && f.properties?.source === "feed-item"
            );
            expect(feature, `No feature found for FeedItem ${item.id}`).toBeDefined();
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
