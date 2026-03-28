import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { FeedPanelWrapper } from '../../components/FeedPanelWrapper';

// Feature: feed-panel-transparency, Property 2: Preservation - Existing Panel Behavior
// **Validates: Requirements 3.1, 3.2, 3.3, 3.4**

describe('FeedPanelWrapper - Preservation Property Tests (feed-panel-transparency)', () => {
  it('Property 2.1: Minimized panel maintains full opacity', () => {
    // Property-based test: for any minimized panel state,
    // the panel should maintain full opacity (opacity-100) regardless of interaction
    fc.assert(
      fc.property(
        fc.constant(true), // Always test minimized state
        () => {
          const onToggleMinimize = vi.fn();
          const testContent = <div data-testid="panel-content">Test Content</div>;

          const { container, unmount } = render(
            <FeedPanelWrapper
              isMinimized={true}
              onToggleMinimize={onToggleMinimize}
              children={testContent}
            />
          );

          const panel = container.firstChild as HTMLElement;

          // Assert: Minimized panel has full opacity (no opacity-40 class)
          expect(panel).not.toHaveClass('opacity-40');
          
          // Assert: Panel maintains bg-white (full opacity background)
          expect(panel).toHaveClass('bg-white');

          // Simulate mouse interactions - opacity should remain unchanged
          fireEvent.mouseEnter(panel);
          expect(panel).not.toHaveClass('opacity-40');
          
          fireEvent.mouseLeave(panel);
          expect(panel).not.toHaveClass('opacity-40');

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 2.2: Toggle between minimized/maximized animates smoothly', () => {
    // Property-based test: for any panel state transition,
    // the panel should have transition classes for smooth animation
    fc.assert(
      fc.property(
        fc.boolean(), // isMinimized state
        (isMinimized) => {
          const onToggleMinimize = vi.fn();
          const testContent = <div data-testid="panel-content">Test Content</div>;

          const { container, unmount } = render(
            <FeedPanelWrapper
              isMinimized={isMinimized}
              onToggleMinimize={onToggleMinimize}
              children={testContent}
            />
          );

          const panel = container.firstChild as HTMLElement;

          // Assert: Panel has transition classes for smooth animation
          expect(panel).toHaveClass('transition-all');
          expect(panel).toHaveClass('duration-300');
          expect(panel).toHaveClass('ease-in-out');
          
          // Assert: Panel respects motion-reduce preference
          expect(panel).toHaveClass('motion-reduce:transition-none');

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 2.3: Maximized panel displays all feed content correctly', () => {
    // Property-based test: for any maximized panel state,
    // the panel should render all children content correctly
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }), // Random content text
        (contentText) => {
          const onToggleMinimize = vi.fn();
          const testContent = <div data-testid="panel-content">{contentText}</div>;

          const { unmount } = render(
            <FeedPanelWrapper
              isMinimized={false}
              onToggleMinimize={onToggleMinimize}
              children={testContent}
            />
          );

          // Assert: Content is rendered in the DOM
          const content = screen.getByTestId('panel-content');
          expect(content).toBeInTheDocument();
          
          // Assert: Content text matches what was passed
          expect(content.textContent).toBe(contentText);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 2.4: User interactions with toggle button work correctly', () => {
    // Property-based test: for any panel state,
    // clicking the toggle button should call the onToggleMinimize callback
    fc.assert(
      fc.property(
        fc.boolean(), // isMinimized state
        (isMinimized) => {
          const onToggleMinimize = vi.fn();
          const testContent = <div>Test Content</div>;

          const { unmount } = render(
            <FeedPanelWrapper
              isMinimized={isMinimized}
              onToggleMinimize={onToggleMinimize}
              children={testContent}
            />
          );

          // Find and click the toggle button
          const button = screen.getByRole('button');
          fireEvent.click(button);

          // Assert: onToggleMinimize was called exactly once
          expect(onToggleMinimize).toHaveBeenCalledTimes(1);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 2.5: Panel positioning remains unchanged', () => {
    // Property-based test: for any panel state,
    // the panel should maintain its absolute positioning in the top-right corner
    fc.assert(
      fc.property(
        fc.boolean(), // isMinimized state
        (isMinimized) => {
          const onToggleMinimize = vi.fn();
          const testContent = <div>Test Content</div>;

          const { container, unmount } = render(
            <FeedPanelWrapper
              isMinimized={isMinimized}
              onToggleMinimize={onToggleMinimize}
              children={testContent}
            />
          );

          const panel = container.firstChild as HTMLElement;

          // Assert: Panel has correct positioning classes
          expect(panel).toHaveClass('absolute');
          expect(panel).toHaveClass('top-4');
          expect(panel).toHaveClass('right-4');
          
          // Assert: Panel has correct z-index for overlay
          expect(panel).toHaveClass('z-10');

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 2.6: Panel sizing changes correctly with state', () => {
    // Property-based test: for any panel state,
    // the panel should have the correct width class
    fc.assert(
      fc.property(
        fc.boolean(), // isMinimized state
        (isMinimized) => {
          const onToggleMinimize = vi.fn();
          const testContent = <div>Test Content</div>;

          const { container, unmount } = render(
            <FeedPanelWrapper
              isMinimized={isMinimized}
              onToggleMinimize={onToggleMinimize}
              children={testContent}
            />
          );

          const panel = container.firstChild as HTMLElement;

          if (isMinimized) {
            // Assert: Minimized panel has narrow width
            expect(panel).toHaveClass('w-12');
            expect(panel).not.toHaveClass('w-[28rem]');
          } else {
            // Assert: Maximized panel has full width
            expect(panel).toHaveClass('w-[28rem]');
            expect(panel).not.toHaveClass('w-12');
          }

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 2.7: Panel styling and visual properties remain unchanged', () => {
    // Property-based test: for any panel state,
    // the panel should maintain its core styling classes
    fc.assert(
      fc.property(
        fc.boolean(), // isMinimized state
        (isMinimized) => {
          const onToggleMinimize = vi.fn();
          const testContent = <div>Test Content</div>;

          const { container, unmount } = render(
            <FeedPanelWrapper
              isMinimized={isMinimized}
              onToggleMinimize={onToggleMinimize}
              children={testContent}
            />
          );

          const panel = container.firstChild as HTMLElement;

          // Assert: Panel has core styling classes
          expect(panel).toHaveClass('bg-white');
          expect(panel).toHaveClass('rounded-lg');
          expect(panel).toHaveClass('shadow-lg');
          expect(panel).toHaveClass('overflow-y-auto');
          expect(panel).toHaveClass('overflow-x-hidden');
          expect(panel).toHaveClass('max-h-[calc(100vh-2rem)]');

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 2.8: Panel header renders correctly in both states', () => {
    // Property-based test: for any panel state,
    // the panel header should render with correct title and styling
    fc.assert(
      fc.property(
        fc.boolean(), // isMinimized state
        (isMinimized) => {
          const onToggleMinimize = vi.fn();
          const testContent = <div>Test Content</div>;

          const { container, unmount } = render(
            <FeedPanelWrapper
              isMinimized={isMinimized}
              onToggleMinimize={onToggleMinimize}
              children={testContent}
            />
          );

          // Assert: Header exists with correct title
          const header = container.querySelector('h1');
          expect(header).toBeInTheDocument();
          expect(header?.textContent).toBe('Crisis Feed');
          
          // Assert: Header has correct styling based on state
          expect(header).toHaveClass('font-bold');
          expect(header).toHaveClass('text-gray-900');
          
          if (isMinimized) {
            expect(header).toHaveClass('text-sm');
            // Vertical text in minimized state
            expect(header).toHaveStyle({ writingMode: 'vertical-rl' });
          } else {
            expect(header).toHaveClass('text-xl');
          }

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 2.9: Panel accessibility attributes remain correct', () => {
    // Property-based test: for any panel state,
    // the panel should have correct aria-expanded attribute
    fc.assert(
      fc.property(
        fc.boolean(), // isMinimized state
        (isMinimized) => {
          const onToggleMinimize = vi.fn();
          const testContent = <div>Test Content</div>;

          const { container, unmount } = render(
            <FeedPanelWrapper
              isMinimized={isMinimized}
              onToggleMinimize={onToggleMinimize}
              children={testContent}
            />
          );

          const panel = container.firstChild as HTMLElement;

          // Assert: Panel has aria-expanded attribute
          expect(panel).toHaveAttribute('aria-expanded');
          
          // Assert: aria-expanded reflects the panel state correctly
          const ariaExpanded = panel.getAttribute('aria-expanded');
          expect(ariaExpanded).toBe(isMinimized ? 'false' : 'true');

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 2.10: Content visibility toggles correctly without side effects', () => {
    // Property-based test: verify that content visibility changes
    // do not affect other panel properties
    fc.assert(
      fc.property(
        fc.constant(true), // Dummy property for iteration
        () => {
          const onToggleMinimize = vi.fn();
          const testContent = <div data-testid="panel-content">Test Content</div>;

          // Test minimized state
          const { container: container1, unmount: unmount1 } = render(
            <FeedPanelWrapper
              isMinimized={true}
              onToggleMinimize={onToggleMinimize}
              children={testContent}
            />
          );
          
          const panelMinimized = container1.firstChild as HTMLElement;
          
          // Assert: Content is hidden
          expect(screen.queryByTestId('panel-content')).not.toBeInTheDocument();
          
          // Assert: Other properties remain intact
          expect(panelMinimized).toHaveClass('bg-white');
          expect(panelMinimized).toHaveClass('rounded-lg');
          expect(panelMinimized).toHaveAttribute('aria-expanded', 'false');
          
          unmount1();

          // Test maximized state
          const { container: container2, unmount: unmount2 } = render(
            <FeedPanelWrapper
              isMinimized={false}
              onToggleMinimize={onToggleMinimize}
              children={testContent}
            />
          );
          
          const panelMaximized = container2.firstChild as HTMLElement;
          
          // Assert: Content is visible
          expect(screen.getByTestId('panel-content')).toBeInTheDocument();
          
          // Assert: Other properties remain intact
          expect(panelMaximized).toHaveClass('bg-white');
          expect(panelMaximized).toHaveClass('rounded-lg');
          expect(panelMaximized).toHaveAttribute('aria-expanded', 'true');
          
          unmount2();
        }
      ),
      { numRuns: 100 }
    );
  });
});
