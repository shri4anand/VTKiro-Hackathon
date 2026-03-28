// Feature: crisis-text-simplifier, Property 1: Input length validation
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { validateInput } from "../../utils/validateInput";

/**
 * Validates: Requirements 1.1, 1.3
 */
describe("Property 1: Input length validation", () => {
  it("rejects empty strings with reason EMPTY", () => {
    fc.assert(
      fc.property(fc.constant(""), (text) => {
        const result = validateInput(text);
        expect(result.valid).toBe(false);
        if (!result.valid) {
          expect(result.reason).toBe("EMPTY");
        }
      }),
      { numRuns: 100 }
    );
  });

  it("accepts strings of length 1–10000", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 10000 }),
        (text) => {
          const result = validateInput(text);
          expect(result.valid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("rejects strings of length > 10000 with reason TOO_LONG", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 10001, maxLength: 15000 }),
        (text) => {
          const result = validateInput(text);
          expect(result.valid).toBe(false);
          if (!result.valid) {
            expect(result.reason).toBe("TOO_LONG");
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
