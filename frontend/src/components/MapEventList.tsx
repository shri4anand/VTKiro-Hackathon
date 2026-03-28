import React from 'react';
import type { MapEvent } from '../types';

interface MapEventListProps {
  events: MapEvent[];
  selectEvent: (id: string) => void;
}

export function MapEventList({ events, selectEvent }: MapEventListProps) {
  const handleKeyDown = (event: React.KeyboardEvent, id: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectEvent(id);
    }
  };

  return (
    <ul className="sr-only" role="list" aria-label="Crisis events list">
      {events.map((event) => (
        <li
          key={event.id}
          tabIndex={0}
          role="button"
          aria-label={`${event.title}, severity: ${event.severity}`}
          onClick={() => selectEvent(event.id)}
          onKeyDown={(e) => handleKeyDown(e, event.id)}
        >
          {event.title}
        </li>
      ))}
    </ul>
  );
}
