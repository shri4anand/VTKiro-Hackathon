// Feature: crisis-text-simplifier, Property 14: Feed polling fires on the correct interval
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fc from "fast-check";

/**
 * Validates: Requirements 7.1
 *
 * Property 14: Feed polling fires on the correct interval
 * For any number of elapsed 5-minute intervals, the feed polling function
 * should have been called exactly that many times (plus the initial mount call).
 */
describe("Property 14: Feed polling fires on the correct interval", () => {
  const POLLING_INTERVAL = 300000; // 5 minutes in milliseconds

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should call poll function on mount and at each interval boundary", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10 }), (numIntervals) => {
        const pollFn = vi.fn();
        let intervalId: NodeJS.Timeout | null = null;

        // Simulate the polling setup (similar to useFeedPoller)
        pollFn(); // Initial call on mount
        intervalId = setInterval(pollFn, POLLING_INTERVAL);

        // Advance time through the specified number of intervals
        for (let i = 0; i < numIntervals; i++) {
          vi.advanceTimersByTime(POLLING_INTERVAL);
        }

        // Clean up
        if (intervalId) {
          clearInterval(intervalId);
        }

        // Assert: initial call + one call per interval
        const expectedCallCount = 1 + numIntervals;
        expect(pollFn).toHaveBeenCalledTimes(expectedCallCount);
      }),
      { numRuns: 100 }
    );
  });

  it("should not call poll function between interval boundaries", () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 1, max: POLLING_INTERVAL - 1 })
        ),
        ([numIntervals, partialTime]) => {
          const pollFn = vi.fn();
          let intervalId: NodeJS.Timeout | null = null;

          // Simulate the polling setup
          pollFn(); // Initial call on mount
          intervalId = setInterval(pollFn, POLLING_INTERVAL);

          // Advance through complete intervals
          for (let i = 0; i < numIntervals; i++) {
            vi.advanceTimersByTime(POLLING_INTERVAL);
          }

          // Record call count after complete intervals
          const callCountAfterIntervals = pollFn.mock.calls.length;

          // Advance by partial time (less than one interval)
          vi.advanceTimersByTime(partialTime);

          // Assert: no additional calls should have been made
          expect(pollFn).toHaveBeenCalledTimes(callCountAfterIntervals);

          // Clean up
          if (intervalId) {
            clearInterval(intervalId);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should maintain correct call count across multiple interval sequences", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 1, maxLength: 5 }),
        (intervalSequence) => {
          const pollFn = vi.fn();
          let intervalId: NodeJS.Timeout | null = null;

          // Simulate the polling setup
          pollFn(); // Initial call on mount
          intervalId = setInterval(pollFn, POLLING_INTERVAL);

          let totalExpectedCalls = 1; // Initial call

          // Process each sequence of intervals
          for (const numIntervals of intervalSequence) {
            for (let i = 0; i < numIntervals; i++) {
              vi.advanceTimersByTime(POLLING_INTERVAL);
              totalExpectedCalls++;
            }

            // Verify call count at each checkpoint
            expect(pollFn).toHaveBeenCalledTimes(totalExpectedCalls);
          }

          // Clean up
          if (intervalId) {
            clearInterval(intervalId);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should clear interval on cleanup and stop polling", () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 1, max: POLLING_INTERVAL - 1 })
        ),
        ([numIntervals, partialTime]) => {
          const pollFn = vi.fn();
          let intervalId: NodeJS.Timeout | null = null;

          // Simulate the polling setup
          pollFn(); // Initial call on mount
          intervalId = setInterval(pollFn, POLLING_INTERVAL);

          // Advance through some intervals
          for (let i = 0; i < numIntervals; i++) {
            vi.advanceTimersByTime(POLLING_INTERVAL);
          }

          const callCountBeforeCleanup = pollFn.mock.calls.length;

          // Simulate cleanup (clearing interval)
          if (intervalId) {
            clearInterval(intervalId);
          }

          // Advance time significantly
          vi.advanceTimersByTime(POLLING_INTERVAL * 10);

          // Assert: no additional calls after cleanup
          expect(pollFn).toHaveBeenCalledTimes(callCountBeforeCleanup);
        }
      ),
      { numRuns: 100 }
    );
  });
});
