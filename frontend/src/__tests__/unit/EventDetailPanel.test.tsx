import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { EventDetailPanel } from "../../components/EventDetailPanel";
import { MapEvent, FeedItem, ReadingLevel } from "../../types";

const mockMapEvent: MapEvent = {
  id: "evt-001",
  title: "Wildfire — Northern California",
  description: "A fast-moving wildfire has prompted evacuation orders for three counties.",
  latitude: 39.5,
  longitude: -121.8,
  timestamp: "2024-07-15T14:30:00Z",
  severity: "critical",
};

const mockFeedItem: FeedItem = {
  id: "feed-001",
  title: "Emergency Alert: Flood Warning",
  source: "NewsAPI",
  publishedAt: "2024-07-16T10:00:00Z",
  latitude: 40.7,
  longitude: -74.0,
  variants: [
    { level: "grade3", text: "Water is rising. Leave now.", fkScore: 2.5 },
    { level: "grade6", text: "Flooding is occurring in your area. Evacuate immediately.", fkScore: 5.2 },
    { level: "grade9", text: "Severe flooding conditions require immediate evacuation of affected areas.", fkScore: 8.1 },
  ],
};

describe("EventDetailPanel", () => {
  describe("MapEvent rendering", () => {
    it("renders title for a MapEvent", () => {
      const dismissEvent = vi.fn();
      render(
        <EventDetailPanel
          event={mockMapEvent}
          activeLevel="grade3"
          dismissEvent={dismissEvent}
        />
      );
      expect(screen.getByText("Wildfire — Northern California")).toBeInTheDocument();
    });

    it("renders description for a MapEvent", () => {
      const dismissEvent = vi.fn();
      render(
        <EventDetailPanel
          event={mockMapEvent}
          activeLevel="grade3"
          dismissEvent={dismissEvent}
        />
      );
      expect(screen.getByText("A fast-moving wildfire has prompted evacuation orders for three counties.")).toBeInTheDocument();
    });

    it("renders formatted timestamp for a MapEvent", () => {
      const dismissEvent = vi.fn();
      render(
        <EventDetailPanel
          event={mockMapEvent}
          activeLevel="grade3"
          dismissEvent={dismissEvent}
        />
      );
      // The timestamp should be formatted as a readable date
      expect(screen.getByText(/Jul 15, 2024/i)).toBeInTheDocument();
    });

    it("renders severity badge for critical severity", () => {
      const dismissEvent = vi.fn();
      render(
        <EventDetailPanel
          event={mockMapEvent}
          activeLevel="grade3"
          dismissEvent={dismissEvent}
        />
      );
      expect(screen.getByText("Critical")).toBeInTheDocument();
    });

    it("renders severity badge for low severity", () => {
      const dismissEvent = vi.fn();
      const lowSeverityEvent: MapEvent = {
        ...mockMapEvent,
        severity: "low",
      };
      render(
        <EventDetailPanel
          event={lowSeverityEvent}
          activeLevel="grade3"
          dismissEvent={dismissEvent}
        />
      );
      expect(screen.getByText("Low")).toBeInTheDocument();
    });

    it("renders severity badge for medium severity", () => {
      const dismissEvent = vi.fn();
      const mediumSeverityEvent: MapEvent = {
        ...mockMapEvent,
        severity: "medium",
      };
      render(
        <EventDetailPanel
          event={mediumSeverityEvent}
          activeLevel="grade3"
          dismissEvent={dismissEvent}
        />
      );
      expect(screen.getByText("Medium")).toBeInTheDocument();
    });

    it("renders severity badge for high severity", () => {
      const dismissEvent = vi.fn();
      const highSeverityEvent: MapEvent = {
        ...mockMapEvent,
        severity: "high",
      };
      render(
        <EventDetailPanel
          event={highSeverityEvent}
          activeLevel="grade3"
          dismissEvent={dismissEvent}
        />
      );
      expect(screen.getByText("High")).toBeInTheDocument();
    });
  });

  describe("FeedItem rendering", () => {
    it("renders title for a FeedItem", () => {
      const dismissEvent = vi.fn();
      render(
        <EventDetailPanel
          event={mockFeedItem}
          activeLevel="grade3"
          dismissEvent={dismissEvent}
        />
      );
      expect(screen.getByText("Emergency Alert: Flood Warning")).toBeInTheDocument();
    });

    it("displays grade3 variant text when activeLevel is grade3", () => {
      const dismissEvent = vi.fn();
      render(
        <EventDetailPanel
          event={mockFeedItem}
          activeLevel="grade3"
          dismissEvent={dismissEvent}
        />
      );
      expect(screen.getByText("Water is rising. Leave now.")).toBeInTheDocument();
    });

    it("displays grade6 variant text when activeLevel is grade6", () => {
      const dismissEvent = vi.fn();
      render(
        <EventDetailPanel
          event={mockFeedItem}
          activeLevel="grade6"
          dismissEvent={dismissEvent}
        />
      );
      expect(screen.getByText("Flooding is occurring in your area. Evacuate immediately.")).toBeInTheDocument();
    });

    it("displays grade9 variant text when activeLevel is grade9", () => {
      const dismissEvent = vi.fn();
      render(
        <EventDetailPanel
          event={mockFeedItem}
          activeLevel="grade9"
          dismissEvent={dismissEvent}
        />
      );
      expect(screen.getByText("Severe flooding conditions require immediate evacuation of affected areas.")).toBeInTheDocument();
    });

    it("renders source information for a FeedItem", () => {
      const dismissEvent = vi.fn();
      render(
        <EventDetailPanel
          event={mockFeedItem}
          activeLevel="grade3"
          dismissEvent={dismissEvent}
        />
      );
      expect(screen.getByText(/Source: NewsAPI/i)).toBeInTheDocument();
    });

    it("renders formatted publishedAt timestamp for a FeedItem", () => {
      const dismissEvent = vi.fn();
      render(
        <EventDetailPanel
          event={mockFeedItem}
          activeLevel="grade3"
          dismissEvent={dismissEvent}
        />
      );
      // The timestamp should be formatted as a readable date
      expect(screen.getByText(/Jul 16, 2024/i)).toBeInTheDocument();
    });
  });

  describe("Dismiss functionality", () => {
    it("calls dismissEvent when close button is clicked", async () => {
      const user = userEvent.setup();
      const dismissEvent = vi.fn();
      render(
        <EventDetailPanel
          event={mockMapEvent}
          activeLevel="grade3"
          dismissEvent={dismissEvent}
        />
      );
      
      const closeButton = screen.getByRole("button", { name: /close event detail panel/i });
      await user.click(closeButton);
      
      expect(dismissEvent).toHaveBeenCalledTimes(1);
    });

    it("calls dismissEvent when Escape key is pressed", async () => {
      const user = userEvent.setup();
      const dismissEvent = vi.fn();
      render(
        <EventDetailPanel
          event={mockMapEvent}
          activeLevel="grade3"
          dismissEvent={dismissEvent}
        />
      );
      
      await user.keyboard("{Escape}");
      
      expect(dismissEvent).toHaveBeenCalledTimes(1);
    });
  });

  describe("Accessibility", () => {
    it("has aria-label on panel container", () => {
      const dismissEvent = vi.fn();
      render(
        <EventDetailPanel
          event={mockMapEvent}
          activeLevel="grade3"
          dismissEvent={dismissEvent}
        />
      );
      
      const panel = screen.getByLabelText("Event detail panel");
      expect(panel).toBeInTheDocument();
    });

    it("calls onOpen with event title when panel opens", () => {
      const dismissEvent = vi.fn();
      const onOpen = vi.fn();
      render(
        <EventDetailPanel
          event={mockMapEvent}
          activeLevel="grade3"
          dismissEvent={dismissEvent}
          onOpen={onOpen}
        />
      );
      
      expect(onOpen).toHaveBeenCalledWith("Wildfire — Northern California");
    });

    it("panel receives focus on mount", () => {
      const dismissEvent = vi.fn();
      render(
        <EventDetailPanel
          event={mockMapEvent}
          activeLevel="grade3"
          dismissEvent={dismissEvent}
        />
      );
      
      const panel = screen.getByLabelText("Event detail panel");
      expect(panel).toHaveFocus();
    });
  });
});
