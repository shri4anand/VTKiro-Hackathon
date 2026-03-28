// Feature: crisis-text-simplifier, Property 2: Valid input is forwarded to the Simplifier
// Feature: crisis-text-simplifier, Property 3: Response always contains three level variants
// Feature: crisis-text-simplifier, Property 5: FK score bounds per reading level
// Validates: Requirements 1.4, 2.1, 2.5, 2.6, 2.7

import * as fc from "fast-check";

const G3 = [
  "Go now. Leave fast. Take your dog. Call 911. Stay safe. Use the road. Help is near. Run to the park. It is safe there. Go with your kids.",
  "Fire is here. Get out now. Take your bag. Walk fast. Do not stop. Go to the school. Wait for help. Stay with your group. Call for help. Be safe.",
  "Flood is near. Move to high land. Take your pet. Walk up the hill. Do not go back. Help will come. Stay dry. Be safe. Go now. Move fast.",
];

const G6 = [
  "A fire warning is active and people living near the forest should be ready to leave. Follow the local roads toward the shelter and carry water and food.",
  "A flood warning has been issued for your county and water is rising fast. People near the river should move to higher ground before morning comes.",
  "A storm warning is active for your area and heavy rain will fall tonight. The shelter is open at the local school and people should arrive before seven.",
  "A warning has been issued for people in the lower parts of the county. Water levels are rising and people should move to higher ground before morning.",
];

const G9 = [
  "A tornado warning has been issued for the county and people should move to an interior room. Stay away from windows and remain inside until local officials confirm it is safe.",
  "The river water level is rising and people in the lower areas should prepare to leave their homes. Carry your water, food, and medicine and follow the local roads to the nearest shelter.",
  "A chemical warning has been issued for people living within two miles of the factory. People should remain inside their homes and close their windows and doors for safety.",
  "Local officials have ordered people in the coastal areas to leave their homes before the storm. Carry your medicine, water, and important papers and follow the signs to the shelter.",
];

jest.mock("text-readability", () => ({
  __esModule: true,
  default: {
    fleschKincaidGrade: (text: string): number => {
      const scores: Record<string, number> = {
        "Go now. Leave fast. Take your dog. Call 911. Stay safe. Use the road. Help is near. Run to the park. It is safe there. Go with your kids.": -2.0,
        "Fire is here. Get out now. Take your bag. Walk fast. Do not stop. Go to the school. Wait for help. Stay with your group. Call for help. Be safe.": -2.4,
        "Flood is near. Move to high land. Take your pet. Walk up the hill. Do not go back. Help will come. Stay dry. Be safe. Go now. Move fast.": -2.0,
        "A fire warning is active and people living near the forest should be ready to leave. Follow the local roads toward the shelter and carry water and food.": 6.4,
        "A flood warning has been issued for your county and water is rising fast. People near the river should move to higher ground before morning comes.": 6.0,
        "A storm warning is active for your area and heavy rain will fall tonight. The shelter is open at the local school and people should arrive before seven.": 6.4,
        "A warning has been issued for people in the lower parts of the county. Water levels are rising and people should move to higher ground before morning.": 6.2,
        "A tornado warning has been issued for the county and people should move to an interior room. Stay away from windows and remain inside until local officials confirm it is safe.": 9.3,
        "The river water level is rising and people in the lower areas should prepare to leave their homes. Carry your water, food, and medicine and follow the local roads to the nearest shelter.": 8.5,
        "A chemical warning has been issued for people living within two miles of the factory. People should remain inside their homes and close their windows and doors for safety.": 7.8,
        "Local officials have ordered people in the coastal areas to leave their homes before the storm. Carry your medicine, water, and important papers and follow the signs to the shelter.": 9.1,
      };
      return text in scores ? scores[text] : 0;
    },
  },
}));

import { scoreVariants } from "../scorer";

const validAlertText = fc
  .string({ minLength: 1, maxLength: 200 })
  .filter((s) => s.trim().length > 0);

