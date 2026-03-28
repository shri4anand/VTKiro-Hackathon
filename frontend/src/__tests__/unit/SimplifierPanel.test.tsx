import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SimplifierPanel } from '../../components/SimplifierPanel';

describe('SimplifierPanel', () => {
  it('renders with maximized state by default', () => {
    render(
      <SimplifierPanel
        isMinimized={false}
        onToggleMinimize={vi.fn()}
        isFocused={false}
        onFocusChange={vi.fn()}
      >
        <div>Simplifier Content</div>
      </SimplifierPanel>
    );

    expect(screen.getByText('Crisis Text Simplifier')).toBeInTheDocument();
    expect(screen.getByText('Simplifier Content')).toBeInTheDocument();
  });

  it('applies w-64 class when maximized', () => {
    const { container } = render(
      <SimplifierPanel
        isMinimized={false}
        onToggleMinimize={vi.fn()}
        isFocused={false}
        onFocusChange={vi.fn()}
      >
        <div>Simplifier Content</div>
      </SimplifierPanel>
    );

    const panel = container.firstChild as HTMLElement;
    expect(panel.className).toContain('w-64');
  });

  it('applies w-12 class when minimized', () => {
    const { container } = render(
      <SimplifierPanel
        isMinimized={true}
        onToggleMinimize={vi.fn()}
        isFocused={false}
        onFocusChange={vi.fn()}
      >
        <div>Simplifier Content</div>
      </SimplifierPanel>
    );

    const panel = container.firstChild as HTMLElement;
    expect(panel.className).toContain('w-12');
  });

  it('applies transition classes', () => {
    const { container } = render(
      <SimplifierPanel
        isMinimized={false}
        onToggleMinimize={vi.fn()}
        isFocused={false}
        onFocusChange={vi.fn()}
      >
        <div>Simplifier Content</div>
      </SimplifierPanel>
    );

    const panel = container.firstChild as HTMLElement;
    expect(panel.className).toContain('transition-all');
    expect(panel.className).toContain('duration-300');
    expect(panel.className).toContain('ease-in-out');
  });

  it('applies motion-reduce:transition-none class for reduced motion support', () => {
    const { container } = render(
      <SimplifierPanel
        isMinimized={false}
        onToggleMinimize={vi.fn()}
        isFocused={false}
        onFocusChange={vi.fn()}
      >
        <div>Simplifier Content</div>
      </SimplifierPanel>
    );

    const panel = container.firstChild as HTMLElement;
    expect(panel.className).toContain('motion-reduce:transition-none');
  });

  it('hides children when minimized', () => {
    render(
      <SimplifierPanel
        isMinimized={true}
        onToggleMinimize={vi.fn()}
        isFocused={false}
        onFocusChange={vi.fn()}
      >
        <div>Simplifier Content</div>
      </SimplifierPanel>
    );

    expect(screen.queryByText('Simplifier Content')).not.toBeInTheDocument();
  });

  it('shows children when maximized', () => {
    render(
      <SimplifierPanel
        isMinimized={false}
        onToggleMinimize={vi.fn()}
        isFocused={false}
        onFocusChange={vi.fn()}
      >
        <div>Simplifier Content</div>
      </SimplifierPanel>
    );

    expect(screen.getByText('Simplifier Content')).toBeInTheDocument();
  });

  it('sets aria-expanded to true when maximized', () => {
    const { container } = render(
      <SimplifierPanel
        isMinimized={false}
        onToggleMinimize={vi.fn()}
        isFocused={false}
        onFocusChange={vi.fn()}
      >
        <div>Simplifier Content</div>
      </SimplifierPanel>
    );

    const panel = container.firstChild as HTMLElement;
    expect(panel.getAttribute('aria-expanded')).toBe('true');
  });

  it('sets aria-expanded to false when minimized', () => {
    const { container } = render(
      <SimplifierPanel
        isMinimized={true}
        onToggleMinimize={vi.fn()}
        isFocused={false}
        onFocusChange={vi.fn()}
      >
        <div>Simplifier Content</div>
      </SimplifierPanel>
    );

    const panel = container.firstChild as HTMLElement;
    expect(panel.getAttribute('aria-expanded')).toBe('false');
  });

  it('uses vertical text orientation when minimized', () => {
    render(
      <SimplifierPanel
        isMinimized={true}
        onToggleMinimize={vi.fn()}
        isFocused={false}
        onFocusChange={vi.fn()}
      >
        <div>Simplifier Content</div>
      </SimplifierPanel>
    );

    const title = screen.getByText('Crisis Text Simplifier');
    expect(title.style.writingMode).toBe('vertical-rl');
  });

  it('uses normal text orientation when maximized', () => {
    render(
      <SimplifierPanel
        isMinimized={false}
        onToggleMinimize={vi.fn()}
        isFocused={false}
        onFocusChange={vi.fn()}
      >
        <div>Simplifier Content</div>
      </SimplifierPanel>
    );

    const title = screen.getByText('Crisis Text Simplifier');
    expect(title.style.writingMode).toBe('');
  });

  it('calls onToggleMinimize when toggle button is clicked', async () => {
    const user = userEvent.setup();
    const onToggleMinimize = vi.fn();

    render(
      <SimplifierPanel
        isMinimized={false}
        onToggleMinimize={onToggleMinimize}
        isFocused={false}
        onFocusChange={vi.fn()}
      >
        <div>Simplifier Content</div>
      </SimplifierPanel>
    );

    const toggleButton = screen.getByRole('button', { name: /minimize simplifier panel/i });
    await user.click(toggleButton);

    expect(onToggleMinimize).toHaveBeenCalledTimes(1);
  });

  it('applies opacity-40 when not focused and maximized', () => {
    const { container } = render(
      <SimplifierPanel
        isMinimized={false}
        onToggleMinimize={vi.fn()}
        isFocused={false}
        onFocusChange={vi.fn()}
      >
        <div>Simplifier Content</div>
      </SimplifierPanel>
    );

    const panel = container.firstChild as HTMLElement;
    expect(panel.className).toContain('opacity-40');
  });

  it('applies opacity-100 when focused and maximized', () => {
    const { container } = render(
      <SimplifierPanel
        isMinimized={false}
        onToggleMinimize={vi.fn()}
        isFocused={true}
        onFocusChange={vi.fn()}
      >
        <div>Simplifier Content</div>
      </SimplifierPanel>
    );

    const panel = container.firstChild as HTMLElement;
    expect(panel.className).toContain('opacity-100');
  });

  it('applies opacity-100 when minimized regardless of focus', () => {
    const { container } = render(
      <SimplifierPanel
        isMinimized={true}
        onToggleMinimize={vi.fn()}
        isFocused={false}
        onFocusChange={vi.fn()}
      >
        <div>Simplifier Content</div>
      </SimplifierPanel>
    );

    const panel = container.firstChild as HTMLElement;
    expect(panel.className).toContain('opacity-100');
  });
});
