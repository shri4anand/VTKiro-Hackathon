import axios from "axios";
import crypto from "crypto";

export interface RawArticle {
  url: string;
  title: string;
  source: { name: string };
  publishedAt: string;
  content: string | null;
  description: string | null;
}

export interface ProcessedArticle {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  bodyText: string;
}

export interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: RawArticle[];
}

/**
 * Fetch crisis and emergency articles from NewsAPI
 * @returns Array of processed articles or error
 */
export async function fetchCrisisArticles(): Promise<
  { success: true; articles: ProcessedArticle[] } | { success: false; error: string; code: string }
> {
  const apiKey = process.env.NEWS_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: "NEWS_API_KEY not configured",
      code: "NEWS_SOURCE_UNAVAILABLE",
    };
  }

  const query = "emergency OR crisis OR disaster OR evacuation";
  const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24 hours ago
  const url = "https://newsapi.org/v2/everything";

  try {
    const response = await axios.get<NewsAPIResponse>(url, {
      params: {
        q: query,
        from,
        sortBy: "publishedAt",
        pageSize: 20,
        language: "en",
        apiKey,
      },
      timeout: 15000,
    });

    if (response.data.status !== "ok") {
      return {
        success: false,
        error: "NewsAPI returned non-ok status",
        code: "NEWS_SOURCE_UNAVAILABLE",
      };
    }

    const processed = processArticles(response.data.articles);
    return { success: true, articles: processed };
  } catch (error: any) {
    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      return {
        success: false,
        error: "NewsAPI request timed out",
        code: "TIMEOUT",
      };
    }

    return {
      success: false,
      error: error.message || "Failed to fetch from NewsAPI",
      code: "NEWS_SOURCE_UNAVAILABLE",
    };
  }
}

/**
 * Process raw NewsAPI articles: filter, deduplicate, and extract body text
 */
function processArticles(articles: RawArticle[]): ProcessedArticle[] {
  const seen = new Set<string>();
  const processed: ProcessedArticle[] = [];

  for (const article of articles) {
    // Extract body text from content or description
    const bodyText = article.content || article.description || "";

    // Filter out articles with body text < 50 chars
    if (bodyText.length < 50) {
      continue;
    }

    // Generate unique ID from URL hash
    const id = crypto.createHash("sha256").update(article.url).digest("hex");

    // Deduplicate by ID
    if (seen.has(id)) {
      continue;
    }

    seen.add(id);
    processed.push({
      id,
      title: article.title,
      source: article.source.name,
      publishedAt: article.publishedAt,
      bodyText,
    });
  }

  return processed;
}
