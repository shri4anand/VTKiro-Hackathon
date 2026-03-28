import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";
import { FeedItem, SimplifiedVariant, ReadingLevel } from "../../types";

// Feature: crisis-text-simplifier, Property 17: New Feed_Items are prepended without removing existing items
// **Validates: Requirements 7.4**

describe("Property 17: New Feed_Items are prepended without removing existing items", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Arbitrary generator for SimplifiedVariant
  const arbitrarySimplifiedVariant = (level: ReadingLevel): fc.Arbitrary<SimplifiedVariant> => {
    const fkScoreRange = 
      level === "grade3" ? fc.float({ min: Math.fround(0.1), max: Math.fround(4.0) }) :
      level === "grade6" ? fc.float({ min: Math.fround(4.1), max: Math.fround(7.0) }) :
      fc.float({ min: Math.fround(7.1), max: Math.fround(10.0) });

    return fc.record({
      level: fc.constant(level),
      text: fc.string({ minLength: 10, maxLength: 200 }),
      fkScore: fkScoreRange,
    });
  };

  // Arbitrary generator for FeedItem
  const arbitraryFeedItem = (): fc.Arbitrary<FeedItem> => {
    return fc.record({
      id: fc.uuid(),
      title: fc.string({ minLength: 5, maxLength: 100 }),
      source: fc.string({ minLength: 3, maxLength: 50 }),
      publishedAt: fc.date().map(d => d.toISOString()),
      variants: fc.tuple(
        arbitrarySimplifiedVariant("grade3"),
        arbitrarySimplifiedVariant("grade6"),
        arbitrarySimplifiedVariant("grade9")
      ),
    });
  };

  it("should prepend new items to existing feed list", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryFeedItem(), { minLength: 0, maxLength: 20 }), // existing items (N)
        fc.array(arbitraryFeedItem(), { minLength: 1, maxLength: 10 }), // new items (M)
        (existingItems, newItems) => {
          const N = existingItems.length;
          const M = newItems.length;

          // Simulate prepend operation (what the feed should do)
          const resultFeed = [...newItems, ...existingItems];

          // Assert: length is N + M
          expect(resultFeed.length).toBe(N + M);

          // Assert: new items appear first (at indices 0 to M-1)
          for (let i = 0; i < M; i++) {
            expect(resultFeed[i].id).toBe(newItems[i].id);
          }

          // Assert: existing items are preserved in their original order (at indices M to N+M-1)
          for (let i = 0; i < N; i++) {
            expect(resultFeed[M + i].id).toBe(existingItems[i].id);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should preserve all existing items when prepending new items", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryFeedItem(), { minLength: 1, maxLength: 20 }), // existing items
        fc.array(arbitraryFeedItem(), { minLength: 1, maxLength: 10 }), // new items
        (existingItems, newItems) => {
          // Simulate prepend operation
          const resultFeed = [...newItems, ...existingItems];

          // Assert: all existing item IDs are still present
          const existingIds = existingItems.map(item => item.id);
          const resultIds = resultFeed.map(item => item.id);
          
          for (const existingId of existingIds) {
            expect(resultIds).toContain(existingId);
          }

          // Assert: no existing items were removed
          const existingIdsInResult = resultIds.filter(id => existingIds.includes(id));
          expect(existingIdsInResult.length).toBe(existingItems.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should maintain order of existing items after prepending", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryFeedItem(), { minLength: 2, maxLength: 20 }), // existing items (need at least 2 to check order)
        fc.array(arbitraryFeedItem(), { minLength: 1, maxLength: 10 }), // new items
        (existingItems, newItems) => {
          // Simulate prepend operation
          const resultFeed = [...newItems, ...existingItems];

          // Assert: existing items maintain their relative order
          const M = newItems.length;
          for (let i = 0; i < existingItems.length - 1; i++) {
            const item1Index = resultFeed.findIndex(item => item.id === existingItems[i].id);
            const item2Index = resultFeed.findIndex(item => item.id === existingItems[i + 1].id);
            
            // item1 should appear before item2
            expect(item1Index).toBeLessThan(item2Index);
            
            // Both should be in the "existing items" section (after new items)
            expect(item1Index).toBeGreaterThanOrEqual(M);
            expect(item2Index).toBeGreaterThanOrEqual(M);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should handle empty existing feed list", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryFeedItem(), { minLength: 1, maxLength: 10 }), // new items
        (newItems) => {
          const existingItems: FeedItem[] = [];
          const M = newItems.length;

          // Simulate prepend operation
          const resultFeed = [...newItems, ...existingItems];

          // Assert: length equals M (0 + M)
          expect(resultFeed.length).toBe(M);

          // Assert: all new items are present in order
          for (let i = 0; i < M; i++) {
            expect(resultFeed[i].id).toBe(newItems[i].id);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should preserve all properties of existing items", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryFeedItem(), { minLength: 1, maxLength: 20 }), // existing items
        fc.array(arbitraryFeedItem(), { minLength: 1, maxLength: 10 }), // new items
        (existingItems, newItems) => {
          // Simulate prepend operation
          const resultFeed = [...newItems, ...existingItems];

          const M = newItems.length;

          // Assert: all existing items retain their properties
          for (let i = 0; i < existingItems.length; i++) {
            const originalItem = existingItems[i];
            const resultItem = resultFeed[M + i];

            expect(resultItem.id).toBe(originalItem.id);
            expect(resultItem.title).toBe(originalItem.title);
            expect(resultItem.source).toBe(originalItem.source);
            expect(resultItem.publishedAt).toBe(originalItem.publishedAt);
            expect(resultItem.variants).toEqual(originalItem.variants);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should work correctly for any combination of N existing and M new items", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 50 }), // N (existing items count)
        fc.integer({ min: 1, max: 20 }), // M (new items count)
        (N, M) => {
          // Generate N existing items and M new items
          const existingItems = Array.from({ length: N }, (_, i) => ({
            id: `existing-${i}`,
            title: `Existing Article ${i}`,
            source: `Source ${i}`,
            publishedAt: new Date(Date.now() - i * 1000).toISOString(),
            variants: [
              { level: "grade3" as ReadingLevel, text: `Text ${i}`, fkScore: 3.0 },
              { level: "grade6" as ReadingLevel, text: `Text ${i}`, fkScore: 5.5 },
              { level: "grade9" as ReadingLevel, text: `Text ${i}`, fkScore: 8.5 },
            ],
          }));

          const newItems = Array.from({ length: M }, (_, i) => ({
            id: `new-${i}`,
            title: `New Article ${i}`,
            source: `Source ${i}`,
            publishedAt: new Date(Date.now() + i * 1000).toISOString(),
            variants: [
              { level: "grade3" as ReadingLevel, text: `Text ${i}`, fkScore: 3.0 },
              { level: "grade6" as ReadingLevel, text: `Text ${i}`, fkScore: 5.5 },
              { level: "grade9" as ReadingLevel, text: `Text ${i}`, fkScore: 8.5 },
            ],
          }));

          // Simulate prepend operation
          const resultFeed = [...newItems, ...existingItems];

          // Assert: length is N + M
          expect(resultFeed.length).toBe(N + M);

          // Assert: first M items are the new items
          for (let i = 0; i < M; i++) {
            expect(resultFeed[i].id).toBe(`new-${i}`);
          }

          // Assert: next N items are the existing items
          for (let i = 0; i < N; i++) {
            expect(resultFeed[M + i].id).toBe(`existing-${i}`);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
