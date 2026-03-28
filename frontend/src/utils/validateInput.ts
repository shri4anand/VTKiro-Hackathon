type ValidationResult = { valid: true } | { valid: false; reason: "EMPTY" | "TOO_LONG" };

export function validateInput(text: string): ValidationResult {
  if (text.length === 0) {
    return { valid: false, reason: "EMPTY" };
  }
  if (text.length > 5000) {
    return { valid: false, reason: "TOO_LONG" };
  }
  return { valid: true };
}
