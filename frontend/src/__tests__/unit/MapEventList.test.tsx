import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { MapEventList } from "../../components/MapEventList";
import { MapEvent } from "../../types";

const mockEvents: MapEvent[] = [
  {
    id: "evt-001",
    title: "Wildfire — Northern California",
    description: "A fast-moving wildfire has prompted evacuation orders for three counties.",
    latitude: 39.5,
    longitude: -121.8,
    timestamp: "2024-07-15T14:30:00Z",
    severity: "critical",
  },
  {
    id: "evt-002",
    title: "Earthquake — Tokyo",
    description: "A magnitude 6.5 earthquake struck near Tokyo.",
    latitude: 35.6762,
    longitude: 139.6503,
    timestamp: "2024-07-16T08:15:00Z",
    severity: "high",
  },
  {
    id: "evt-003",
    title: "Flood Warning — Bangladesh",
    description: "Heavy monsoon rains have caused severe flooding.",
    latitude: 23.8103,
    longitude: 90.4125,
    timestamp: "2024-07-17T12:00:00Z",
    severity: "medium",
  },
];

describe("MapEventList", () => {
  describe("Rendering", () => {
    it("renders correct number of list items for a known event array", () => {
      const selectEvent = vi.fn();
      render(<MapEventList events={mockEvents} selectEvent={selectEvent} />);

      const listItems = screen.getAllByRole("button");
      expect(listItems).toHaveLength(3);
    });

    it("renders all event titles", () => {
      const selectEvent = vi.fn();
      render(<MapEventList events={mockEvents} selectEvent={selectEvent} />);

      expect(screen.getByText("Wildfire — Northern California")).toBeInTheDocument();
      expect(screen.getByText("Earthquake — Tokyo")).toBeInTheDocument();
      expect(screen.getByText("Flood Warning — Bangladesh")).toBeInTheDocument();
    });

    it("renders empty list when no events provided", () => {
      const selectEvent = vi.fn();
      render(<MapEventList events={[]} selectEvent={selectEvent} />);

      const listItems = screen.queryAllByRole("button");
      expect(listItems).toHaveLength(0);
    });

    it("renders single event correctly", () => {
      const selectEvent = vi.fn();
      const singleEvent = [mockEvents[0]];
      render(<MapEventList events={singleEvent} selectEvent={selectEvent} />);

      const listItems = screen.getAllByRole("button");
      expect(listItems).toHaveLength(1);
      expect(screen.getByText("Wildfire — Northern California")).toBeInTheDocument();
    });
  });

  describe("Keyboard activation", () => {
    it("calls selectEvent with correct id when Enter key is pressed", async () => {
      const user = userEvent.setup();
      const selectEvent = vi.fn();
      render(<MapEventList events={mockEvents} selectEvent={selectEvent} />);

      const firstItem = screen.getByRole("button", { name: /Wildfire — Northern California/i });
      firstItem.focus();
      await user.keyboard("{Enter}");

      expect(selectEvent).toHaveBeenCalledTimes(1);
      expect(selectEvent).toHaveBeenCalledWith("evt-001");
    });

    it("calls selectEvent with correct id when Space key is pressed", async () => {
      const user = userEvent.setup();
      const selectEvent = vi.fn();
      render(<MapEventList events={mockEvents} selectEvent={selectEvent} />);

      const secondItem = screen.getByRole("button", { name: /Earthquake — Tokyo/i });
      secondItem.focus();
      await user.keyboard(" ");

      expect(selectEvent).toHaveBeenCalledTimes(1);
      expect(selectEvent).toHaveBeenCalledWith("evt-002");
    });

    it("calls selectEvent for different events with correct ids", async () => {
      const user = userEvent.setup();
      const selectEvent = vi.fn();
      render(<MapEventList events={mockEvents} selectEvent={selectEvent} />);

      const thirdItem = screen.getByRole("button", { name: /Flood Warning — Bangladesh/i });
      thirdItem.focus();
      await user.keyboard("{Enter}");

      expect(selectEvent).toHaveBeenCalledTimes(1);
      expect(selectEvent).toHaveBeenCalledWith("evt-003");
    });

    it("does not call selectEvent when other keys are pressed", async () => {
      const user = userEvent.setup();
      const selectEvent = vi.fn();
      render(<MapEventList events={mockEvents} selectEvent={selectEvent} />);

      const firstItem = screen.getByRole("button", { name: /Wildfire — Northern California/i });
      firstItem.focus();
      await user.keyboard("a");
      await user.keyboard("{Tab}");

      expect(selectEvent).not.toHaveBeenCalled();
    });
  });

  describe("Click activation", () => {
    it("calls selectEvent with correct id when list item is clicked", async () => {
      const user = userEvent.setup();
      const selectEvent = vi.fn();
      render(<MapEventList events={mockEvents} selectEvent={selectEvent} />);

      const firstItem = screen.getByRole("button", { name: /Wildfire — Northern California/i });
      await user.click(firstItem);

      expect(selectEvent).toHaveBeenCalledTimes(1);
      expect(selectEvent).toHaveBeenCalledWith("evt-001");
    });
  });

  describe("Accessibility", () => {
    it("has role='list' on the ul element", () => {
      const selectEvent = vi.fn();
      render(<MapEventList events={mockEvents} selectEvent={selectEvent} />);

      const list = screen.getByRole("list");
      expect(list).toBeInTheDocument();
    });

    it("has aria-label on the list", () => {
      const selectEvent = vi.fn();
      render(<MapEventList events={mockEvents} selectEvent={selectEvent} />);

      const list = screen.getByLabelText("Crisis events list");
      expect(list).toBeInTheDocument();
    });

    it("each list item has role='button'", () => {
      const selectEvent = vi.fn();
      render(<MapEventList events={mockEvents} selectEvent={selectEvent} />);

      const listItems = screen.getAllByRole("button");
      expect(listItems).toHaveLength(3);
    });

    it("each list item has aria-label with title and severity", () => {
      const selectEvent = vi.fn();
      render(<MapEventList events={mockEvents} selectEvent={selectEvent} />);

      expect(screen.getByLabelText("Wildfire — Northern California, severity: critical")).toBeInTheDocument();
      expect(screen.getByLabelText("Earthquake — Tokyo, severity: high")).toBeInTheDocument();
      expect(screen.getByLabelText("Flood Warning — Bangladesh, severity: medium")).toBeInTheDocument();
    });

    it("each list item is keyboard focusable", () => {
      const selectEvent = vi.fn();
      render(<MapEventList events={mockEvents} selectEvent={selectEvent} />);

      const listItems = screen.getAllByRole("button");
      listItems.forEach((item) => {
        expect(item).toHaveAttribute("tabIndex", "0");
      });
    });
  });
});
