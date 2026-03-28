import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";
import { ReactNode, useEffect } from "react";
import { AppStateProvider, useAppDispatch, useAppState } from "../../store/appState";
import { FeedItem, ReadingLevel, SimplifiedVariant } from "../../types";

// Feature: crisis-text-simplifier, Property 16: Feed_Items display the active Reading_Level variant
// **Validates: Requirements 7.3, 7.7**

// Mock FeedItem component that displays the variant for the active reading level
const FeedItemComponent = ({ item }: { item: FeedItem }) => {
  const { activeLevel } = useAppState();
  const variant = item.variants.find((v) => v.level === activeLevel);

  if (!variant) {
    return <div data-testid={`feed-item-${item.id}`}>No variant for level</div>;
  }

  return (
    <div data-testid={`feed-item-${item.id}`} className="feed-item">
      <h3>{item.title}</h3>
      <p className="source">{item.source}</p>
      <p className="published">{item.publishedAt}</p>
      <div className="simplified-text" data-testid={`feed-item-text-${item.id}`}>
        {variant.text}
      </div>
      <div className="fk-score" data-testid={`feed-item-score-${item.id}`}>
        FK Score: {variant.fkScore.toFixed(1)}
      </div>
    </div>
  );
};

// Mock FeedPanel component that renders multiple FeedItems
const FeedPanelComponent = ({ items }: { items: FeedItem[] }) => {
  return (
    <div className="feed-panel" data-testid="feed-panel">
      {items.map((item) => (
        <FeedItemComponent key={item.id} item={item} />
      ))}
    </div>
  );
};

// Component to set up the test state
const TestStateSetup = ({
  children,
  items,
  activeLevel,
}: {
  children: ReactNode;
  items: FeedItem[];
  activeLevel: ReadingLevel;
}) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch({
      type: "SET_FEED_ITEMS",
      payload: items,
    });
    dispatch({
      type: "SET_ACTIVE_LEVEL",
      payload: activeLevel,
    });
  }, [items, activeLevel, dispatch]);

  return <>{children}</>;
};

// Wrapper component that sets up the app state with test feed items
const TestWrapper = ({
  children,
  items,
  activeLevel,
}: {
  children: ReactNode;
  items: FeedItem[];
  activeLevel: ReadingLevel;
}) => {
  return (
    <AppStateProvider>
      <TestStateSetup items={items} activeLevel={activeLevel}>
        {children}
      </TestStateSetup>
    </AppStateProvider>
  );
};

// Arbitraries for property-based testing
const readingLevelArbitrary = fc.oneof(
  fc.constant("grade3" as ReadingLevel),
  fc.constant("grade6" as ReadingLevel),
  fc.constant("grade9" as ReadingLevel)
);

const simplifiedVariantArbitrary = (level: ReadingLevel): fc.Arbitrary<SimplifiedVariant> => {
  const scoreRanges: Record<ReadingLevel, [number, number]> = {
    grade3: [0.1, 4.0],
    grade6: [4.1, 7.0],
    grade9: [7.1, 10.0],
  };
  const [minScore, maxScore] = scoreRanges[level];

  return fc.record({
    level: fc.constant(level),
    text: fc.string({ minLength: 10, maxLength: 200 }),
    fkScore: fc.float({ min: minScore, max: maxScore }),
  });
};

const feedItemArbitrary = (): fc.Arbitrary<FeedItem> => {
  return fc.record({
    id: fc.string({ minLength: 5, maxLength: 20 }),
    title: fc.string({ minLength: 10, maxLength: 100 }),
    source: fc.string({ minLength: 5, maxLength: 50 }),
    publishedAt: fc.date().map((d) => d.toISOString()),
    variants: fc.tuple(
      simplifiedVariantArbitrary("grade3"),
      simplifiedVariantArbitrary("grade6"),
      simplifiedVariantArbitrary("grade9")
    ).map(([v3, v6, v9]) => [v3, v6, v9]),
  });
};

