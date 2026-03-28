import { useEffect, useRef } from "react";
import { MapEvent, FeedItem, ReadingLevel, SeverityLevel } from "../types";

interface EventDetailPanelProps {
  event: MapEvent | FeedItem;
  activeLevel: ReadingLevel;
  dismissEvent: () => void;
  onOpen?: (title: string) => void;
}

const severityColors: Record<SeverityLevel, string> = {
  low: "bg-green-100 text-green-800 border-green-300",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  high: "bg-orange-100 text-orange-800 border-orange-300",
  critical: "bg-red-100 text-red-800 border-red-300",
};

const severityLabels: Record<SeverityLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

function isMapEvent(event: MapEvent | FeedItem): event is MapEvent {
  return "description" in event && !("variants" in event);
}

function isFeedItem(event: MapEvent | FeedItem): event is FeedItem {
  return "variants" in event;
}

function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return timestamp;
  }
}

export function EventDetailPanel({
  event,
  activeLevel,
  dismissEvent,
  onOpen,
}: EventDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Move focus to panel on open and announce title
  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.focus();
    }
    if (onOpen) {
      onOpen(event.title);
    }
  }, [event.title, onOpen]);

  // Handle Escape key to dismiss panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dismissEvent();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [dismissEvent]);

  // Determine severity for badge
  const severity: SeverityLevel = isMapEvent(event)
    ? event.severity
    : "medium"; // Default severity for feed items

  // Determine content to display
  const content = isMapEvent(event)
    ? event.description
    : isFeedItem(event)
    ? event.variants.find((v) => v.level === activeLevel)?.text || event.title
    : event.title;

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      aria-label="Event detail panel"
      className="absolute top-4 right-4 w-96 max-h-[calc(100vh-2rem)] bg-white rounded-lg shadow-2xl overflow-y-auto focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <div className="p-6">
        {/* Close button */}
        <button
          onClick={dismissEvent}
          aria-label="Close event detail panel"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Severity badge */}
        <div className="mb-4">
          <span
            className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${severityColors[severity]}`}
          >
            {severityLabels[severity]}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-900 mb-3 pr-8">
          {event.title}
        </h2>

        {/* Timestamp */}
        <p className="text-sm text-gray-500 mb-4">
          {formatTimestamp(event.timestamp || (event as FeedItem).publishedAt)}
        </p>

        {/* Content (description or simplified variant) */}
        <div className="text-gray-800 leading-relaxed">
          {content}
        </div>

        {/* Source info for feed items */}
        {isFeedItem(event) && (
          <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200">
            Source: {event.source}
          </p>
        )}
      </div>
    </div>
  );
}
