import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import userEvent from '@testing-library/user-event';
import { AppStateProvider } from '../../store/appState';
import App from '../../App';

// Feature: interactive-overlay-controls, Property 1: Panel toggle transitions state
// Feature: interactive-overlay-controls, Property 6: Panel state persists across unrelated interactions
// Feature: interactive-overlay-controls, Property 7: Panel states are independent
// **Validates: Requirements 2.3, 3.2, 4.1, 4.2, 4.3, 4.4**

// Mock hooks to avoid external dependencies
vi.mock('../../hooks/useSimplify', () => ({
  useSimplify: () => ({
    simplify: vi.fn(),
    status: 'idle',
    variants: [],
    error: null,
  }),
}));

vi.mock('../../hooks/useMapEvents', () => ({
  useMapEvents: () => ({
    events: [],
    loading: false,
    error: null,
  }),
}));

vi.mock('../../hooks/useFeedPoller', () => ({
  useFeedPoller: () => {},
}));

describe('Panel State Management - Properties 1, 6, 7', () => {
  it('Property 1: Panel toggle transitions state from maximized to minimized', async () => {
    // Property-based test: for any panel (Simplifier or Feed),
    // clicking the toggle button should transition from maximized to minimized
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(fc.constant('Simplifier'), fc.constant('Feed')),
        async (panelName) => {
          const user = userEvent.setup();
          const { unmount } = render(
            <AppStateProvider>
              <App />
            </AppStateProvider>
          );

          // Find the minimize button for the specified panel
          const minimizeButton = screen.getByRole('button', {
            name: new RegExp(`Minimize ${panelName}`, 'i'),
          });

          // Assert: Initially, panel should be maximized (minimize button visible)
          expect(minimizeButton).toBeInTheDocument();

          // Act: Click the minimize button
          await user.click(minimizeButton);

          // Assert: After click, panel should be minimized (maximize button visible)
          const maximizeButton = screen.getByRole('button', {
            name: new RegExp(`Maximize ${panelName}`, 'i'),
          });
          expect(maximizeButton).toBeInTheDocument();

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 1: Panel toggle transitions state from minimized to maximized', async () => {
    // Property-based test: for any panel (Simplifier or Feed),
    // clicking the toggle button should transition from minimized to maximized
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(fc.constant('Simplifier'), fc.constant('Feed')),
        async (panelName) => {
          const user = userEvent.setup();
          const { unmount } = render(
            <AppStateProvider>
              <App />
            </AppStateProvider>
          );

          // Find and click the minimize button
          const minimizeButton = screen.getByRole('button', {
            name: new RegExp(`Minimize ${panelName}`, 'i'),
          });
          await user.click(minimizeButton);

          // Find the maximize button
          const maximizeButton = screen.getByRole('button', {
            name: new RegExp(`Maximize ${panelName}`, 'i'),
          });

          // Act: Click the maximize button
          await user.click(maximizeButton);

          // Assert: After click, panel should be maximized (minimize button visible again)
          const minimizeButtonAgain = screen.getByRole('button', {
            name: new RegExp(`Minimize ${panelName}`, 'i'),
          });
          expect(minimizeButtonAgain).toBeInTheDocument();

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 1: Panel toggle alternates state correctly over multiple clicks', async () => {
    // Property-based test: for any panel and sequence of toggle clicks,
    // the panel state should alternate correctly
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(fc.constant('Simplifier'), fc.constant('Feed')),
        fc.integer({ min: 1, max: 10 }),
        async (panelName, numClicks) => {
          const user = userEvent.setup();
          const { unmount } = render(
            <AppStateProvider>
              <App />
            </AppStateProvider>
          );

          // Track expected state (starts maximized)
          let expectedMinimized = false;

          for (let i = 0; i < numClicks; i++) {
            if (expectedMinimized) {
              // Should find maximize button
              const maximizeButton = screen.getByRole('button', {
                name: new RegExp(`Maximize ${panelName}`, 'i'),
              });
              await user.click(maximizeButton);
              expectedMinimized = false;
            } else {
              // Should find minimize button
              const minimizeButton = screen.getByRole('button', {
                name: new RegExp(`Minimize ${panelName}`, 'i'),
              });
              await user.click(minimizeButton);
              expectedMinimized = true;
            }
          }

          // Assert: Final state matches expected state
          if (expectedMinimized) {
            const maximizeButton = screen.getByRole('button', {
              name: new RegExp(`Maximize ${panelName}`, 'i'),
            });
            expect(maximizeButton).toBeInTheDocument();
          } else {
            const minimizeButton = screen.getByRole('button', {
              name: new RegExp(`Minimize ${panelName}`, 'i'),
            });
            expect(minimizeButton).toBeInTheDocument();
          }

          unmount();
        }
      ),
      { numRuns: 50 } // Reduced runs due to multiple clicks
    );
  });

  it('Property 6: Panel state persists after changing language', async () => {
    // Property-based test: for any panel state,
    // changing language should not affect panel minimized/maximized state
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(fc.constant('Simplifier'), fc.constant('Feed')),
        fc.boolean(),
        async (panelName, shouldMinimize) => {
          const user = userEvent.setup();
          const { unmount } = render(
            <AppStateProvider>
              <App />
            </AppStateProvider>
          );

          // Set initial panel state
          if (shouldMinimize) {
            const minimizeButton = screen.getByRole('button', {
              name: new RegExp(`Minimize ${panelName}`, 'i'),
            });
            await user.click(minimizeButton);
          }

          // Act: Change language (find language toggle buttons)
          const languageButtons = screen.getAllByRole('button').filter(
            (btn) => btn.textContent === 'EN' || btn.textContent === 'ES'
          );
          if (languageButtons.length > 0) {
            await user.click(languageButtons[0]);
          }

          // Assert: Panel state should remain unchanged
          if (shouldMinimize) {
            const maximizeButton = screen.getByRole('button', {
              name: new RegExp(`Maximize ${panelName}`, 'i'),
            });
            expect(maximizeButton).toBeInTheDocument();
          } else {
            const minimizeButton = screen.getByRole('button', {
              name: new RegExp(`Minimize ${panelName}`, 'i'),
            });
            expect(minimizeButton).toBeInTheDocument();
          }

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 6: Panel state persists after changing reading level', async () => {
    // Property-based test: for any panel state,
    // changing reading level should not affect panel minimized/maximized state
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(fc.constant('Simplifier'), fc.constant('Feed')),
        fc.boolean(),
        async (panelName, shouldMinimize) => {
          const user = userEvent.setup();
          const { unmount } = render(
            <AppStateProvider>
              <App />
            </AppStateProvider>
          );

          // Set initial panel state
          if (shouldMinimize) {
            const minimizeButton = screen.getByRole('button', {
              name: new RegExp(`Minimize ${panelName}`, 'i'),
            });
            await user.click(minimizeButton);
          }

          // Act: Change reading level (find reading level buttons)
          const readingLevelButtons = screen.getAllByRole('button').filter(
            (btn) =>
              btn.textContent?.includes('Grade') ||
              btn.textContent?.includes('Adult')
          );
          if (readingLevelButtons.length > 0) {
            await user.click(readingLevelButtons[0]);
          }

          // Assert: Panel state should remain unchanged
          if (shouldMinimize) {
            const maximizeButton = screen.getByRole('button', {
              name: new RegExp(`Maximize ${panelName}`, 'i'),
            });
            expect(maximizeButton).toBeInTheDocument();
          } else {
            const minimizeButton = screen.getByRole('button', {
              name: new RegExp(`Minimize ${panelName}`, 'i'),
            });
            expect(minimizeButton).toBeInTheDocument();
          }

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 6: Panel state persists after typing in input field', async () => {
    // Property-based test: for any panel state,
    // typing in the input field should not affect panel minimized/maximized state
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(fc.constant('Simplifier'), fc.constant('Feed')),
        fc.boolean(),
        fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 '.split('')), { minLength: 1, maxLength: 20 }),
        async (panelName, shouldMinimize, inputText) => {
          const user = userEvent.setup();
          const { unmount } = render(
            <AppStateProvider>
              <App />
            </AppStateProvider>
          );

          // Set initial panel state
          if (shouldMinimize) {
            const minimizeButtons = screen.getAllByRole('button', {
              name: new RegExp(`Minimize ${panelName}`, 'i'),
            });
            await user.click(minimizeButtons[0]);
          }

          // Act: Type in the input field (find textarea)
          const textareas = screen.queryAllByRole('textbox');
          if (textareas.length > 0) {
            await user.type(textareas[0], inputText);
          }

          // Assert: Panel state should remain unchanged
          if (shouldMinimize) {
            const maximizeButtons = screen.getAllByRole('button', {
              name: new RegExp(`Maximize ${panelName}`, 'i'),
            });
            expect(maximizeButtons[0]).toBeInTheDocument();
          } else {
            const minimizeButtons = screen.getAllByRole('button', {
              name: new RegExp(`Minimize ${panelName}`, 'i'),
            });
            expect(minimizeButtons[0]).toBeInTheDocument();
          }

          unmount();
        }
      ),
      { numRuns: 50 } // Reduced runs due to typing
    );
  });

  it('Property 7: Panel states are independent - Simplifier does not affect Feed', async () => {
    // Property-based test: for any Simplifier panel state change,
    // the Feed panel state should remain unchanged
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(), // Initial Simplifier state
        fc.boolean(), // Initial Feed state
        fc.boolean(), // Toggle Simplifier
        async (initialSimplifierMinimized, initialFeedMinimized, toggleSimplifier) => {
          const user = userEvent.setup();
          const { unmount } = render(
            <AppStateProvider>
              <App />
            </AppStateProvider>
          );

          // Set initial states
          if (initialSimplifierMinimized) {
            const simplifierMinimizeBtn = screen.getByRole('button', {
              name: /Minimize Simplifier/i,
            });
            await user.click(simplifierMinimizeBtn);
          }

          if (initialFeedMinimized) {
            const feedMinimizeBtn = screen.getByRole('button', {
              name: /Minimize Feed/i,
            });
            await user.click(feedMinimizeBtn);
          }

          // Record Feed state before Simplifier toggle
          const feedButtonBefore = initialFeedMinimized
            ? screen.getByRole('button', { name: /Maximize Feed/i })
            : screen.getByRole('button', { name: /Minimize Feed/i });
          const feedStateBefore = feedButtonBefore.getAttribute('aria-label');

          // Act: Toggle Simplifier panel
          if (toggleSimplifier) {
            const simplifierButton = initialSimplifierMinimized
              ? screen.getByRole('button', { name: /Maximize Simplifier/i })
              : screen.getByRole('button', { name: /Minimize Simplifier/i });
            await user.click(simplifierButton);
          }

          // Assert: Feed state should remain unchanged
          const feedButtonAfter = initialFeedMinimized
            ? screen.getByRole('button', { name: /Maximize Feed/i })
            : screen.getByRole('button', { name: /Minimize Feed/i });
          const feedStateAfter = feedButtonAfter.getAttribute('aria-label');

          expect(feedStateAfter).toBe(feedStateBefore);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 7: Panel states are independent - Feed does not affect Simplifier', async () => {
    // Property-based test: for any Feed panel state change,
    // the Simplifier panel state should remain unchanged
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(), // Initial Simplifier state
        fc.boolean(), // Initial Feed state
        fc.boolean(), // Toggle Feed
        async (initialSimplifierMinimized, initialFeedMinimized, toggleFeed) => {
          const user = userEvent.setup();
          const { unmount } = render(
            <AppStateProvider>
              <App />
            </AppStateProvider>
          );

          // Set initial states
          if (initialSimplifierMinimized) {
            const simplifierMinimizeBtn = screen.getByRole('button', {
              name: /Minimize Simplifier/i,
            });
            await user.click(simplifierMinimizeBtn);
          }

          if (initialFeedMinimized) {
            const feedMinimizeBtn = screen.getByRole('button', {
              name: /Minimize Feed/i,
            });
            await user.click(feedMinimizeBtn);
          }

          // Record Simplifier state before Feed toggle
          const simplifierButtonBefore = initialSimplifierMinimized
            ? screen.getByRole('button', { name: /Maximize Simplifier/i })
            : screen.getByRole('button', { name: /Minimize Simplifier/i });
          const simplifierStateBefore = simplifierButtonBefore.getAttribute('aria-label');

          // Act: Toggle Feed panel
          if (toggleFeed) {
            const feedButton = initialFeedMinimized
              ? screen.getByRole('button', { name: /Maximize Feed/i })
              : screen.getByRole('button', { name: /Minimize Feed/i });
            await user.click(feedButton);
          }

          // Assert: Simplifier state should remain unchanged
          const simplifierButtonAfter = initialSimplifierMinimized
            ? screen.getByRole('button', { name: /Maximize Simplifier/i })
            : screen.getByRole('button', { name: /Minimize Simplifier/i });
          const simplifierStateAfter = simplifierButtonAfter.getAttribute('aria-label');

          expect(simplifierStateAfter).toBe(simplifierStateBefore);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 7: Both panels can be in different states simultaneously', async () => {
    // Property-based test: for any combination of panel states,
    // both panels should maintain their independent states
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(), // Simplifier minimized
        fc.boolean(), // Feed minimized
        async (simplifierMinimized, feedMinimized) => {
          const user = userEvent.setup();
          const { unmount } = render(
            <AppStateProvider>
              <App />
            </AppStateProvider>
          );

          // Set Simplifier state
          if (simplifierMinimized) {
            const simplifierMinimizeBtn = screen.getByRole('button', {
              name: /Minimize Simplifier/i,
            });
            await user.click(simplifierMinimizeBtn);
          }

          // Set Feed state
          if (feedMinimized) {
            const feedMinimizeBtn = screen.getByRole('button', {
              name: /Minimize Feed/i,
            });
            await user.click(feedMinimizeBtn);
          }

          // Assert: Both panels are in their expected states
          if (simplifierMinimized) {
            const simplifierMaximizeBtn = screen.getByRole('button', {
              name: /Maximize Simplifier/i,
            });
            expect(simplifierMaximizeBtn).toBeInTheDocument();
          } else {
            const simplifierMinimizeBtn = screen.getByRole('button', {
              name: /Minimize Simplifier/i,
            });
            expect(simplifierMinimizeBtn).toBeInTheDocument();
          }

          if (feedMinimized) {
            const feedMaximizeBtn = screen.getByRole('button', {
              name: /Maximize Feed/i,
            });
            expect(feedMaximizeBtn).toBeInTheDocument();
          } else {
            const feedMinimizeBtn = screen.getByRole('button', {
              name: /Minimize Feed/i,
            });
            expect(feedMinimizeBtn).toBeInTheDocument();
          }

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});
