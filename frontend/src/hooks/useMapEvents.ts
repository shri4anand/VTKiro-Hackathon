import { useState, useEffect } from "react";
import { MapEvent } from "../types";

export function useMapEvents() {
  const [events, setEvents] = useState<MapEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMapEvents = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/data/map-events.json");

        if (!response.ok) {
          throw new Error(`Failed to load map events: ${response.statusText}`);
        }

        const data: MapEvent[] = await response.json();
        setEvents(data);
      } catch (err) {
        // On error, set error message and return empty events array
        const errorMessage =
          err instanceof Error ? err.message : "Could not load event data.";
        setError(errorMessage);
        setEvents([]); // Return empty array so map renders without markers
      } finally {
        setLoading(false);
      }
    };

    fetchMapEvents();
  }, []); // Run only on mount

  return {
    events,
    loading,
    error,
  };
}
