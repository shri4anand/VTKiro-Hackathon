import request from "supertest";
import express from "express";
import cors from "cors";
import { getFeed } from "../feed";

jest.mock("../feed");
jest.mock("text-readability", () => ({
  fleschKincaidGrade: jest.fn((text: string) => {
    return Math.min(10, Math.max(1, text.length / 100));
  }),
}));

const mockGetFeed = getFeed as jest.MockedFunction<typeof getFeed>;

// Create a test app with the same setup as the real app
const createTestApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/api/feed", async (_req, res) => {
    const result = await getFeed();

    if (!result.success) {
      const statusCode = result.error.code === "TIMEOUT" ? 504 : 502;
      res.status(statusCode).json(result.error);
      return;
    }

    res.json(result.data);
  });

  return app;
};

describe("GET /api/feed endpoint", () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  it("should return 200 with feed items on success", async () => {
    mockGetFeed.mockResolvedValue({
      success: true,
      data: {
        items: [
          {
            id: "article1",
            title: "Emergency Alert",
            source: "Test Source",
            publishedAt: "2024-01-01T00:00:00Z",
            variants: [
              { level: "grade3", text: "Emergency. Be safe.", fkScore: 3.5 },
              { level: "grade6", text: "There is an emergency. Stay safe.", fkScore: 5.5 },
              { level: "grade9", text: "An emergency alert has been issued.", fkScore: 8.5 },
            ],
          },
        ],
        fetchedAt: "2024-01-01T00:00:00Z",
      },
    });

    const response = await request(app).get("/api/feed");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("items");
    expect(response.body).toHaveProperty("fetchedAt");
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].id).toBe("article1");
    expect(response.body.items[0].variants).toHaveLength(3);
  });

  it("should return 502 with NEWS_SOURCE_UNAVAILABLE on NewsAPI failure", async () => {
    mockGetFeed.mockResolvedValue({
      success: false,
      error: {
        error: "NewsAPI returned non-ok status",
        code: "NEWS_SOURCE_UNAVAILABLE",
      },
    });

    const response = await request(app).get("/api/feed");

    expect(response.status).toBe(502);
    expect(response.body).toEqual({
      error: "NewsAPI returned non-ok status",
      code: "NEWS_SOURCE_UNAVAILABLE",
    });
  });

  it("should return 504 with TIMEOUT on timeout", async () => {
    mockGetFeed.mockResolvedValue({
      success: false,
      error: {
        error: "NewsAPI request timed out",
        code: "TIMEOUT",
      },
    });

    const response = await request(app).get("/api/feed");

    expect(response.status).toBe(504);
    expect(response.body).toEqual({
      error: "NewsAPI request timed out",
      code: "TIMEOUT",
    });
  });

  it("should return 502 with MALFORMED_RESPONSE on malformed data", async () => {
    mockGetFeed.mockResolvedValue({
      success: false,
      error: {
        error: "LLM response was not valid JSON",
        code: "MALFORMED_RESPONSE",
      },
    });

    const response = await request(app).get("/api/feed");

    expect(response.status).toBe(502);
    expect(response.body).toEqual({
      error: "LLM response was not valid JSON",
      code: "MALFORMED_RESPONSE",
    });
  });

  it("should include all required FeedItem fields", async () => {
    mockGetFeed.mockResolvedValue({
      success: true,
      data: {
        items: [
          {
            id: "test-id",
            title: "Test Title",
            source: "Test Source",
            publishedAt: "2024-01-01T00:00:00Z",
            variants: [
              { level: "grade3", text: "Simple.", fkScore: 3.0 },
              { level: "grade6", text: "Simplified.", fkScore: 5.0 },
              { level: "grade9", text: "Simplified text.", fkScore: 8.0 },
            ],
          },
        ],
        fetchedAt: "2024-01-01T00:00:00Z",
      },
    });

    const response = await request(app).get("/api/feed");

    expect(response.status).toBe(200);
    const item = response.body.items[0];
    expect(item).toHaveProperty("id");
    expect(item).toHaveProperty("title");
    expect(item).toHaveProperty("source");
    expect(item).toHaveProperty("publishedAt");
    expect(item).toHaveProperty("variants");
    expect(item.variants).toHaveLength(3);
  });

  it("should include fetchedAt timestamp in response", async () => {
    const fetchedAt = "2024-01-01T12:00:00Z";
    mockGetFeed.mockResolvedValue({
      success: true,
      data: {
        items: [],
        fetchedAt,
      },
    });

    const response = await request(app).get("/api/feed");

    expect(response.status).toBe(200);
    expect(response.body.fetchedAt).toBe(fetchedAt);
  });
});