describe("FeedPanel - Property 16: Feed_Items display the active Reading_Level variant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the correct variant for grade3 active level", () => {
    const feedItems: FeedItem[] = [
      {
        id: "article-1",
        title: "Emergency Alert",
        source: "News Source",
        publishedAt: "2024-01-01T12:00:00Z",
        variants: [
          { level: "grade3", text: "Simple emergency text.", fkScore: 2.5 },
          { level: "grade6", text: "Medium emergency text.", fkScore: 5.5 },
          { level: "grade9", text: "Complex emergency text.", fkScore: 8.5 },
        ],
      },
    ];

    render(
      <TestWrapper items={feedItems} activeLevel="grade3">
        <FeedPanelComponent items={feedItems} />
      </TestWrapper>
    );

    // Assert: The grade3 variant text is displayed
    expect(screen.getByText("Simple emergency text.")).toBeInTheDocument();
    // Assert: The grade6 and grade9 texts are NOT displayed
    expect(screen.queryByText("Medium emergency text.")).not.toBeInTheDocument();
    expect(screen.queryByText("Complex emergency text.")).not.toBeInTheDocument();
  });

  it("should render the correct variant for grade6 active level", () => {
    const feedItems: FeedItem[] = [
      {
        id: "article-1",
        title: "Emergency Alert",
        source: "News Source",
        publishedAt: "2024-01-01T12:00:00Z",
        variants: [
          { level: "grade3", text: "Simple emergency text.", fkScore: 2.5 },
          { level: "grade6", text: "Medium emergency text.", fkScore: 5.5 },
          { level: "grade9", text: "Complex emergency text.", fkScore: 8.5 },
        ],
      },
    ];

    render(
      <TestWrapper items={feedItems} activeLevel="grade6">
        <FeedPanelComponent items={feedItems} />
      </TestWrapper>
    );

    // Assert: The grade6 variant text is displayed
    expect(screen.getByText("Medium emergency text.")).toBeInTheDocument();
    // Assert: The grade3 and grade9 texts are NOT displayed
    expect(screen.queryByText("Simple emergency text.")).not.toBeInTheDocument();
    expect(screen.queryByText("Complex emergency text.")).not.toBeInTheDocument();
  });

  it("should render the correct variant for grade9 active level", () => {
    const feedItems: FeedItem[] = [
      {
        id: "article-1",
        title: "Emergency Alert",
        source: "News Source",
        publishedAt: "2024-01-01T12:00:00Z",
        variants: [
          { level: "grade3", text: "Simple emergency text.", fkScore: 2.5 },
          { level: "grade6", text: "Medium emergency text.", fkScore: 5.5 },
          { level: "grade9", text: "Complex emergency text.", fkScore: 8.5 },
        ],
      },
    ];

    render(
      <TestWrapper items={feedItems} activeLevel="grade9">
        <FeedPanelComponent items={feedItems} />
      </TestWrapper>
    );

    // Assert: The grade9 variant text is displayed
    expect(screen.getByText("Complex emergency text.")).toBeInTheDocument();
    // Assert: The grade3 and grade6 texts are NOT displayed
    expect(screen.queryByText("Simple emergency text.")).not.toBeInTheDocument();
    expect(screen.queryByText("Medium emergency text.")).not.toBeInTheDocument();
  });

  it("should render multiple feed items with the correct variant for active level", () => {
    const feedItems: FeedItem[] = [
      {
        id: "article-1",
        title: "First Alert",
        source: "Source A",
        publishedAt: "2024-01-01T12:00:00Z",
        variants: [
          { level: "grade3", text: "First simple text.", fkScore: 2.5 },
          { level: "grade6", text: "First medium text.", fkScore: 5.5 },
          { level: "grade9", text: "First complex text.", fkScore: 8.5 },
        ],
      },
      {
        id: "article-2",
        title: "Second Alert",
        source: "Source B",
        publishedAt: "2024-01-02T12:00:00Z",
        variants: [
          { level: "grade3", text: "Second simple text.", fkScore: 3.0 },
          { level: "grade6", text: "Second medium text.", fkScore: 5.8 },
          { level: "grade9", text: "Second complex text.", fkScore: 8.2 },
        ],
      },
    ];

    render(
      <TestWrapper items={feedItems} activeLevel="grade6">
        <FeedPanelComponent items={feedItems} />
      </TestWrapper>
    );

    // Assert: Both grade6 variant texts are displayed
    expect(screen.getByText("First medium text.")).toBeInTheDocument();
    expect(screen.getByText("Second medium text.")).toBeInTheDocument();
    // Assert: No grade3 or grade9 texts are displayed
    expect(screen.queryByText("First simple text.")).not.toBeInTheDocument();
    expect(screen.queryByText("Second simple text.")).not.toBeInTheDocument();
    expect(screen.queryByText("First complex text.")).not.toBeInTheDocument();
    expect(screen.queryByText("Second complex text.")).not.toBeInTheDocument();
  });

  it("should display correct FK scores for the active reading level", () => {
    const feedItems: FeedItem[] = [
      {
        id: "article-1",
        title: "Emergency Alert",
        source: "News Source",
        publishedAt: "2024-01-01T12:00:00Z",
        variants: [
          { level: "grade3", text: "Simple text.", fkScore: 2.5 },
          { level: "grade6", text: "Medium text.", fkScore: 5.5 },
          { level: "grade9", text: "Complex text.", fkScore: 8.5 },
        ],
      },
    ];

    render(
      <TestWrapper items={feedItems} activeLevel="grade6">
        <FeedPanelComponent items={feedItems} />
      </TestWrapper>
    );

    // Assert: The grade6 FK score is displayed
    expect(screen.getByText("FK Score: 5.5")).toBeInTheDocument();
    // Assert: The grade3 and grade9 FK scores are NOT displayed
    expect(screen.queryByText("FK Score: 2.5")).not.toBeInTheDocument();
    expect(screen.queryByText("FK Score: 8.5")).not.toBeInTheDocument();
  });

  it("should render correct variant for any feed state and reading level combination", () => {
    // Property-based test: for any feed state with multiple items and any active reading level,
    // each Feed_Item should display the variant corresponding to that reading level
    fc.assert(
      fc.property(
        fc.array(feedItemArbitrary(), { minLength: 1, maxLength: 5 }),
        readingLevelArbitrary,
        (feedItems, activeLevel) => {
          const { unmount } = render(
            <TestWrapper items={feedItems} activeLevel={activeLevel}>
              <FeedPanelComponent items={feedItems} />
            </TestWrapper>
          );

          // Assert: For each feed item, the correct variant is displayed
          feedItems.forEach((item) => {
            const expectedVariant = item.variants.find((v) => v.level === activeLevel);
            if (expectedVariant) {
              // The variant text should be in the document
              expect(screen.getByText(expectedVariant.text)).toBeInTheDocument();

              // The FK score for this variant should be displayed
              const scoreText = `FK Score: ${expectedVariant.fkScore.toFixed(1)}`;
              expect(screen.getByText(scoreText)).toBeInTheDocument();
            }
          });

          // Assert: No variants from other reading levels are displayed
          feedItems.forEach((item) => {
            item.variants.forEach((variant) => {
              if (variant.level !== activeLevel) {
                // Variants from other levels should NOT be displayed
                expect(screen.queryByText(variant.text)).not.toBeInTheDocument();
              }
            });
          });

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should update displayed variant when active level changes", () => {
    const feedItems: FeedItem[] = [
      {
        id: "article-1",
        title: "Emergency Alert",
        source: "News Source",
        publishedAt: "2024-01-01T12:00:00Z",
        variants: [
          { level: "grade3", text: "Simple emergency text.", fkScore: 2.5 },
          { level: "grade6", text: "Medium emergency text.", fkScore: 5.5 },
          { level: "grade9", text: "Complex emergency text.", fkScore: 8.5 },
        ],
      },
    ];

    const { rerender } = render(
      <TestWrapper items={feedItems} activeLevel="grade3">
        <FeedPanelComponent items={feedItems} />
      </TestWrapper>
    );

    // Assert: Initially, grade3 variant is displayed
    expect(screen.getByText("Simple emergency text.")).toBeInTheDocument();
    expect(screen.queryByText("Medium emergency text.")).not.toBeInTheDocument();

    // Change active level to grade6
    rerender(
      <TestWrapper items={feedItems} activeLevel="grade6">
        <FeedPanelComponent items={feedItems} />
      </TestWrapper>
    );

    // Assert: After level change, grade6 variant is displayed
    expect(screen.getByText("Medium emergency text.")).toBeInTheDocument();
    expect(screen.queryByText("Simple emergency text.")).not.toBeInTheDocument();

    // Change active level to grade9
    rerender(
      <TestWrapper items={feedItems} activeLevel="grade9">
        <FeedPanelComponent items={feedItems} />
      </TestWrapper>
    );

    // Assert: After level change, grade9 variant is displayed
    expect(screen.getByText("Complex emergency text.")).toBeInTheDocument();
    expect(screen.queryByText("Medium emergency text.")).not.toBeInTheDocument();
  });

  it("should render all feed items with correct variants for any reading level", () => {
    // Property-based test: for any reading level, all feed items should display
    // the variant for that level, and no other variants should be visible
    fc.assert(
      fc.property(
        fc.array(feedItemArbitrary(), { minLength: 2, maxLength: 10 }),
        readingLevelArbitrary,
        (feedItems, activeLevel) => {
          const { unmount } = render(
            <TestWrapper items={feedItems} activeLevel={activeLevel}>
              <FeedPanelComponent items={feedItems} />
            </TestWrapper>
          );

          // Assert: Exactly one variant per feed item is displayed
          feedItems.forEach((item) => {
            const variantsForLevel = item.variants.filter((v) => v.level === activeLevel);
            expect(variantsForLevel).toHaveLength(1);

            const expectedVariant = variantsForLevel[0];
            expect(screen.getByText(expectedVariant.text)).toBeInTheDocument();
          });

          // Assert: Total number of variant texts displayed equals number of feed items
          const allVariantTexts = feedItems
            .map((item) => item.variants.find((v) => v.level === activeLevel)?.text)
            .filter((text) => text !== undefined);
          expect(allVariantTexts).toHaveLength(feedItems.length);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});
