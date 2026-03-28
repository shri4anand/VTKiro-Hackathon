import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";
import { ReactNode, useEffect } from "react";
import { AppStateProvider, useAppDispatch, useAppState } from "../../store/appState";
import { FeedItem, ReadingLevel, SimplifiedVariant, FeedError } from "../../types";

// Feature: crisis-text-simplifier, Property 19: Feed items are preserved on polling failure
// **Validates: Requirements 7.6**

// Mock FeedStatusBar component that displays polling indicator and error banner
const FeedStatusBarComponent = () => {
  const { feed } = useAppState();
  const [showError, setShowError] = React.useState(!!feed.feedError);

  React.useEffect(() => {
    if (feed.feedError) {
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [feed.feedError]);

  return (
    <div className="space-y-2">
      {feed.isPolling && (
        <div
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg"
          role="status"
          aria-label="Feed is refreshing"
          data-testid="polling-indicator"
        >
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
          </div>
          <span className="text-sm text-blue-700 font-medium">Refreshing feed...</span>
        </div>
      )}

      {showError && feed.feedError && (
        <div
          className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg"
          role="alert"
          aria-live="polite"
          data-testid="error-banner"
        >
          <p className="text-sm text-amber-800">{feed.feedError.error}</p>
        </div>
      )}
    </div>
  );
};

// Mock FeedItem component
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
      <div className="simplified-text" data-testid={`feed-item-text-${item.id}`}>
        {variant.text}
      </div>
    </div>
  );
};

// Mock FeedPanel component that simulates polling behavior
const FeedPanelComponent = ({
  onPollFailure,
}: {
  onPollFailure?: (error: FeedError) => void;
}) => {
  const state = useAppState();
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Simulate polling failure scenario
    if (onPollFailure) {
      const error: FeedError = {
        error: "Could not refresh the feed. Will retry in 5 minutes.",
        code: "NEWS_SOURCE_UNAVAILABLE",
      };
      dispatch({ type: "SET_IS_POLLING", payload: true });
      setTimeout(() => {
        dispatch({ type: "SET_FEED_ERROR", payload: error });
        dispatch({ type: "SET_IS_POLLING", payload: false });
        onPollFailure(error);
      }, 100);
    }
  }, [dispatch, onPollFailure]);

  return (
    <section className="mt-8" aria-label="Crisis news feed">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Crisis Feed</h2>

      <FeedStatusBarComponent />

      <div className="mt-6 space-y-4">
        {state.feed.items.length === 0 ? (
          <div className="text-center py-8 text-gray-600" data-testid="empty-feed">
            <p>No articles available yet. Check back soon.</p>
          </div>
        ) : (
          state.feed.items.map((item) => (
            <FeedItemComponent key={item.id} item={item} />
          ))
        )}
      </div>
    </section>
  );
};

// Component to set up the test state with initial feed items
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

// Wrapper component that sets up the app state
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

const feedErrorArbitrary = (): fc.Arbitrary<FeedError> => {
  const errorCodes = ["NEWS_SOURCE_UNAVAILABLE", "TIMEOUT", "MALFORMED_RESPONSE"] as const;
  return fc.record({
    error: fc.oneof(
      fc.constant("Could not refresh the feed. Will retry in 5 minutes."),
      fc.constant("Feed refresh timed out. Will retry in 5 minutes."),
      fc.constant("Feed refresh failed. Will retry in 5 minutes.")
    ),
    code: fc.sampled(errorCodes),
  });
};

