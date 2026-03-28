import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { EventDetailPanel } from "../../components/EventDetailPanel";
import { FeedItem, ReadingLevel } from "../../types";

// Feature: crisis-text-simplifier, Property 29: Feed_Item panel shows correct reading level variant
// **Validates: Requirements 12.2, 12.4**

describe("EventDetailPanel - Property 29: Feed_Item panel shows correct reading level variant", () => {
  it("should display the correct reading level variant for any FeedItem and active level", () => {
    // Property-based test: for any FeedItem marker selection and any active reading level,
    // the EventDetailPanel should display the SimplifiedOutput text corresponding to that reading level
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 5, maxLength: 20 }).filter((s) => s.trim().length > 0),
          title: fc.string({ minLength: 10, maxLength: 100 }).filter((s) => s.trim().length > 0),
          source: fc.string({ minLength: 5, maxLength: 50 }).filter((s) => s.trim().length > 0),
          publishedAt: fc.date().map((d) => d.toISOString()),
          latitude: fc.float({ min: Math.fround(-90), max: Math.fround(90) }),
          longitude: fc.float({ min: Math.fround(-180), max: Math.fround(180) }),
          grade3Text: fc.string({ minLength: 20, maxLength: 150 }).filter((s) => s.trim().length > 0),
          grade6Text: fc.string({ minLength: 20, maxLength: 150 }).filter((s) => s.trim().length > 0),
          grade9Text: fc.string({ minLength: 20, maxLength: 150 }).filter((s) => s.trim().length > 0),
          grade3Score: fc.float({ min: Math.fround(0.1), max: Math.fround(4.0) }),
          grade6Score: fc.float({ min: Math.fround(4.1), max: Math.fround(7.0) }),
          grade9Score: fc.float({ min: Math.fround(7.1), max: Math.fround(10.0) }),
          activeLevel: fc.constantFrom<ReadingLevel>("grade3", "grade6", "grade9"),
        }),
        ({
          id,
          title,
          source,
          publishedAt,
          latitude,
          longitude,
          grade3Text,
          grade6Text,
          grade9Text,
          grade3Score,
          grade6Score,
          grade9Score,
          activeLevel,
        }) => {
          // Construct a FeedItem with all three variants
          const feedItem: FeedItem = {
            id,
            title,
            source,
            publishedAt,
            latitude,
            longitude,
            variants: [
              { level: "grade3", text: grade3Text, fkScore: grade3Score },
              { level: "grade6", text: grade6Text, fkScore: grade6Score },
              { level: "grade9", text: grade9Text, fkScore: grade9Score },
            ],
          };

          // Render the EventDetailPanel with the FeedItem and active level
          const { unmount } = render(
            <EventDetailPanel
              event={feedItem}
              activeLevel={activeLevel}
              dismissEvent={() => {}}
            />
          );

          // Determine which text should be displayed based on active level
          const expectedText =
            activeLevel === "grade3"
              ? grade3Text
              : activeLevel === "grade6"
              ? grade6Text
              : grade9Text;

          // Assert: The panel displays the correct variant text for the active level
          expect(screen.getByText((content, element) => {
            return element?.textContent?.trim() === expectedText.trim();
          })).toBeInTheDocument();

          // Assert: The panel does NOT display the other two variant texts
          const otherTexts = [grade3Text, grade6Text, grade9Text].filter(
            (text) => text !== expectedText
          );
          otherTexts.forEach((text) => {
            expect(screen.queryByText(text)).not.toBeInTheDocument();
          });

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should update displayed variant when active level changes", () => {
    // Property-based test: for any FeedItem, changing the active reading level
    // should update the displayed text to match the new level
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 5, maxLength: 20 }).filter((s) => s.trim().length > 0),
          title: fc.string({ minLength: 10, maxLength: 100 }).filter((s) => s.trim().length > 0),
          source: fc.string({ minLength: 5, maxLength: 50 }).filter((s) => s.trim().length > 0),
          publishedAt: fc.date().map((d) => d.toISOString()),
          grade3Text: fc.string({ minLength: 20, maxLength: 150 }).filter((s) => s.trim().length > 0),
          grade6Text: fc.string({ minLength: 20, maxLength: 150 }).filter((s) => s.trim().length > 0),
          grade9Text: fc.string({ minLength: 20, maxLength: 150 }).filter((s) => s.trim().length > 0),
          grade3Score: fc.float({ min: Math.fround(0.1), max: Math.fround(4.0) }),
          grade6Score: fc.float({ min: Math.fround(4.1), max: Math.fround(7.0) }),
          grade9Score: fc.float({ min: Math.fround(7.1), max: Math.fround(10.0) }),
          initialLevel: fc.constantFrom<ReadingLevel>("grade3", "grade6", "grade9"),
          newLevel: fc.constantFrom<ReadingLevel>("grade3", "grade6", "grade9"),
        }),
        ({
          id,
          title,
          source,
          publishedAt,
          grade3Text,
          grade6Text,
          grade9Text,
          grade3Score,
          grade6Score,
          grade9Score,
          initialLevel,
          newLevel,
        }) => {
          const feedItem: FeedItem = {
            id,
            title,
            source,
            publishedAt,
            variants: [
              { level: "grade3", text: grade3Text, fkScore: grade3Score },
              { level: "grade6", text: grade6Text, fkScore: grade6Score },
              { level: "grade9", text: grade9Text, fkScore: grade9Score },
            ],
          };

          // Render with initial level
          const { rerender, unmount } = render(
            <EventDetailPanel
              event={feedItem}
              activeLevel={initialLevel}
              dismissEvent={() => {}}
            />
          );

          // Verify initial level text is displayed
          const initialText =
            initialLevel === "grade3"
              ? grade3Text
              : initialLevel === "grade6"
              ? grade6Text
              : grade9Text;
          expect(screen.getByText((content, element) => {
            return element?.textContent?.trim() === initialText.trim();
          })).toBeInTheDocument();

          // Re-render with new level
          rerender(
            <EventDetailPanel
              event={feedItem}
              activeLevel={newLevel}
              dismissEvent={() => {}}
            />
          );

          // Verify new level text is displayed
          const newText =
            newLevel === "grade3"
              ? grade3Text
              : newLevel === "grade6"
              ? grade6Text
              : grade9Text;
          expect(screen.getByText((content, element) => {
            return element?.textContent?.trim() === newText.trim();
          })).toBeInTheDocument();

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should display all required FeedItem fields in the panel", () => {
    // Property-based test: for any FeedItem, the panel should display
    // title, source, timestamp, and the correct variant text
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 5, maxLength: 20 }).filter((s) => s.trim().length > 0),
          title: fc.string({ minLength: 10, maxLength: 100 }).filter((s) => s.trim().length > 0),
          source: fc.string({ minLength: 5, maxLength: 50 }).filter((s) => s.trim().length > 0),
          publishedAt: fc.date().map((d) => d.toISOString()),
          grade3Text: fc.string({ minLength: 20, maxLength: 150 }).filter((s) => s.trim().length > 0),
          grade6Text: fc.string({ minLength: 20, maxLength: 150 }).filter((s) => s.trim().length > 0),
          grade9Text: fc.string({ minLength: 20, maxLength: 150 }).filter((s) => s.trim().length > 0),
          grade3Score: fc.float({ min: Math.fround(0.1), max: Math.fround(4.0) }),
          grade6Score: fc.float({ min: Math.fround(4.1), max: Math.fround(7.0) }),
          grade9Score: fc.float({ min: Math.fround(7.1), max: Math.fround(10.0) }),
          activeLevel: fc.constantFrom<ReadingLevel>("grade3", "grade6", "grade9"),
        }),
        ({
          id,
          title,
          source,
          publishedAt,
          grade3Text,
          grade6Text,
          grade9Text,
          grade3Score,
          grade6Score,
          grade9Score,
          activeLevel,
        }) => {
          const feedItem: FeedItem = {
            id,
            title,
            source,
            publishedAt,
            variants: [
              { level: "grade3", text: grade3Text, fkScore: grade3Score },
              { level: "grade6", text: grade6Text, fkScore: grade6Score },
              { level: "grade9", text: grade9Text, fkScore: grade9Score },
            ],
          };

          const { container, unmount } = render(
            <EventDetailPanel
              event={feedItem}
              activeLevel={activeLevel}
              dismissEvent={() => {}}
            />
          );

          // Assert: Title is displayed (use container to scope query)
          const titleElement = container.querySelector("h2");
          expect(titleElement?.textContent?.trim()).toBe(title.trim());

          // Assert: Source is displayed
          const sourceElement = container.querySelector(".text-xs.text-gray-500");
          expect(sourceElement?.textContent).toContain("Source:");
          expect(sourceElement?.textContent).toContain(source.trim());

          // Assert: Timestamp is displayed (formatted)
          const formattedTimestamp = formatTimestamp(publishedAt);
          expect(container.textContent).toContain(formattedTimestamp);

          // Assert: Correct variant text is displayed
          const expectedText =
            activeLevel === "grade3"
              ? grade3Text
              : activeLevel === "grade6"
              ? grade6Text
              : grade9Text;
          
          const contentDiv = container.querySelector(".text-gray-800.leading-relaxed");
          expect(contentDiv?.textContent?.trim()).toBe(expectedText.trim());

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});

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
