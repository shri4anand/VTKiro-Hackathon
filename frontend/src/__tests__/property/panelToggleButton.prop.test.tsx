import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import userEvent from '@testing-library/user-event';
import { PanelToggleButton } from '../../components/PanelToggleButton';

// Feature: interactive-overlay-controls, Property 5: Panel control buttons have accessible labels
// Feature: interactive-overlay-controls, Property 9: Panel control buttons are keyboard accessible
// **Validates: Requirements 2.6, 3.4, 6.1, 6.2, 6.4**

describe('PanelToggleButton - Property 5 & 9: Accessible labels and keyboard accessibility', () => {
  it('Property 5: should have accessible aria-label for any panel name and state', () => {
    // Property-based test: for any panel name and minimized state,
    // the button should have a non-empty aria-label that describes its action
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.boolean(),
        (panelName, isMinimized) => {
          const onClick = vi.fn();
          const { container, unmount } = render(
            <PanelToggleButton
              isMinimized={isMinimized}
              onClick={onClick}
              panelName={panelName}
            />
          );

          // Assert: Button has aria-label attribute
          const button = container.querySelector('button');
          expect(button).toBeInTheDocument();
          expect(button).toHaveAttribute('aria-label');

          // Assert: aria-label is non-empty
          const ariaLabel = button?.getAttribute('aria-label');
          expect(ariaLabel).not.toBe('');
          expect(ariaLabel).not.toBeNull();

          // Assert: aria-label describes the action
          if (isMinimized) {
            expect(ariaLabel).toContain('Maximize');
            expect(ariaLabel).toContain(panelName);
          } else {
            expect(ariaLabel).toContain('Minimize');
            expect(ariaLabel).toContain(panelName);
          }

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 9: should be keyboard focusable for any panel name and state', () => {
    // Property-based test: for any panel name and minimized state,
    // the button should be focusable via Tab key
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.boolean(),
        (panelName, isMinimized) => {
          const onClick = vi.fn();
          const { unmount } = render(
            <PanelToggleButton
              isMinimized={isMinimized}
              onClick={onClick}
              panelName={panelName}
            />
          );

          // Assert: Button is focusable
          const button = screen.getByRole('button');
          button.focus();
          expect(button).toHaveFocus();

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 9: should be activatable via Enter key for any panel name and state', async () => {
    // Property-based test: for any panel name and minimized state,
    // the button should be activatable via Enter key
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.boolean(),
        async (panelName, isMinimized) => {
          const user = userEvent.setup();
          const onClick = vi.fn();
          const { unmount } = render(
            <PanelToggleButton
              isMinimized={isMinimized}
              onClick={onClick}
              panelName={panelName}
            />
          );

          // Act: Focus button and press Enter
          const button = screen.getByRole('button');
          button.focus();
          await user.keyboard('{Enter}');

          // Assert: onClick was called
          expect(onClick).toHaveBeenCalledTimes(1);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 9: should be activatable via Space key for any panel name and state', async () => {
    // Property-based test: for any panel name and minimized state,
    // the button should be activatable via Space key
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.boolean(),
        async (panelName, isMinimized) => {
          const user = userEvent.setup();
          const onClick = vi.fn();
          const { unmount } = render(
            <PanelToggleButton
              isMinimized={isMinimized}
              onClick={onClick}
              panelName={panelName}
            />
          );

          // Act: Focus button and press Space
          const button = screen.getByRole('button');
          button.focus();
          await user.keyboard(' ');

          // Assert: onClick was called
          expect(onClick).toHaveBeenCalledTimes(1);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 9: keyboard activation should produce same result as mouse click', async () => {
    // Property-based test: for any panel name and minimized state,
    // keyboard activation (Enter/Space) should produce the same result as mouse click
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.boolean(),
        fc.oneof(fc.constant('Enter'), fc.constant('Space')),
        async (panelName, isMinimized, keyboardKey) => {
          const user = userEvent.setup();
          
          // Test mouse click
          const onClickMouse = vi.fn();
          const { unmount: unmount1 } = render(
            <PanelToggleButton
              isMinimized={isMinimized}
              onClick={onClickMouse}
              panelName={panelName}
            />
          );
          const buttonMouse = screen.getByRole('button');
          await user.click(buttonMouse);
          const mouseCallCount = onClickMouse.mock.calls.length;
          unmount1();

          // Test keyboard activation
          const onClickKeyboard = vi.fn();
          const { unmount: unmount2 } = render(
            <PanelToggleButton
              isMinimized={isMinimized}
              onClick={onClickKeyboard}
              panelName={panelName}
            />
          );
          const buttonKeyboard = screen.getByRole('button');
          buttonKeyboard.focus();
          
          if (keyboardKey === 'Enter') {
            await user.keyboard('{Enter}');
          } else {
            await user.keyboard(' ');
          }
          
          const keyboardCallCount = onClickKeyboard.mock.calls.length;
          unmount2();

          // Assert: Both methods result in the same number of calls
          expect(keyboardCallCount).toBe(mouseCallCount);
          expect(keyboardCallCount).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 5 & 9: should have accessible label and be keyboard accessible for common panel names', () => {
    // Property-based test: for common panel names (Simplifier, Feed),
    // verify both accessible labels and keyboard accessibility
    fc.assert(
      fc.property(
        fc.oneof(fc.constant('Simplifier'), fc.constant('Feed')),
        fc.boolean(),
        (panelName, isMinimized) => {
          const onClick = vi.fn();
          const { unmount } = render(
            <PanelToggleButton
              isMinimized={isMinimized}
              onClick={onClick}
              panelName={panelName}
            />
          );

          // Assert Property 5: Accessible label
          const button = screen.getByRole('button');
          expect(button).toHaveAttribute('aria-label');
          const ariaLabel = button.getAttribute('aria-label');
          expect(ariaLabel).not.toBe('');
          expect(ariaLabel).toContain(panelName);
          expect(ariaLabel).toContain(isMinimized ? 'Maximize' : 'Minimize');

          // Assert Property 9: Keyboard focusable
          button.focus();
          expect(button).toHaveFocus();

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});
