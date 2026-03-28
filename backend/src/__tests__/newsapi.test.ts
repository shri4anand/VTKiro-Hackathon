import axios from "axios";
import { fetchCrisisArticles } from "../newsapi";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("NewsAPI Integration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should return error when NEWS_API_KEY is not configured", async () => {
    delete process.env.NEWS_API_KEY;

    const result = await fetchCrisisArticles();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("NEWS_SOURCE_UNAVAILABLE");
      expect(result.error).toContain("not configured");
    }
  });

  it("should fetch and process articles successfully", async () => {
    process.env.NEWS_API_KEY = "test-key";

    const mockResponse = {
      data: {
        status: "ok",
        totalResults: 2,
        articles: [
          {
            url: "https://example.com/article1",
            title: "Emergency Alert",
            source: { name: "News Source" },
            publishedAt: "2024-01-01T12:00:00Z",
            content: "This is a long enough article content that exceeds 50 characters for sure.",
            description: "Short desc",
          },
          {
            url: "https://example.com/article2",
            title: "Crisis Update",
            source: { name: "Another Source" },
            publishedAt: "2024-01-01T13:00:00Z",
            content: null,
            description: "This description is long enough to be used as body text content.",
          },
        ],
      },
    };

    mockedAxios.get.mockResolvedValue(mockResponse);

    const result = await fetchCrisisArticles();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.articles).toHaveLength(2);
      expect(result.articles[0].title).toBe("Emergency Alert");
      expect(result.articles[0].source).toBe("News Source");
      expect(result.articles[0].bodyText).toContain("long enough");
      expect(result.articles[0].id).toBeDefined();
      expect(result.articles[0].id.length).toBe(64); // SHA-256 hex length
    }

    expect(mockedAxios.get).toHaveBeenCalledWith(
      "https://newsapi.org/v2/everything",
      expect.objectContaining({
        params: expect.objectContaining({
          q: "emergency OR crisis OR disaster OR evacuation",
          pageSize: 20,
          language: "en",
          apiKey: "test-key",
        }),
        timeout: 15000,
      })
    );
  });

  it("should filter out articles with body text < 50 chars", async () => {
    process.env.NEWS_API_KEY = "test-key";

    const mockResponse = {
      data: {
        status: "ok",
        totalResults: 3,
        articles: [
          {
            url: "https://example.com/short",
            title: "Short Article",
            source: { name: "Source" },
            publishedAt: "2024-01-01T12:00:00Z",
            content: "Too short",
            description: null,
          },
          {
            url: "https://example.com/long",
            title: "Long Article",
            source: { name: "Source" },
            publishedAt: "2024-01-01T13:00:00Z",
            content: "This article has enough content to pass the 50 character minimum requirement.",
            description: null,
          },
        ],
      },
    };

    mockedAxios.get.mockResolvedValue(mockResponse);

    const result = await fetchCrisisArticles();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.articles).toHaveLength(1);
      expect(result.articles[0].title).toBe("Long Article");
    }
  });

  it("should deduplicate articles by URL hash", async () => {
    process.env.NEWS_API_KEY = "test-key";

    const mockResponse = {
      data: {
        status: "ok",
        totalResults: 2,
        articles: [
          {
            url: "https://example.com/duplicate",
            title: "First Instance",
            source: { name: "Source" },
            publishedAt: "2024-01-01T12:00:00Z",
            content: "This is a long enough article content that exceeds 50 characters.",
            description: null,
          },
          {
            url: "https://example.com/duplicate",
            title: "Second Instance",
            source: { name: "Source" },
            publishedAt: "2024-01-01T13:00:00Z",
            content: "This is a long enough article content that exceeds 50 characters.",
            description: null,
          },
        ],
      },
    };

    mockedAxios.get.mockResolvedValue(mockResponse);

    const result = await fetchCrisisArticles();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.articles).toHaveLength(1);
      expect(result.articles[0].title).toBe("First Instance");
    }
  });

  it("should return TIMEOUT error on request timeout", async () => {
    process.env.NEWS_API_KEY = "test-key";

    const timeoutError = new Error("timeout of 15000ms exceeded");
    timeoutError.name = "AxiosError";
    (timeoutError as any).code = "ECONNABORTED";

    mockedAxios.get.mockRejectedValue(timeoutError);

    const result = await fetchCrisisArticles();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("TIMEOUT");
      expect(result.error).toContain("timed out");
    }
  });

  it("should return NEWS_SOURCE_UNAVAILABLE on network error", async () => {
    process.env.NEWS_API_KEY = "test-key";

    const networkError = new Error("Network Error");
    mockedAxios.get.mockRejectedValue(networkError);

    const result = await fetchCrisisArticles();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("NEWS_SOURCE_UNAVAILABLE");
    }
  });

  it("should return error when NewsAPI returns non-ok status", async () => {
    process.env.NEWS_API_KEY = "test-key";

    const mockResponse = {
      data: {
        status: "error",
        code: "apiKeyInvalid",
        message: "Your API key is invalid",
      },
    };

    mockedAxios.get.mockResolvedValue(mockResponse);

    const result = await fetchCrisisArticles();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("NEWS_SOURCE_UNAVAILABLE");
    }
  });
});
