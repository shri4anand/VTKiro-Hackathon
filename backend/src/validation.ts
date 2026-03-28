import { Language } from './types';

const VALID_LANGUAGES: Language[] = ["en", "es", "fr", "zh", "ar", "pt"];

export function validateSimplifyRequest(body: unknown):
  | { valid: true; text: string; language: Language }
  | { valid: false; error: string; code: "VALIDATION_ERROR" } {
  if (typeof body !== "object" || body === null) {
    return { valid: false, error: "Invalid request body.", code: "VALIDATION_ERROR" };
  }

  const { text, language } = body as Record<string, unknown>;

  if (typeof text !== "string" || text.length === 0) {
    return { valid: false, error: "Text is required.", code: "VALIDATION_ERROR" };
  }

  if (text.length > 10000) {
    return { valid: false, error: "Text exceeds 10,000 character limit.", code: "VALIDATION_ERROR" };
  }

  if (typeof language !== "string" || !(VALID_LANGUAGES as string[]).includes(language)) {
    return { valid: false, error: "Invalid language.", code: "VALIDATION_ERROR" };
  }

  return { valid: true, text, language: language as Language };
}
