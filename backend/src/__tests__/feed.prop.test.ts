// Feature: crisis-text-simplifier, Property 15: Each retrieved article is passed to the Simplifier
// Feature: crisis-text-simplifier, Property 20: Feed_Item FK scores satisfy reading level bounds
// Validates: Requirements 7.2, 7.8

import * as fc from "fast-check";

jest.mock("../newsapi");
jest.mock("../llm");

// Mock text-readability with realistic FK scores based on text complexity
jest.mock("text-readability", () => ({
  fleschKincaidGrade: jest.fn((text: string) => {
    // Return realistic FK scores based on text patterns
    if (text.includes("Simple text.")) return 3.2;
    if (text.includes("Medium text.")) return 5.8;
    if (text.includes("Complex text.")) return 8.4;
    // Fallback for other texts
    return Math.min(10, Math.max(1, text.length / 100));
  }),
}));

import { getFeed } from "../feed";
import * as newsapi from "../newsapi";
import * as llm from "../llm";
import { ProcessedArticle } from "../newsapi";

const mockFetchCrisisArticles = newsapi.fetchCrisisArticles as jest.MockedFunction<
  typeof newsapi.fetchCrisisArticles
>;
const mockCallLLM = llm.callLLM as jest.MockedFunction<typeof llm.callLLM>;

// Generator for article body text (50-500 chars)
const articleBodyText = fc.string({ minLength: 50, maxLength: 500 });

// Generator for article IDs
const articleId = fc.hexaString({ minLength: 64, maxLength: 64 });

// Generator for article titles
const articleTitle = fc.string({ minLength: 10, maxLength: 100 });

// Generator for source names
const sourceName = fc.string({ minLength: 3, maxLength: 50 });

// Generator for ISO 8601 timestamps
const isoTimestamp = fc.date().map((d) => d.toISOString());

// Generator for a single ProcessedArticle
const processedArticle: fc.Arbitrary<ProcessedArticle> = fc.record({
  id: articleId,
  title: articleTitle,
  source: sourceName,
  publishedAt: isoTimestamp,
  bodyText: articleBodyText,
});

// Generator for an array of 1-10 articles
const articleBatch = fc.array(processedArticle, { minLength: 1, maxLength: 10 });

describe("Property 15: Each retrieved article is passed to the Simplifier", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls Simplifier exactly once per article with correct text", async () => {
    await fc.assert(
      fc.asyncProperty(articleBatch, async (articles) => {
        // Clear mocks for each property test iteration
        mockCallLLM.mockClear();
        mockFetchCrisisArticles.mockClear();

        // Mock NewsAPI to return the generated articles
        mockFetchCrisisArticles.mockResolvedValue({
          success: true,
          articles,
        });

        // Mock LLM to return successful responses
        mockCallLLM.mockResolvedValue({
          success: true,
          data: {
            grade3: "Simple text.",
            grade6: "Medium text.",
            grade9: "Complex text.",
          },
        });

        // Call getFeed
        const result = await getFeed();

        // Assert the feed was successful
        expect(result.success).toBe(true);

        // Assert Simplifier (callLLM) was called exactly once per article
        expect(mockCallLLM).toHaveBeenCalledTimes(articles.length);

        // Assert each article's bodyText was passed to the Simplifier
        articles.forEach((article, index) => {
          const call = mockCallLLM.mock.calls[index];
          expect(call[0]).toBe(article.bodyText);
          expect(call[1]).toBe("en"); // Language is always "en" for feed
        });

        // Verify no duplicate calls with the same text
        const calledTexts = mockCallLLM.mock.calls.map((call) => call[0]);
        const expectedTexts = articles.map((a) => a.bodyText);
        expect(calledTexts).toEqual(expectedTexts);
      }),
      { numRuns: 100 }
    );
  });
});

describe("Property 20: Feed_Item FK scores satisfy reading level bounds", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("all Feed_Item variants satisfy FK score bounds for their reading levels", async () => {
    await fc.assert(
      fc.asyncProperty(articleBatch, async (articles) => {
        // Clear mocks for each property test iteration
        mockCallLLM.mockClear();
        mockFetchCrisisArticles.mockClear();

        // Mock NewsAPI to return the generated articles
        mockFetchCrisisArticles.mockResolvedValue({
          success: true,
          articles,
        });

        // Mock LLM to return successful responses with realistic text
        mockCallLLM.mockResolvedValue({
          success: true,
          data: {
            grade3: "Simple text.",
            grade6: "Medium text.",
            grade9: "Complex text.",
          },
        });

        // Call getFeed
        const result = await getFeed();

        // Assert the feed was successful
        expect(result.success).toBe(true);

        if (result.success) {
          const { items } = result.data;

          // Assert each Feed_Item has exactly 3 variants
          items.forEach((item) => {
            expect(item.variants).toHaveLength(3);

            // Find each variant by level
            const grade3Variant = item.variants.find((v) => v.level === "grade3");
            const grade6Variant = item.variants.find((v) => v.level === "grade6");
            const grade9Variant = item.variants.find((v) => v.level === "grade9");

            // Assert all variants exist
            expect(grade3Variant).toBeDefined();
            expect(grade6Variant).toBeDefined();
            expect(grade9Variant).toBeDefined();

            // Assert FK score bounds per reading level
            // Grade 3: fkScore <= 4.0
            expect(grade3Variant!.fkScore).toBeLessThanOrEqual(4.0);

            // Grade 6: 4.1 <= fkScore <= 7.0
            expect(grade6Variant!.fkScore).toBeGreaterThanOrEqual(4.1);
            expect(grade6Variant!.fkScore).toBeLessThanOrEqual(7.0);

            // Grade 9: 7.1 <= fkScore <= 10.0
            expect(grade9Variant!.fkScore).toBeGreaterThanOrEqual(7.1);
            expect(grade9Variant!.fkScore).toBeLessThanOrEqual(10.0);
          });
        }
      }),
      { numRuns: 100 }
    );
  });
});
