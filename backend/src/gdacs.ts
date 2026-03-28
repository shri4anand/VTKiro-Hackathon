import axios from "axios";
import crypto from "crypto";

export interface GDACSEvent {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  latitude: number;
  longitude: number;
  eventType: string;
  severity: string;
}

export interface ProcessedGDACSArticle {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  bodyText: string;
  latitude: number;
  longitude: number;
}

/**
 * Fetch crisis events from GDACS RSS feed
 * @returns Array of processed articles with coordinates or error
 */
export async function fetchGDACSEvents(): Promise<
  { success: true; articles: ProcessedGDACSArticle[] } | { success: false; error: string; code: string }
> {
  const url = "https://www.gdacs.org/xml/rss.xml";

  try {
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        "Accept": "application/xml, text/xml",
      },
    });

    const articles = parseGDACSRSS(response.data);
    return { success: true, articles };
  } catch (error: any) {
    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      return {
        success: false,
        error: "GDACS request timed out",
        code: "TIMEOUT",
      };
    }

    return {
      success: false,
      error: error.message || "Failed to fetch from GDACS",
      code: "NEWS_SOURCE_UNAVAILABLE",
    };
  }
}

/**
 * Parse GDACS RSS XML and extract event data
 */
function parseGDACSRSS(xmlData: string): ProcessedGDACSArticle[] {
  const articles: ProcessedGDACSArticle[] = [];
  
  // Simple regex-based XML parsing (for production, use a proper XML parser like xml2js)
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  const items = xmlData.match(itemRegex) || [];

  for (const item of items) {
    try {
      const title = extractTag(item, "title");
      const description = extractTag(item, "description");
      const link = extractTag(item, "link");
      const pubDate = extractTag(item, "pubDate");
      
      // GDACS uses geo:Point for coordinates
      const geoPoint = extractTag(item, "geo:Point");
      const latMatch = geoPoint.match(/<geo:lat>([-\d.]+)<\/geo:lat>/);
      const lonMatch = geoPoint.match(/<geo:long>([-\d.]+)<\/geo:long>/);

      if (!title || !description || !link || !latMatch || !lonMatch) {
        continue;
      }

      const latitude = parseFloat(latMatch[1]);
      const longitude = parseFloat(lonMatch[1]);

      // Filter out invalid coordinates
      if (isNaN(latitude) || isNaN(longitude)) {
        continue;
      }

      // Filter out articles with description < 50 chars
      if (description.length < 50) {
        continue;
      }

      // Generate unique ID from link hash
      const id = crypto.createHash("sha256").update(link).digest("hex");

      articles.push({
        id,
        title: cleanText(title),
        source: "GDACS",
        publishedAt: pubDate || new Date().toISOString(),
        bodyText: cleanText(description),
        latitude,
        longitude,
      });
    } catch (err) {
      // Skip malformed items
      continue;
    }
  }

  // Limit to 5 most recent articles
  return articles.slice(0, 5);
}

/**
 * Extract content from XML tag
 */
function extractTag(xml: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\/${tagName}>`, "i");
  const match = xml.match(regex);
  return match ? match[1].trim() : "";
}

/**
 * Clean HTML entities and extra whitespace from text
 */
function cleanText(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "") // Remove HTML tags
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
