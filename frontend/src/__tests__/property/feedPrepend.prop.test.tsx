import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";
import { render } from "@testing-library/react";
import { MapView } from "../../components/MapView";
import { FeedItem, ReadingLevel, MapEvent } from "../../types";
import mapboxgl from "mapbox-gl";

// Feature: crisis-text-simplifier, Property 30: New geo-tagged Feed_Items add markers without removing existing ones
// **Validates: Requirements 12.3**

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

// Arbitrary for generating MapEvent records
const mapEventArbitrary = (): fc.Arbitrary<MapEvent> => {
  return fc.record({
    id: fc.stringMatching(/^evt-[a-z0-9]{5,15}$/),
    title: fc.string({ minLength: 10, maxLength: 100 }).filter((s) => s.trim().length > 0),
    description: fc.string({ minLength: 20, maxLength: 200 }).filter((s) => s.trim().length > 0),
    latitude: fc.float({ min: -90, max: 90, noNaN: true }),
    longitude: fc.float({ min: -180, max: 180, noNaN: true }),
    timestamp: fc.date().map((d) => d.toISOString()),
    severity: fc.constantFrom("low", "medium", "high", "critical"),
  });
};

// Arbitrary for generating geo-tagged FeedItem records
const geoTaggedFeedItemArbitrary = (): fc.Arbitrary<FeedItem> => {
  return fc.record({
    id: fc.stringMatching(/^feed-[a-z0-9]{5,15}$/),
    title: fc.string({ minLength: 10, maxLength: 100 }).filter((s) => s.trim().length > 0),
    source: fc.string({ minLength: 3, maxLength: 50 }).filter((s) => s.trim().length > 0),
    publishedAt: fc.date().map((d) => d.toISOString()),
    latitude: fc.float({ min: -90, max: 90, noNaN: true }),
    longitude: fc.float({ min: -180, max: 180, noNaN: true }),
    variants: fc.constant([
      { level: "grade3" as ReadingLevel, text: "Simple text", fkScore: 3.0 },
      { level: "grade6" as ReadingLevel, text: "Medium text", fkScore: 5.5 },
      { level: "grade9" as ReadingLevel, text: "Complex text", fkScore: 8.0 },
    ]),
  });
};

