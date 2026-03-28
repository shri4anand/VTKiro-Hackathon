import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapEvent, FeedItem, ReadingLevel } from "../types";
import { useMapState } from "../hooks/useMapState";
import { EventDetailPanel } from "./EventDetailPanel";

interface MapViewProps {
  events: MapEvent[];
  feedItems: FeedItem[];
  activeLevel: ReadingLevel;
  datasetError?: string | null;
}

// Severity color mapping
const SEVERITY_COLORS: Record<string, string> = {
  low: "#22c55e",
  medium: "#eab308",
  high: "#f97316",
  critical: "#ef4444",
};

export function MapView({ events, feedItems, activeLevel, datasetError }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  const { selectedEventId, selectedEvent, selectEvent, dismissEvent } =
    useMapState(events, feedItems);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

    if (!mapboxToken) {
      setMapError("Map unavailable.");
      return;
    }

    try {
      mapboxgl.accessToken = mapboxToken;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [0, 20],
        zoom: 1.8,
      });

      mapRef.current = map;

      map.on("load", () => {
        // Add GeoJSON source with clustering
        map.addSource("crisis-events", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [],
          },
          cluster: true,
          clusterMaxZoom: 10,
          clusterRadius: 50,
        });

        // Add cluster layer (circle)
        map.addLayer({
          id: "clusters",
          type: "circle",
          source: "crisis-events",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": [
              "step",
              ["get", "point_count"],
              "#51bbd6",
              10,
              "#f1f075",
              30,
              "#f28cb1",
            ],
            "circle-radius": ["step", ["get", "point_count"], 20, 10, 30, 30, 40],
          },
        });

        // Add cluster count layer (symbol)
        map.addLayer({
          id: "cluster-count",
          type: "symbol",
          source: "crisis-events",
          filter: ["has", "point_count"],
          layout: {
            "text-field": ["get", "point_count"],
            "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 12,
          },
          paint: {
            "text-color": "#ffffff",
          },
        });

        // Add unclustered point layer (circle with severity color)
        map.addLayer({
          id: "unclustered-point",
          type: "circle",
          source: "crisis-events",
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": [
              "match",
              ["get", "severity"],
              "low",
              SEVERITY_COLORS.low,
              "medium",
              SEVERITY_COLORS.medium,
              "high",
              SEVERITY_COLORS.high,
              "critical",
              SEVERITY_COLORS.critical,
              "#cccccc", // default fallback
            ],
            "circle-radius": 8,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        });

        // Register click handler on unclustered markers
        map.on("click", "unclustered-point", (e) => {
          if (e.features && e.features.length > 0) {
            const feature = e.features[0];
            const eventId = feature.properties?.id;
            if (eventId) {
              selectEvent(eventId);
            }
          }
        });

        // Register click handler on clusters to zoom in
        map.on("click", "clusters", (e) => {
          if (e.features && e.features.length > 0) {
            const features = e.features;
            const clusterId = features[0].properties?.cluster_id;
            const source = map.getSource("crisis-events") as mapboxgl.GeoJSONSource;

            source.getClusterExpansionZoom(clusterId, (err, zoom) => {
              if (err) return;

              map.easeTo({
                center: (features[0].geometry as any).coordinates,
                zoom: zoom,
              });
            });
          }
        });

        // Register click handler on map background to dismiss panel
        map.on("click", (e) => {
          // Only dismiss if not clicking on a marker
          const features = map.queryRenderedFeatures(e.point, {
            layers: ["unclustered-point", "clusters"],
          });

          if (features.length === 0) {
            dismissEvent();
          }
        });

        // Change cursor on hover over markers
        map.on("mouseenter", "unclustered-point", () => {
          map.getCanvas().style.cursor = "pointer";
        });

        map.on("mouseleave", "unclustered-point", () => {
          map.getCanvas().style.cursor = "";
        });

        map.on("mouseenter", "clusters", () => {
          map.getCanvas().style.cursor = "pointer";
        });

        map.on("mouseleave", "clusters", () => {
          map.getCanvas().style.cursor = "";
        });
      });

      return () => {
        map.remove();
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Map initialization failed.";
      setMapError(errorMessage);
    }
  }, []);

  // Update GeoJSON source when events or feedItems change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource("crisis-events") as mapboxgl.GeoJSONSource;
    if (!source) return;

    // Merge MapEvent[] and geo-tagged FeedItem[] into GeoJSON features
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
            description: item.variants.find((v) => v.level === activeLevel)?.text || "",
            timestamp: item.publishedAt,
            severity: "medium", // Default severity for feed items
            source: "feed-item",
          },
        });
      }
    });

    source.setData({
      type: "FeatureCollection",
      features,
    });
  }, [events, feedItems, activeLevel]);

  // Fly to selected event when selectedEventId changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedEvent) return;

    // Get coordinates based on event type
    const latitude = "latitude" in selectedEvent ? selectedEvent.latitude : undefined;
    const longitude = "longitude" in selectedEvent ? selectedEvent.longitude : undefined;

    if (latitude !== undefined && longitude !== undefined) {
      map.flyTo({
        center: [longitude, latitude],
        zoom: 10,
        essential: true,
      });
    }
  }, [selectedEvent]);

  return (
    <div className="relative w-full h-screen">
      {/* Map container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Error banner for map initialization errors */}
      {mapError && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded shadow-lg">
          {mapError}
        </div>
      )}

      {/* Error banner for dataset load errors */}
      {datasetError && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded shadow-lg">
          {datasetError}
        </div>
      )}

      {/* Event detail panel */}
      {selectedEvent && (
        <EventDetailPanel
          event={selectedEvent}
          activeLevel={activeLevel}
          onDismiss={dismissEvent}
        />
      )}
    </div>
  );
}
