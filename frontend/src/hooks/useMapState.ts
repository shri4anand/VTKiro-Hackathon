import { useState, useEffect, useMemo } from "react";
import { MapEvent, FeedItem } from "../types";

interface UseMapStateReturn {
  selectedEventId: string | null;
  selectedEvent: MapEvent | FeedItem | null;
  selectEvent: (id: string) => void;
  dismissEvent: () => void;
}

export function useMapState(events: MapEvent[], feedItems: FeedItem[] = []): UseMapStateReturn {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Derive selectedEvent from selectedEventId, searching both events and feedItems
  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return null;
    
    // First check MapEvent array
    const mapEvent = events.find((event) => event.id === selectedEventId);
    if (mapEvent) return mapEvent;
    
    // Then check FeedItem array
    const feedItem = feedItems.find((item) => item.id === selectedEventId);
    return feedItem || null;
  }, [selectedEventId, events, feedItems]);

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
      
      // Only select if the id exists in events or feedItems array
      const eventExists = events.some((event) => event.id === eventId) || 
                          feedItems.some((item) => item.id === eventId);
      if (eventExists) {
        selectEvent(eventId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount (events/feedItems dependency handled separately)

  return {
    selectedEventId,
    selectedEvent,
    selectEvent,
    dismissEvent,
  };
}
