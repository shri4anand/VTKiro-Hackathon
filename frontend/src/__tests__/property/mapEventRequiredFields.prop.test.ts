import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { MapEvent, SeverityLevel } from "../../types";

// Feature: crisis-text-simplifier, Property 25: MapEvent records contain all required fields
// **Validates: Requirements 10.2**

// Arbitrary for generating MapEvent records
const severityLevelArbitrary = fc.oneof(
  fc.constant("low" as SeverityLevel),
  fc.constant("medium" as SeverityLevel),
  fc.constant("high" as SeverityLevel),
  fc.constant("critical" as SeverityLevel)
);

const mapEventArbitrary = (): fc.Arbitrary<MapEvent> => {
  return fc.record({
    id: fc.stringMatching(/^evt-[a-z0-9]{3,15}$/),
    title: fc.string({ minLength: 10, maxLength: 100 }).filter((s) => s.trim().length > 0),
    description: fc.string({ minLength: 20, maxLength: 300 }).filter((s) => s.trim().length > 0),
    latitude: fc.float({ min: -90, max: 90, noNaN: true }),
    longitude: fc.float({ min: -180, max: 180, noNaN: true }),
    timestamp: fc.date().map((d) => d.toISOString()),
    severity: severityLevelArbitrary,
  });
};

// Helper function to validate that a MapEvent has all required fields
const hasAllRequiredFields = (event: MapEvent): boolean => {
  return (
    typeof event.id === "string" &&
    event.id.length > 0 &&
    typeof event.title === "string" &&
    event.title.length > 0 &&
    typeof event.description === "string" &&
    event.description.length > 0 &&
    typeof event.latitude === "number" &&
    !isNaN(event.latitude) &&
    typeof event.longitude === "number" &&
    !isNaN(event.longitude) &&
    typeof event.timestamp === "string" &&
    event.timestamp.length > 0 &&
    typeof event.severity === "string" &&
    ["low", "medium", "high", "critical"].includes(event.severity)
  );
};

describe("MapEvent - Property 25: MapEvent records contain all required fields", () => {
  it("should validate that the static dataset contains all required fields", async () => {
    // Load the actual dataset from the public directory
    const datasetModule = await import("../../../public/data/map-events.json");
    const dataset: MapEvent[] = datasetModule.default;

    // Assert: Dataset is not empty
    expect(dataset.length).toBeGreaterThan(0);

    // Assert: Each record has all seven required fields with non-null values
    dataset.forEach((event, index) => {
      expect(event, `Event at index ${index} missing required fields`).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
        description: expect.any(String),
        latitude: expect.any(Number),
        longitude: expect.any(Number),
        timestamp: expect.any(String),
        severity: expect.any(String),
      });

      // Assert: All fields are non-null and non-empty
      expect(event.id.length, `Event ${index} has empty id`).toBeGreaterThan(0);
      expect(event.title.length, `Event ${index} has empty title`).toBeGreaterThan(0);
      expect(event.description.length, `Event ${index} has empty description`).toBeGreaterThan(0);
      expect(isNaN(event.latitude), `Event ${index} has invalid latitude`).toBe(false);
      expect(isNaN(event.longitude), `Event ${index} has invalid longitude`).toBe(false);
      expect(event.timestamp.length, `Event ${index} has empty timestamp`).toBeGreaterThan(0);
      expect(
        ["low", "medium", "high", "critical"].includes(event.severity),
        `Event ${index} has invalid severity: ${event.severity}`
      ).toBe(true);
    });
  });

  it("should validate that any generated MapEvent has all required fields", () => {
    // Property-based test: for any generated MapEvent record,
    // it should have all seven required fields with non-null values
    fc.assert(
      fc.property(mapEventArbitrary(), (event) => {
        // Assert: The event has all required fields
        expect(hasAllRequiredFields(event)).toBe(true);

        // Assert: Each field has the correct type
        expect(typeof event.id).toBe("string");
        expect(typeof event.title).toBe("string");
        expect(typeof event.description).toBe("string");
        expect(typeof event.latitude).toBe("number");
        expect(typeof event.longitude).toBe("number");
        expect(typeof event.timestamp).toBe("string");
        expect(typeof event.severity).toBe("string");

        // Assert: Numeric fields are valid numbers
        expect(isNaN(event.latitude)).toBe(false);
        expect(isNaN(event.longitude)).toBe(false);

        // Assert: Latitude and longitude are within valid ranges
        expect(event.latitude).toBeGreaterThanOrEqual(-90);
        expect(event.latitude).toBeLessThanOrEqual(90);
        expect(event.longitude).toBeGreaterThanOrEqual(-180);
        expect(event.longitude).toBeLessThanOrEqual(180);

        // Assert: Severity is one of the valid values
        expect(["low", "medium", "high", "critical"]).toContain(event.severity);
      }),
      { numRuns: 100 }
    );
  });

  it("should validate that arrays of MapEvents all have required fields", () => {
    // Property-based test: for any array of MapEvent records,
    // every record should have all seven required fields
    fc.assert(
      fc.property(
        fc.array(mapEventArbitrary(), { minLength: 1, maxLength: 20 }),
        (events) => {
          // Assert: Every event in the array has all required fields
          events.forEach((event) => {
            expect(hasAllRequiredFields(event)).toBe(true);
          });

          // Assert: All event ids are unique
          const ids = events.map((e) => e.id);
          const uniqueIds = new Set(ids);
          expect(uniqueIds.size).toBe(ids.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should reject MapEvent records missing required fields", () => {
    // Test that validation correctly identifies incomplete records
    const incompleteEvents = [
      { id: "evt-1", title: "Test" }, // missing description, lat, lng, timestamp, severity
      { id: "evt-2", title: "Test", description: "Desc" }, // missing lat, lng, timestamp, severity
      { id: "evt-3", title: "Test", description: "Desc", latitude: 0, longitude: 0 }, // missing timestamp, severity
    ];

    incompleteEvents.forEach((event) => {
      expect(hasAllRequiredFields(event as any)).toBe(false);
    });
  });

  it("should reject MapEvent records with null or undefined required fields", () => {
    // Test that validation correctly identifies null/undefined fields
    const invalidEvents = [
      {
        id: null,
        title: "Test",
        description: "Desc",
        latitude: 0,
        longitude: 0,
        timestamp: "2024-01-01T00:00:00Z",
        severity: "low",
      },
      {
        id: "evt-1",
        title: "",
        description: "Desc",
        latitude: 0,
        longitude: 0,
        timestamp: "2024-01-01T00:00:00Z",
        severity: "low",
      },
      {
        id: "evt-1",
        title: "Test",
        description: "Desc",
        latitude: NaN,
        longitude: 0,
        timestamp: "2024-01-01T00:00:00Z",
        severity: "low",
      },
    ];

    invalidEvents.forEach((event) => {
      expect(hasAllRequiredFields(event as any)).toBe(false);
    });
  });
});