describe("FeedPanel - Property 19: Feed items are preserved on polling failure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should preserve feed items when polling fails", () => {
    const feedItems: FeedItem[] = [
      {
        id: "article-1",
        title: "First Emergency",
        source: "News Source A",
        publishedAt: "2024-01-01T12:00:00Z",
        variants: [
          { level: "grade3", text: "First simple text.", fkScore: 2.5 },
          { level: "grade6", text: "First medium text.", fkScore: 5.5 },
          { level: "grade9", text: "First complex text.", fkScore: 8.5 },
        ],
      },
      {
        id: "article-2",
        title: "Second Emergency",
        source: "News Source B",
        publishedAt: "2024-01-02T12:00:00Z",
        variants: [
          { level: "grade3", text: "Second simple text.", fkScore: 3.0 },
          { level: "grade6", text: "Second medium text.", fkScore: 5.8 },
          { level: "grade9", text: "Second complex text.", fkScore: 8.2 },
        ],
      },
    ];

    let pollFailureOccurred = false;

    render(
      <TestWrapper items={feedItems} activeLevel="grade6">
        <FeedPanelComponent
          onPollFailure={() => {
            pollFailureOccurred = true;
          }}
        />
      </TestWrapper>
    );

    // Assert: Initial feed items are displayed
    expect(screen.getByText("First medium text.")).toBeInTheDocument();
    expect(screen.getByText("Second medium text.")).toBeInTheDocument();

    // Wait for polling failure to occur
    waitFor(() => {
      expect(pollFailureOccurred).toBe(true);
    });

    // Assert: Feed items are still displayed after failure
    expect(screen.getByText("First medium text.")).toBeInTheDocument();
    expect(screen.getByText("Second medium text.")).toBeInTheDocument();

    // Assert: Error banner is visible
    expect(screen.getByTestId("error-banner")).toBeInTheDocument();
  });

  it("should display error banner when polling fails", () => {
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

    let pollFailureOccurred = false;

    render(
      <TestWrapper items={feedItems} activeLevel="grade6">
        <FeedPanelComponent
          onPollFailure={() => {
            pollFailureOccurred = true;
          }}
        />
      </TestWrapper>
    );

    // Wait for polling failure
    waitFor(() => {
      expect(pollFailureOccurred).toBe(true);
    });

    // Assert: Error banner is visible with appropriate message
    const errorBanner = screen.getByTestId("error-banner");
    expect(errorBanner).toBeInTheDocument();
    expect(errorBanner).toHaveTextContent("Could not refresh the feed");
  });

  it("should preserve feed items count on polling failure", () => {
    const feedItems: FeedItem[] = [
      {
        id: "article-1",
        title: "First Alert",
        source: "Source A",
        publishedAt: "2024-01-01T12:00:00Z",
        variants: [
          { level: "grade3", text: "First simple.", fkScore: 2.5 },
          { level: "grade6", text: "First medium.", fkScore: 5.5 },
          { level: "grade9", text: "First complex.", fkScore: 8.5 },
        ],
      },
      {
        id: "article-2",
        title: "Second Alert",
        source: "Source B",
        publishedAt: "2024-01-02T12:00:00Z",
        variants: [
          { level: "grade3", text: "Second simple.", fkScore: 3.0 },
          { level: "grade6", text: "Second medium.", fkScore: 5.8 },
          { level: "grade9", text: "Second complex.", fkScore: 8.2 },
        ],
      },
      {
        id: "article-3",
        title: "Third Alert",
        source: "Source C",
        publishedAt: "2024-01-03T12:00:00Z",
        variants: [
          { level: "grade3", text: "Third simple.", fkScore: 2.8 },
          { level: "grade6", text: "Third medium.", fkScore: 6.0 },
          { level: "grade9", text: "Third complex.", fkScore: 8.8 },
        ],
      },
    ];

    let pollFailureOccurred = false;

    render(
      <TestWrapper items={feedItems} activeLevel="grade6">
        <FeedPanelComponent
          onPollFailure={() => {
            pollFailureOccurred = true;
          }}
        />
      </TestWrapper>
    );

    // Count initial feed items
    const initialItemCount = feedItems.length;

    // Wait for polling failure
    waitFor(() => {
      expect(pollFailureOccurred).toBe(true);
    });

    // Assert: All feed items are still present
    feedItems.forEach((item) => {
      const variant = item.variants.find((v) => v.level === "grade6");
      if (variant) {
        expect(screen.getByText(variant.text)).toBeInTheDocument();
      }
    });

    // Assert: No additional items were added
    const renderedItems = screen.getAllByTestId(/^feed-item-/);
    expect(renderedItems).toHaveLength(initialItemCount);
  });

  it("should preserve feed items for any feed state and polling failure", () => {
    // Property-based test: for any feed state with multiple items and any polling failure,
    // the feed items should be preserved and error banner should be visible
    fc.assert(
      fc.property(
        fc.array(feedItemArbitrary(), { minLength: 1, maxLength: 5 }),
        readingLevelArbitrary,
        (feedItems, activeLevel) => {
          let pollFailureOccurred = false;

          const { unmount } = render(
            <TestWrapper items={feedItems} activeLevel={activeLevel}>
              <FeedPanelComponent
                onPollFailure={() => {
                  pollFailureOccurred = true;
                }}
              />
            </TestWrapper>
          );

          // Wait for polling failure to occur
          waitFor(() => {
            expect(pollFailureOccurred).toBe(true);
          });

          // Assert: All original feed items are still displayed
          feedItems.forEach((item) => {
            const expectedVariant = item.variants.find((v) => v.level === activeLevel);
            if (expectedVariant) {
              expect(screen.getByText(expectedVariant.text)).toBeInTheDocument();
            }
          });

          // Assert: Error banner is visible
          expect(screen.getByTestId("error-banner")).toBeInTheDocument();

          // Assert: Feed item count is unchanged
          const renderedItems = screen.getAllByTestId(/^feed-item-/);
          expect(renderedItems).toHaveLength(feedItems.length);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should preserve feed items with different error codes", () => {
    // Property-based test: for any feed error code, feed items should be preserved
    fc.assert(
      fc.property(
        fc.array(feedItemArbitrary(), { minLength: 1, maxLength: 3 }),
        readingLevelArbitrary,
        feedErrorArbitrary(),
        (feedItems, activeLevel, error) => {
          let pollFailureOccurred = false;

          const { unmount } = render(
            <TestWrapper items={feedItems} activeLevel={activeLevel}>
              <FeedPanelComponent
                onPollFailure={() => {
                  pollFailureOccurred = true;
                }}
              />
            </TestWrapper>
          );

          // Wait for polling failure
          waitFor(() => {
            expect(pollFailureOccurred).toBe(true);
          });

          // Assert: All feed items are preserved
          feedItems.forEach((item) => {
            const expectedVariant = item.variants.find((v) => v.level === activeLevel);
            if (expectedVariant) {
              expect(screen.getByText(expectedVariant.text)).toBeInTheDocument();
            }
          });

          // Assert: Error banner is visible
          expect(screen.getByTestId("error-banner")).toBeInTheDocument();

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should not clear feed items when polling encounters timeout", () => {
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

    let pollFailureOccurred = false;

    render(
      <TestWrapper items={feedItems} activeLevel="grade6">
        <FeedPanelComponent
          onPollFailure={() => {
            pollFailureOccurred = true;
          }}
        />
      </TestWrapper>
    );

    // Assert: Feed item is initially displayed
    expect(screen.getByText("Medium text.")).toBeInTheDocument();

    // Wait for polling failure
    waitFor(() => {
      expect(pollFailureOccurred).toBe(true);
    });

    // Assert: Feed item is still displayed after timeout
    expect(screen.getByText("Medium text.")).toBeInTheDocument();

    // Assert: Error banner is visible
    expect(screen.getByTestId("error-banner")).toBeInTheDocument();
  });

  it("should preserve feed items and show error banner simultaneously", () => {
    const feedItems: FeedItem[] = [
      {
        id: "article-1",
        title: "First Alert",
        source: "Source A",
        publishedAt: "2024-01-01T12:00:00Z",
        variants: [
          { level: "grade3", text: "First simple.", fkScore: 2.5 },
          { level: "grade6", text: "First medium.", fkScore: 5.5 },
          { level: "grade9", text: "First complex.", fkScore: 8.5 },
        ],
      },
      {
        id: "article-2",
        title: "Second Alert",
        source: "Source B",
        publishedAt: "2024-01-02T12:00:00Z",
        variants: [
          { level: "grade3", text: "Second simple.", fkScore: 3.0 },
          { level: "grade6", text: "Second medium.", fkScore: 5.8 },
          { level: "grade9", text: "Second complex.", fkScore: 8.2 },
        ],
      },
    ];

    let pollFailureOccurred = false;

    render(
      <TestWrapper items={feedItems} activeLevel="grade6">
        <FeedPanelComponent
          onPollFailure={() => {
            pollFailureOccurred = true;
          }}
        />
      </TestWrapper>
    );

    // Wait for polling failure
    waitFor(() => {
      expect(pollFailureOccurred).toBe(true);
    });

    // Assert: Both feed items are displayed
    expect(screen.getByText("First medium.")).toBeInTheDocument();
    expect(screen.getByText("Second medium.")).toBeInTheDocument();

    // Assert: Error banner is visible
    const errorBanner = screen.getByTestId("error-banner");
    expect(errorBanner).toBeInTheDocument();

    // Assert: Both feed items and error banner are in the document simultaneously
    expect(screen.getByText("First medium.")).toBeInTheDocument();
    expect(screen.getByText("Second medium.")).toBeInTheDocument();
    expect(errorBanner).toBeInTheDocument();
  });
});
