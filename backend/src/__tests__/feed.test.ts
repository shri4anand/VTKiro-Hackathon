jest.mock("../newsapi");
jest.mock("../llm");
jest.mock("text-readability", () => ({
  fleschKincaidGrade: jest.fn((text: string) => {
    return Math.min(10, Math.max(1, text.length / 100));
  }),
}));

import { getFeed } from "../feed";
import * as newsapi from "../newsapi";
import * as llm from "../llm";

const mockFetchCrisisArticles = newsapi.fetchCrisisArticles as jest.MockedFunction<
  typeof newsapi.fetchCrisisArticles
>;
const mockCallLLM = llm.callLLM as jest.MockedFunction<typeof llm.callLLM>;

describe("getFeed", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return feed items when articles are successfully fetched and simplified", async () => {
    // Mock NewsAPI response
    mockFetchCrisisArticles.mockResolvedValue({
      success: true,
      articles: [
        {
          id: "article1",
          title: "Emergency Alert",
          source: "Test Source",
          publishedAt: "2024-01-01T00:00:00Z",
          bodyText: "This is an emergency alert with important safety information.",
        },
        {
          id: "article2",
          title: "Crisis Update",
          source: "News Agency",
          publishedAt: "2024-01-01T01:00:00Z",
          bodyText: "Crisis situation requires immediate action from residents.",
        },
      ],
    });

    // Mock LLM responses
    mockCallLLM
      .mockResolvedValueOnce({
        success: true,
        data: {
          grade3: "Emergency. Be safe.",
          grade6: "There is an emergency. Stay safe.",
          grade9: "An emergency alert has been issued. Please stay safe.",
        },
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          grade3: "Crisis. Act now.",
          grade6: "There is a crisis. Take action now.",
          grade9: "A crisis situation requires immediate action.",
        },
      });

    const result = await getFeed();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items).toHaveLength(2);
      expect(result.data.items[0].id).toBe("article1");
      expect(result.data.items[0].title).toBe("Emergency Alert");
      expect(result.data.items[0].variants).toHaveLength(3);
      expect(result.data.items[0].variants[0].level).toBe("grade3");
      expect(result.data.items[1].id).toBe("article2");
      expect(result.data.fetchedAt).toBeDefined();
    }

    expect(mockCallLLM).toHaveBeenCalledTimes(2);
  });

  it("should return NEWS_SOURCE_UNAVAILABLE when NewsAPI fails", async () => {
    mockFetchCrisisArticles.mockResolvedValue({
      success: false,
      error: "NewsAPI returned non-ok status",
      code: "NEWS_SOURCE_UNAVAILABLE",
    });

    const result = await getFeed();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("NEWS_SOURCE_UNAVAILABLE");
      expect(result.error.error).toBe("NewsAPI returned non-ok status");
    }

    expect(mockCallLLM).not.toHaveBeenCalled();
  });

  it("should return TIMEOUT when NewsAPI times out", async () => {
    mockFetchCrisisArticles.mockResolvedValue({
      success: false,
      error: "NewsAPI request timed out",
      code: "TIMEOUT",
    });

    const result = await getFeed();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("TIMEOUT");
    }
  });

  it("should return NEWS_SOURCE_UNAVAILABLE when LLM is unavailable", async () => {
    mockFetchCrisisArticles.mockResolvedValue({
      success: true,
      articles: [
        {
          id: "article1",
          title: "Test",
          source: "Test",
          publishedAt: "2024-01-01T00:00:00Z",
          bodyText: "Test body text for the article.",
        },
      ],
    });

    mockCallLLM.mockResolvedValue({
      success: false,
      code: "LLM_UNAVAILABLE",
      error: "LLM service is down",
    });

    const result = await getFeed();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("NEWS_SOURCE_UNAVAILABLE");
      expect(result.error.error).toBe("LLM service is down");
    }
  });

  it("should return TIMEOUT when LLM times out", async () => {
    mockFetchCrisisArticles.mockResolvedValue({
      success: true,
      articles: [
        {
          id: "article1",
          title: "Test",
          source: "Test",
          publishedAt: "2024-01-01T00:00:00Z",
          bodyText: "Test body text for the article.",
        },
      ],
    });

    mockCallLLM.mockResolvedValue({
      success: false,
      code: "TIMEOUT",
      error: "Request timed out",
    });

    const result = await getFeed();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("TIMEOUT");
    }
  });

  it("should return MALFORMED_RESPONSE when LLM returns malformed data", async () => {
    mockFetchCrisisArticles.mockResolvedValue({
      success: true,
      articles: [
        {
          id: "article1",
          title: "Test",
          source: "Test",
          publishedAt: "2024-01-01T00:00:00Z",
          bodyText: "Test body text for the article.",
        },
      ],
    });

    mockCallLLM.mockResolvedValue({
      success: false,
      code: "MALFORMED_RESPONSE",
      error: "LLM response was not valid JSON",
    });

    const result = await getFeed();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("MALFORMED_RESPONSE");
    }
  });

  it("should call LLM with article body text", async () => {
    const bodyText = "This is the article body text that should be simplified.";

    mockFetchCrisisArticles.mockResolvedValue({
      success: true,
      articles: [
        {
          id: "article1",
          title: "Test",
          source: "Test",
          publishedAt: "2024-01-01T00:00:00Z",
          bodyText,
        },
      ],
    });

    mockCallLLM.mockResolvedValue({
      success: true,
      data: {
        grade3: "Simple text.",
        grade6: "Simplified text.",
        grade9: "Text simplified for grade 9.",
      },
    });

    await getFeed();

    expect(mockCallLLM).toHaveBeenCalledWith(bodyText, "en");
  });
});
