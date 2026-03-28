import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PanelToggleButton } from '../../components/PanelToggleButton';

describe('PanelToggleButton', () => {
  it('should render minimize button with correct aria-label when maximized', () => {
    const onClick = vi.fn();
    render(
      <PanelToggleButton
        isMinimized={false}
        onClick={onClick}
        panelName="Simplifier"
      />
    );

    const button = screen.getByRole('button', { name: 'Minimize Simplifier panel' });
    expect(button).toBeInTheDocument();
  });

  it('should render maximize button with correct aria-label when minimized', () => {
    const onClick = vi.fn();
    render(
      <PanelToggleButton
        isMinimized={true}
        onClick={onClick}
        panelName="Feed"
      />
    );

    const button = screen.getByRole('button', { name: 'Maximize Feed panel' });
    expect(button).toBeInTheDocument();
  });

  it('should call onClick when button is clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <PanelToggleButton
        isMinimized={false}
        onClick={onClick}
        panelName="Simplifier"
      />
    );

    const button = screen.getByRole('button');
    await user.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should call onClick when Enter key is pressed', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <PanelToggleButton
        isMinimized={false}
        onClick={onClick}
        panelName="Simplifier"
      />
    );

    const button = screen.getByRole('button');
    button.focus();
    await user.keyboard('{Enter}');

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should call onClick when Space key is pressed', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <PanelToggleButton
        isMinimized={false}
        onClick={onClick}
        panelName="Simplifier"
      />
    );

    const button = screen.getByRole('button');
    button.focus();
    await user.keyboard(' ');

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should be keyboard focusable', () => {
    const onClick = vi.fn();
    render(
      <PanelToggleButton
        isMinimized={false}
        onClick={onClick}
        panelName="Simplifier"
      />
    );

    const button = screen.getByRole('button');
    button.focus();
    expect(button).toHaveFocus();
  });

  it('should have hover and focus styles applied', () => {
    const onClick = vi.fn();
    render(
      <PanelToggleButton
        isMinimized={false}
        onClick={onClick}
        panelName="Simplifier"
      />
    );

    const button = screen.getByRole('button');
    expect(button.className).toContain('hover:text-gray-900');
    expect(button.className).toContain('hover:bg-gray-100');
    expect(button.className).toContain('focus:ring-2');
    expect(button.className).toContain('focus:ring-blue-500');
  });

  it('should render different icons based on isMinimized state', () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <PanelToggleButton
        isMinimized={false}
        onClick={onClick}
        panelName="Simplifier"
      />
    );

    // Check for ChevronLeft icon (minimize) - path with "M15 19l-7-7 7-7"
    let svg = screen.getByRole('button').querySelector('svg');
    let path = svg?.querySelector('path');
    expect(path?.getAttribute('d')).toBe('M15 19l-7-7 7-7');

    // Rerender with minimized state
    rerender(
      <PanelToggleButton
        isMinimized={true}
        onClick={onClick}
        panelName="Simplifier"
      />
    );

    // Check for ChevronRight icon (maximize) - path with "M9 5l7 7-7 7"
    svg = screen.getByRole('button').querySelector('svg');
    path = svg?.querySelector('path');
    expect(path?.getAttribute('d')).toBe('M9 5l7 7-7 7');
  });
});