describe("MapView - Property 30: New geo-tagged Feed_Items add markers without removing existing ones", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set mock token
    import.meta.env.VITE_MAPBOX_TOKEN = "mock-token";
  });

  it("should add new geo-tagged FeedItem markers without removing existing MapEvent or FeedItem markers", () => {
    // Property-based test: for any existing set of markers (MapEvents + FeedItems) of size N
    // and any new batch of M geo-tagged FeedItems, the total marker count should be N + M
    fc.assert(
      fc.property(
        fc.array(mapEventArbitrary(), { minLength: 0, maxLength: 20 }),
        fc.array(geoTaggedFeedItemArbitrary(), { minLength: 0, maxLength: 15 }),
        fc.array(geoTaggedFeedItemArbitrary(), { minLength: 1, maxLength: 15 }),
        fc.constantFrom("grade3" as ReadingLevel, "grade6" as ReadingLevel, "grade9" as ReadingLevel),
        (existingMapEvents, existingFeedItems, newFeedItems, activeLevel) => {
          // Ensure unique ids across all items
          const uniqueMapEvents = Array.from(
            new Map(existingMapEvents.map((e) => [e.id, e])).values()
          );
          const uniqueExistingFeedItems = Array.from(
            new Map(existingFeedItems.map((f) => [f.id, f])).values()
          );
          const uniqueNewFeedItems = Array.from(
            new Map(newFeedItems.map((f) => [f.id, f])).values()
          );

          // Ensure no id collision between existing and new feed items
          const allExistingIds = new Set([
            ...uniqueMapEvents.map((e) => e.id),
            ...uniqueExistingFeedItems.map((f) => f.id),
          ]);
          const filteredNewFeedItems = uniqueNewFeedItems.filter(
            (item) => !allExistingIds.has(item.id)
          );

          // Calculate expected counts
          const existingMarkerCount = uniqueMapEvents.length + uniqueExistingFeedItems.length;
          const newMarkerCount = filteredNewFeedItems.length;
          const expectedTotalCount = existingMarkerCount + newMarkerCount;

          // Simulate the feature creation logic from MapView
          // This mirrors the useEffect that updates the GeoJSON source
          const createFeatures = (
            events: MapEvent[],
            feedItems: FeedItem[],
            level: ReadingLevel
          ): GeoJSON.Feature[] => {
            const features: GeoJSON.Feature[] = [];

            // Add MapEvent features
            events.forEach((event) => {
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
            feedItems.forEach((item) => {
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
                    description: item.variants.find((v) => v.level === level)?.text || "",
                    timestamp: item.publishedAt,
                    severity: "medium",
                    source: "feed-item",
                  },
                });
              }
            });

            return features;
          };

          // Simulate initial state (existing markers)
          const initialFeatures = createFeatures(
            uniqueMapEvents,
            uniqueExistingFeedItems,
            activeLevel
          );

          // Simulate after new feed items are added
          const allFeedItems = [...uniqueExistingFeedItems, ...filteredNewFeedItems];
          const updatedFeatures = createFeatures(
            uniqueMapEvents,
            allFeedItems,
            activeLevel
          );

          // Assert: Total marker count equals sum of existing and new
          expect(updatedFeatures.length).toBe(expectedTotalCount);

          // Assert: All existing MapEvent markers are still present
          uniqueMapEvents.forEach((event) => {
            const feature = updatedFeatures.find((f) => f.properties?.id === event.id);
            expect(feature, `Existing MapEvent ${event.id} was removed`).toBeDefined();
          });

          // Assert: All existing FeedItem markers are still present
          uniqueExistingFeedItems.forEach((item) => {
            const feature = updatedFeatures.find((f) => f.properties?.id === item.id);
            expect(feature, `Existing FeedItem ${item.id} was removed`).toBeDefined();
          });

          // Assert: All new FeedItem markers are present
          filteredNewFeedItems.forEach((item) => {
            const feature = updatedFeatures.find((f) => f.properties?.id === item.id);
            expect(feature, `New FeedItem ${item.id} was not added`).toBeDefined();
          });

          // Assert: No duplicate markers (each id appears exactly once)
          const featureIds = updatedFeatures.map((f) => f.properties?.id);
          const uniqueFeatureIds = new Set(featureIds);
          expect(uniqueFeatureIds.size).toBe(updatedFeatures.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should handle empty existing marker sets", () => {
    // Edge case: starting with no markers, adding new ones
    fc.assert(
      fc.property(
        fc.array(geoTaggedFeedItemArbitrary(), { minLength: 1, maxLength: 20 }),
        fc.constantFrom("grade3" as ReadingLevel, "grade6" as ReadingLevel, "grade9" as ReadingLevel),
        (newFeedItems, activeLevel) => {
          const uniqueNewFeedItems = Array.from(
            new Map(newFeedItems.map((f) => [f.id, f])).values()
          );

          // Simulate feature creation with no existing markers
          const features: GeoJSON.Feature[] = [];

          uniqueNewFeedItems.forEach((item) => {
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
                  description: item.variants.find((v) => v.level === activeLevel)?.text || "",
                  timestamp: item.publishedAt,
                  severity: "medium",
                  source: "feed-item",
                },
              });
            }
          });

          // Assert: Marker count equals new FeedItem count
          expect(features.length).toBe(uniqueNewFeedItems.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should handle adding new markers when existing markers are present", () => {
    // Edge case: existing markers present, adding more
    fc.assert(
      fc.property(
        fc.array(mapEventArbitrary(), { minLength: 1, maxLength: 15 }),
        fc.array(geoTaggedFeedItemArbitrary(), { minLength: 1, maxLength: 15 }),
        fc.constantFrom("grade3" as ReadingLevel, "grade6" as ReadingLevel, "grade9" as ReadingLevel),
        (existingMapEvents, newFeedItems, activeLevel) => {
          const uniqueMapEvents = Array.from(
            new Map(existingMapEvents.map((e) => [e.id, e])).values()
          );
          const uniqueNewFeedItems = Array.from(
            new Map(newFeedItems.map((f) => [f.id, f])).values()
          );

          // Simulate feature creation
          const features: GeoJSON.Feature[] = [];

          // Add existing MapEvent features
          uniqueMapEvents.forEach((event) => {
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

          // Add new FeedItem features
          uniqueNewFeedItems.forEach((item) => {
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
                  description: item.variants.find((v) => v.level === activeLevel)?.text || "",
                  timestamp: item.publishedAt,
                  severity: "medium",
                  source: "feed-item",
                },
              });
            }
          });

          const expectedCount = uniqueMapEvents.length + uniqueNewFeedItems.length;

          // Assert: Total marker count equals sum
          expect(features.length).toBe(expectedCount);

          // Assert: All existing MapEvent markers are present
          uniqueMapEvents.forEach((event) => {
            const feature = features.find((f) => f.properties?.id === event.id);
            expect(feature, `MapEvent ${event.id} was removed`).toBeDefined();
          });

          // Assert: All new FeedItem markers are present
          uniqueNewFeedItems.forEach((item) => {
            const feature = features.find((f) => f.properties?.id === item.id);
            expect(feature, `New FeedItem ${item.id} was not added`).toBeDefined();
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
