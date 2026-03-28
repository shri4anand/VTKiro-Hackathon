import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { FeedPanelWrapper } from '../../components/FeedPanelWrapper';

// Feature: interactive-overlay-controls, Property 2: Minimized panels show only header with maximize button
// Feature: interactive-overlay-controls, Property 3: Minimized panels have constrained width
// Feature: interactive-overlay-controls, Property 4: Maximized panels show full content
// Feature: interactive-overlay-controls, Property 8: Panel controls display state-appropriate icons
// Feature: interactive-overlay-controls, Property 10: Panel state changes are announced to screen readers
// Feature: interactive-overlay-controls, Property 11: Minimized panel content is hidden from assistive technology
// **Validates: Requirements 2.4, 2.5, 3.1, 3.3, 5.1, 5.2, 6.3, 6.5**

describe('FeedPanelWrapper - Properties 2, 3, 4, 8, 10, 11', () => {
  it('Property 2: Minimized panels show only header with maximize button', () => {
    // Property-based test: for any minimized panel,
    // the panel should show header, title, and maximize button, but not content
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

          // Assert: Panel header exists
          const header = container.querySelector('h1');
          expect(header).toBeInTheDocument();
          expect(header?.textContent).toBe('Crisis Feed');

          // Assert: Maximize button exists (button with aria-label containing "Maximize")
          const button = screen.getByRole('button');
          expect(button).toBeInTheDocument();
          const ariaLabel = button.getAttribute('aria-label');
          expect(ariaLabel).toContain('Maximize');

          // Assert: Panel content is NOT rendered
          const content = screen.queryByTestId('panel-content');
          expect(content).not.toBeInTheDocument();

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 3: Minimized panels have constrained width', () => {
    // Property-based test: for any minimized panel,
    // the panel width should be 48px or less (w-12 class = 3rem = 48px)
    fc.assert(
      fc.property(
        fc.constant(true), // Always test minimized state
        () => {
          const onToggleMinimize = vi.fn();
          const testContent = <div>Test Content</div>;

          const { container, unmount } = render(
            <FeedPanelWrapper
              isMinimized={true}
              onToggleMinimize={onToggleMinimize}
              children={testContent}
            />
          );

          // Assert: Panel has w-12 class (48px width)
          const panel = container.firstChild as HTMLElement;
          expect(panel).toHaveClass('w-12');
          expect(panel).not.toHaveClass('w-64');

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 4: Maximized panels show full content', () => {
    // Property-based test: for any maximized panel,
    // the panel should show all content and have full width (256px = w-64)
    fc.assert(
      fc.property(
        fc.constant(false), // Always test maximized state
        () => {
          const onToggleMinimize = vi.fn();
          const testContent = <div data-testid="panel-content">Test Content</div>;

          const { container, unmount } = render(
            <FeedPanelWrapper
              isMinimized={false}
              onToggleMinimize={onToggleMinimize}
              children={testContent}
            />
          );

          // Assert: Panel has w-64 class (256px width)
          const panel = container.firstChild as HTMLElement;
          expect(panel).toHaveClass('w-64');
          expect(panel).not.toHaveClass('w-12');

          // Assert: Panel content IS rendered
          const content = screen.getByTestId('panel-content');
          expect(content).toBeInTheDocument();
          expect(content.textContent).toBe('Test Content');

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 8: Panel controls display state-appropriate icons', () => {
    // Property-based test: for any panel state,
    // the toggle button should display the correct icon (ChevronRight for minimized, ChevronLeft for maximized)
    fc.assert(
      fc.property(
        fc.boolean(), // isMinimized
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

          // Assert: Button has correct aria-label based on state
          const button = screen.getByRole('button');
          const ariaLabel = button.getAttribute('aria-label');
          
          if (isMinimized) {
            // Minimized state should show maximize icon/indicator
            expect(ariaLabel).toContain('Maximize');
            // ChevronRight icon (d="M9 5l7 7-7 7")
            const svg = button.querySelector('svg');
            const path = svg?.querySelector('path');
            expect(path?.getAttribute('d')).toBe('M9 5l7 7-7 7');
          } else {
            // Maximized state should show minimize icon/indicator
            expect(ariaLabel).toContain('Minimize');
            // ChevronLeft icon (d="M15 19l-7-7 7-7")
            const svg = button.querySelector('svg');
            const path = svg?.querySelector('path');
            expect(path?.getAttribute('d')).toBe('M15 19l-7-7 7-7');
          }

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 10: Panel state changes are announced to screen readers', () => {
    // Property-based test: for any panel state,
    // the panel should have aria-expanded attribute that reflects the current state
    fc.assert(
      fc.property(
        fc.boolean(), // isMinimized
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

          // Assert: Panel has aria-expanded attribute
          const panel = container.firstChild as HTMLElement;
          expect(panel).toHaveAttribute('aria-expanded');

          // Assert: aria-expanded reflects the panel state
          const ariaExpanded = panel.getAttribute('aria-expanded');
          if (isMinimized) {
            expect(ariaExpanded).toBe('false');
          } else {
            expect(ariaExpanded).toBe('true');
          }

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 11: Minimized panel content is hidden from assistive technology', () => {
    // Property-based test: for any minimized panel,
    // the panel content should not be rendered in the DOM (hidden from screen readers)
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

          // Assert: Panel content is not in the DOM (not rendered)
          const content = screen.queryByTestId('panel-content');
          expect(content).not.toBeInTheDocument();

          // Assert: Only header and button are present
          const header = container.querySelector('h1');
          const button = screen.getByRole('button');
          expect(header).toBeInTheDocument();
          expect(button).toBeInTheDocument();

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 2, 4: Panel content visibility toggles correctly with state', () => {
    // Property-based test: verify content visibility changes correctly
    // when transitioning between minimized and maximized states
    fc.assert(
      fc.property(
        fc.constant(true), // Dummy property for iteration
        () => {
          const onToggleMinimize = vi.fn();
          const testContent = <div data-testid="panel-content">Test Content</div>;

          // Test minimized state
          const { unmount: unmount1 } = render(
            <FeedPanelWrapper
              isMinimized={true}
              onToggleMinimize={onToggleMinimize}
              children={testContent}
            />
          );
          expect(screen.queryByTestId('panel-content')).not.toBeInTheDocument();
          unmount1();

          // Test maximized state
          const { unmount: unmount2 } = render(
            <FeedPanelWrapper
              isMinimized={false}
              onToggleMinimize={onToggleMinimize}
              children={testContent}
            />
          );
          expect(screen.getByTestId('panel-content')).toBeInTheDocument();
          unmount2();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 3, 4: Panel width changes correctly with state', () => {
    // Property-based test: verify width changes correctly
    // when transitioning between minimized and maximized states
    fc.assert(
      fc.property(
        fc.constant(true), // Dummy property for iteration
        () => {
          const onToggleMinimize = vi.fn();
          const testContent = <div>Test Content</div>;

          // Test minimized state width
          const { container: container1, unmount: unmount1 } = render(
            <FeedPanelWrapper
              isMinimized={true}
              onToggleMinimize={onToggleMinimize}
              children={testContent}
            />
          );
          const panelMinimized = container1.firstChild as HTMLElement;
          expect(panelMinimized).toHaveClass('w-12');
          unmount1();

          // Test maximized state width
          const { container: container2, unmount: unmount2 } = render(
            <FeedPanelWrapper
              isMinimized={false}
              onToggleMinimize={onToggleMinimize}
              children={testContent}
            />
          );
          const panelMaximized = container2.firstChild as HTMLElement;
          expect(panelMaximized).toHaveClass('w-64');
          unmount2();
        }
      ),
      { numRuns: 100 }
    );
  });
});
