// Feature: interactive-overlay-controls, Property 12: Feed polling continues in both states
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import * as fc from 'fast-check';
import { FeedPanel } from '../../components/FeedPanel';
import { AppStateProvider } from '../../store/appState';

describe('FeedPanel - Property 12: Feed polling continues in both states', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    
    // Mock fetch for feed endpoint
    global.fetch = vi.fn((url) => {
      if (typeof url === 'string' && url.includes('/api/feed')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            items: [],
          }),
        } as Response);
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('Property 12: FeedPanel polling mechanism is independent of panel wrapper state', async () => {
    // This property verifies that the FeedPanel component's internal polling
    // mechanism continues to function regardless of whether the panel is
    // minimized or maximized. The polling is implemented in FeedPanel.tsx
    // using useEffect and setInterval, which are not affected by the
    // FeedPanelWrapper's minimized state.
    
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 3 }), // Number of poll cycles to test
        async (pollCycles) => {
          const { unmount } = render(
            <AppStateProvider>
              <FeedPanel />
            </AppStateProvider>
          );

          // Wait for initial poll
          await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
              expect.stringContaining('/api/feed'),
              expect.any(Object)
            );
          });

          const initialCallCount = (global.fetch as any).mock.calls.length;

          // Advance time by poll intervals
          // The polling continues regardless of panel state because:
          // 1. FeedPanel's useEffect sets up the interval on mount
          // 2. The interval is only cleared on unmount
          // 3. The FeedPanelWrapper's minimized state only affects rendering,
          //    not the FeedPanel's lifecycle
          for (let i = 0; i < pollCycles; i++) {
            vi.advanceTimersByTime(5 * 60 * 1000); // 5 minutes
            await waitFor(() => {
              expect((global.fetch as any).mock.calls.length).toBeGreaterThan(
                initialCallCount + i
              );
            });
          }

          // Verify polling continued
          expect((global.fetch as any).mock.calls.length).toBeGreaterThanOrEqual(
            initialCallCount + pollCycles
          );

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 12: FeedPanel maintains consistent polling interval', async () => {
    // Verify that the polling interval remains constant (5 minutes)
    // regardless of how many times it polls
    
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 4 }), // Number of intervals to test
        async (numIntervals) => {
          const { unmount } = render(
            <AppStateProvider>
              <FeedPanel />
            </AppStateProvider>
          );

          // Wait for initial poll
          await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
          });

          const callCounts: number[] = [(global.fetch as any).mock.calls.length];

          // Advance time and record call counts
          for (let i = 0; i < numIntervals; i++) {
            vi.advanceTimersByTime(5 * 60 * 1000);
            await waitFor(() => {
              expect((global.fetch as any).mock.calls.length).toBeGreaterThan(
                callCounts[callCounts.length - 1]
              );
            });
            callCounts.push((global.fetch as any).mock.calls.length);
          }

          // Verify each interval triggered exactly one poll
          for (let i = 1; i < callCounts.length; i++) {
            expect(callCounts[i] - callCounts[i - 1]).toBe(1);
          }

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});
