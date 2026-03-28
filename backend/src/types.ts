// Shared domain types for the Crisis Text Simplifier backend

export type Language = "en" | "es" | "fr" | "zh" | "ar" | "pt";

export type ReadingLevel = "grade3" | "grade6" | "grade9";

export interface AlertInput {
  text: string; // 1–5000 chars
  language: Language;
}

export interface SimplifiedVariant {
  level: ReadingLevel;
  text: string;
  fkScore: number;
}

export interface SimplifyResponse {
  variants: SimplifiedVariant[];
}

export interface AppError {
  error: string;
  code:
    | "LLM_UNAVAILABLE"
    | "TIMEOUT"
    | "MALFORMED_RESPONSE"
    | "VALIDATION_ERROR";
}

export interface FeedItem {
  id: string;
  title: string;
  source: string;
  publishedAt: string; // ISO 8601
  variants: SimplifiedVariant[];
  latitude?: number;
  longitude?: number;
}

export interface FeedResponse {
  items: FeedItem[];
  fetchedAt: string; // ISO 8601
}

export interface FeedError {
  error: string;
  code: "NEWS_SOURCE_UNAVAILABLE" | "TIMEOUT" | "MALFORMED_RESPONSE";
}
