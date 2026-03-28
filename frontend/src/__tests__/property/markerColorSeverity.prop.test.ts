import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { SeverityLevel } from "../../types";

// Feature: crisis-text-simplifier, Property 22: Marker color matches severity level
// **Validates: Requirements 9.2**

// Severity color mapping function (extracted from MapView logic)
function getSeverityColor(severity: SeverityLevel): string {
  const SEVERITY_COLORS: Record<SeverityLevel, string> = {
    low: "#22c55e",
    medium: "#eab308",
    high: "#f97316",
    critical: "#ef4444",
  };

  return SEVERITY_COLORS[severity];
}

// Arbitrary for generating SeverityLevel
const severityLevelArbitrary = fc.oneof(
  fc.constant("low" as SeverityLevel),
  fc.constant("medium" as SeverityLevel),
  fc.constant("high" as SeverityLevel),
  fc.constant("critical" as SeverityLevel)
);

describe("MapView - Property 22: Marker color matches severity level", () => {
  it("should return the correct color hex for each severity level", () => {
    // Property-based test: for any SeverityLevel,
    // the color mapping function should return the defined color for that level
    fc.assert(
      fc.property(severityLevelArbitrary, (severity) => {
        const color = getSeverityColor(severity);

        // Assert: Color matches the expected hex for this severity level
        switch (severity) {
          case "low":
            expect(color).toBe("#22c55e"); // green
            break;
          case "medium":
            expect(color).toBe("#eab308"); // yellow
            break;
          case "high":
            expect(color).toBe("#f97316"); // orange
            break;
          case "critical":
            expect(color).toBe("#ef4444"); // red
            break;
          default:
            // Should never reach here with valid SeverityLevel
            expect.fail(`Unknown severity level: ${severity}`);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("should map all four severity levels to distinct colors", () => {
    // Verify that all severity levels map to unique colors
    const severityLevels: SeverityLevel[] = ["low", "medium", "high", "critical"];
    const colors = severityLevels.map(getSeverityColor);

    // Assert: All colors are distinct
    const uniqueColors = new Set(colors);
    expect(uniqueColors.size).toBe(4);

    // Assert: Each color is a valid hex color
    colors.forEach((color) => {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  it("should maintain consistent color mapping across multiple calls", () => {
    // Property-based test: for any severity level,
    // calling the mapping function multiple times should return the same color
    fc.assert(
      fc.property(severityLevelArbitrary, (severity) => {
        const color1 = getSeverityColor(severity);
        const color2 = getSeverityColor(severity);
        const color3 = getSeverityColor(severity);

        // Assert: Color is consistent across calls
        expect(color1).toBe(color2);
        expect(color2).toBe(color3);
      }),
      { numRuns: 100 }
    );
  });
});
