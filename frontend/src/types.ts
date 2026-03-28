// Core domain types for the Crisis Text Simplifier

export type Language = "en" | "es" | "fr" | "zh" | "ar" | "pt";

export type ReadingLevel = "grade3" | "grade6" | "grade9";

export interface AlertInput {
  text: string; // 1–10000 chars
  language: Language; // default: "en"
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
  id: string; // unique article identifier (e.g. URL hash)
  title: string;
  source: string;
  publishedAt: string; // ISO 8601
  variants: SimplifiedVariant[]; // always grade3, grade6, grade9
}

export interface FeedResponse {
  items: FeedItem[];
  fetchedAt: string; // ISO 8601
}

export interface FeedError {
  error: string;
  code: "NEWS_SOURCE_UNAVAILABLE" | "TIMEOUT" | "MALFORMED_RESPONSE";
}

export interface AppState {
  inputText: string;
  language: Language;
  activeLevel: ReadingLevel;
  status: "idle" | "loading" | "success" | "error";
  variants: SimplifiedVariant[] | null;
  error: AppError | null;
  playingLevel: ReadingLevel | null;
  feed: {
    items: FeedItem[];
    isPolling: boolean;
    feedError: FeedError | null;
  };
}
