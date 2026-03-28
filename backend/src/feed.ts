import { fetchGDACSEvents, ProcessedGDACSArticle } from "./gdacs";
import { callLLM } from "./llm";
import { scoreVariants } from "./scorer";
import { FeedItem, FeedResponse, FeedError } from "./types";

/**
 * Fetch and simplify crisis articles for the feed
 * Returns array of FeedItem objects or error
 */
export async function getFeed(): Promise<
  { success: true; data: FeedResponse } | { success: false; error: FeedError }
> {
  // Fetch articles from GDACS
  const articlesResult = await fetchGDACSEvents();

  if (!articlesResult.success) {
    return {
      success: false,
      error: {
        error: articlesResult.error,
        code: articlesResult.code as "NEWS_SOURCE_UNAVAILABLE" | "TIMEOUT" | "MALFORMED_RESPONSE",
      },
    };
  }

  const articles = articlesResult.articles;
  const feedItems: FeedItem[] = [];

  // Simplify each article
  for (const article of articles) {
    const simplifyResult = await simplifyArticle(article);

    if (!simplifyResult.success) {
      // If any article fails to simplify, return error
      return {
        success: false,
        error: {
          error: simplifyResult.error,
          code: simplifyResult.code,
        },
      };
    }

    feedItems.push(simplifyResult.feedItem);
  }

  return {
    success: true,
    data: {
      items: feedItems,
      fetchedAt: new Date().toISOString(),
    },
  };
}

/**
 * Simplify a single article by calling LLM and scoring variants
 */
async function simplifyArticle(
  article: ProcessedGDACSArticle
): Promise<
  | { success: true; feedItem: FeedItem }
  | { success: false; error: string; code: "TIMEOUT" | "MALFORMED_RESPONSE" | "NEWS_SOURCE_UNAVAILABLE" }
> {
  // Call LLM simplifier (reuse /api/simplify logic)
  const llmResult = await callLLM(article.bodyText, "en");

  if (!llmResult.success) {
    // Map LLM_UNAVAILABLE to NEWS_SOURCE_UNAVAILABLE for feed context
    const code = llmResult.code === "LLM_UNAVAILABLE" ? "NEWS_SOURCE_UNAVAILABLE" : llmResult.code;
    return {
      success: false,
      error: llmResult.error,
      code,
    };
  }

  // Score the variants
  const variants = scoreVariants(llmResult.data);

  return {
    success: true,
    feedItem: {
      id: article.id,
      title: article.title,
      source: article.source,
      publishedAt: article.publishedAt,
      variants,
      latitude: article.latitude,
      longitude: article.longitude,
    },
  };
}