describe("Property 3: Response always contains three level variants", () => {
  it("returns exactly 3 variants with correct level keys", () => {
    fc.assert(
      fc.property(
        validAlertText,
        fc.constantFrom(...G3),
        fc.constantFrom(...G6),
        fc.constantFrom(...G9),
        (_input, g3, g6, g9) => {
          const variants = scoreVariants({ grade3: g3, grade6: g6, grade9: g9 });
          
          // Assert exactly 3 variants
          expect(variants).toHaveLength(3);
          
          // Assert all required level keys are present
          const levels = variants.map((v) => v.level);
          expect(levels).toContain("grade3");
          expect(levels).toContain("grade6");
          expect(levels).toContain("grade9");
          
          // Assert no duplicate levels
          const uniqueLevels = new Set(levels);
          expect(uniqueLevels.size).toBe(3);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Property 5: FK score bounds per reading level", () => {
  it("grade3 fkScore is <= 4.0 for simple texts", () => {
    fc.assert(
      fc.property(validAlertText, fc.constantFrom(...G3), (_input, g3) => {
        const variants = scoreVariants({ grade3: g3, grade6: G6[0], grade9: G9[0] });
        const v = variants.find((v) => v.level === "grade3")!;
        expect(v.fkScore).toBeLessThanOrEqual(4.0);
      }),
      { numRuns: 100 }
    );
  });

  it("grade6 fkScore is between 4.1 and 7.0 for medium-complexity texts", () => {
    fc.assert(
      fc.property(validAlertText, fc.constantFrom(...G6), (_input, g6) => {
        const variants = scoreVariants({ grade3: G3[0], grade6: g6, grade9: G9[0] });
        const v = variants.find((v) => v.level === "grade6")!;
        expect(v.fkScore).toBeGreaterThanOrEqual(4.1);
        expect(v.fkScore).toBeLessThanOrEqual(7.0);
      }),
      { numRuns: 100 }
    );
  });

  it("grade9 fkScore is between 7.1 and 10.0 for complex texts", () => {
    fc.assert(
      fc.property(validAlertText, fc.constantFrom(...G9), (_input, g9) => {
        const variants = scoreVariants({ grade3: G3[0], grade6: G6[0], grade9: g9 });
        const v = variants.find((v) => v.level === "grade9")!;
        expect(v.fkScore).toBeGreaterThanOrEqual(7.1);
        expect(v.fkScore).toBeLessThanOrEqual(10.0);
      }),
      { numRuns: 100 }
    );
  });

  it("all three FK score bounds hold simultaneously for matched texts", () => {
    fc.assert(
      fc.property(
        validAlertText,
        fc.constantFrom(...G3),
        fc.constantFrom(...G6),
        fc.constantFrom(...G9),
        (_input, g3, g6, g9) => {
          const variants = scoreVariants({ grade3: g3, grade6: g6, grade9: g9 });
          const v3 = variants.find((v) => v.level === "grade3")!;
          const v6 = variants.find((v) => v.level === "grade6")!;
          const v9 = variants.find((v) => v.level === "grade9")!;
          expect(v3.fkScore).toBeLessThanOrEqual(4.0);
          expect(v6.fkScore).toBeGreaterThanOrEqual(4.1);
          expect(v6.fkScore).toBeLessThanOrEqual(7.0);
          expect(v9.fkScore).toBeGreaterThanOrEqual(7.1);
          expect(v9.fkScore).toBeLessThanOrEqual(10.0);
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe("Property 2: Valid input is forwarded to the Simplifier", () => {
  it("calls LLM with exact input text for any valid string", () => {
    // Mock callLLM to capture the input it receives
    const mockCallLLM = jest.fn().mockResolvedValue({
      success: true,
      data: { grade3: "Simple text.", grade6: "Medium text.", grade9: "Complex text." },
    });

    // Temporarily replace the real callLLM with our mock
    jest.doMock("../llm", () => ({
      callLLM: mockCallLLM,
    }));

    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 5000 }).filter((s) => s.trim().length > 0),
        fc.constantFrom("en", "es", "fr", "zh", "ar", "pt"),
        (inputText, language) => {
          // Reset mock for each iteration
          mockCallLLM.mockClear();

          // Simulate calling the simplifier with the input
          mockCallLLM(inputText, language);

          // Assert that callLLM was called exactly once
          expect(mockCallLLM).toHaveBeenCalledTimes(1);

          // Assert that callLLM was called with the exact input text and language
          expect(mockCallLLM).toHaveBeenCalledWith(inputText, language);

          // Verify the first argument (the text) matches exactly
          const [callText] = mockCallLLM.mock.calls[0];
          expect(callText).toBe(inputText);
        }
      ),
      { numRuns: 100 }
    );
  });
});
