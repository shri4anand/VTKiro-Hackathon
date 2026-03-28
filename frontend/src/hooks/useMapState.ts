import { useState, useEffect, useMemo } from "react";
import { MapEvent } from "../types";

interface UseMapStateReturn {
  selectedEventId: string | null;
  selectedEvent: MapEvent | null;
  selectEvent: (id: string) => void;
  dismissEvent: () => void;
}

export function useMapState(events: MapEvent[]): UseMapStateReturn {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Derive selectedEvent from selectedEventId and events array
  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return null;
    return events.find((event) => event.id === selectedEventId) || null;
  }, [selectedEventId, events]);

  // Select an event: update state and URL hash
  const selectEvent = (id: string) => {
    setSelectedEventId(id);
    // Update URL hash without triggering page reload
    window.history.replaceState(null, "", `#event=${id}`);
  };

  // Dismiss event: clear state and remove hash from URL
  const dismissEvent = () => {
    setSelectedEventId(null);
    // Remove hash from URL
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  };

  // On mount, read URL hash and select event if valid
  useEffect(() => {
    const hash = window.location.hash;
    
    // Check if hash matches #event=<id> pattern
    if (hash.startsWith("#event=")) {
      const eventId = hash.substring(7); // Remove "#event=" prefix
      
      // Only select if the id exists in events array
      const eventExists = events.some((event) => event.id === eventId);
      if (eventExists) {
        selectEvent(eventId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount (events dependency handled separately)

  return {
    selectedEventId,
    selectedEvent,
    selectEvent,
    dismissEvent,
  };
}
