import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeedPanelWrapper } from '../../components/FeedPanelWrapper';

describe('FeedPanelWrapper', () => {
  it('renders with maximized state by default', () => {
    render(
      <FeedPanelWrapper isMinimized={false} onToggleMinimize={vi.fn()}>
        <div>Feed Content</div>
      </FeedPanelWrapper>
    );

    expect(screen.getByText('Crisis Feed')).toBeInTheDocument();
    expect(screen.getByText('Feed Content')).toBeInTheDocument();
  });

  it('applies w-64 class when maximized', () => {
    const { container } = render(
      <FeedPanelWrapper isMinimized={false} onToggleMinimize={vi.fn()}>
        <div>Feed Content</div>
      </FeedPanelWrapper>
    );

    const panel = container.firstChild as HTMLElement;
    expect(panel.className).toContain('w-64');
  });

  it('applies w-12 class when minimized', () => {
    const { container } = render(
      <FeedPanelWrapper isMinimized={true} onToggleMinimize={vi.fn()}>
        <div>Feed Content</div>
      </FeedPanelWrapper>
    );

    const panel = container.firstChild as HTMLElement;
    expect(panel.className).toContain('w-12');
  });

  it('applies transition classes', () => {
    const { container } = render(
      <FeedPanelWrapper isMinimized={false} onToggleMinimize={vi.fn()}>
        <div>Feed Content</div>
      </FeedPanelWrapper>
    );

    const panel = container.firstChild as HTMLElement;
    expect(panel.className).toContain('transition-all');
    expect(panel.className).toContain('duration-300');
    expect(panel.className).toContain('ease-in-out');
  });

  it('hides children when minimized', () => {
    render(
      <FeedPanelWrapper isMinimized={true} onToggleMinimize={vi.fn()}>
        <div>Feed Content</div>
      </FeedPanelWrapper>
    );

    expect(screen.queryByText('Feed Content')).not.toBeInTheDocument();
  });

  it('shows children when maximized', () => {
    render(
      <FeedPanelWrapper isMinimized={false} onToggleMinimize={vi.fn()}>
        <div>Feed Content</div>
      </FeedPanelWrapper>
    );

    expect(screen.getByText('Feed Content')).toBeInTheDocument();
  });

  it('sets aria-expanded to true when maximized', () => {
    const { container } = render(
      <FeedPanelWrapper isMinimized={false} onToggleMinimize={vi.fn()}>
        <div>Feed Content</div>
      </FeedPanelWrapper>
    );

    const panel = container.firstChild as HTMLElement;
    expect(panel.getAttribute('aria-expanded')).toBe('true');
  });

  it('sets aria-expanded to false when minimized', () => {
    const { container } = render(
      <FeedPanelWrapper isMinimized={true} onToggleMinimize={vi.fn()}>
        <div>Feed Content</div>
      </FeedPanelWrapper>
    );

    const panel = container.firstChild as HTMLElement;
    expect(panel.getAttribute('aria-expanded')).toBe('false');
  });

  it('uses vertical text orientation when minimized', () => {
    render(
      <FeedPanelWrapper isMinimized={true} onToggleMinimize={vi.fn()}>
        <div>Feed Content</div>
      </FeedPanelWrapper>
    );

    const title = screen.getByText('Crisis Feed');
    expect(title.style.writingMode).toBe('vertical-rl');
  });

  it('uses normal text orientation when maximized', () => {
    render(
      <FeedPanelWrapper isMinimized={false} onToggleMinimize={vi.fn()}>
        <div>Feed Content</div>
      </FeedPanelWrapper>
    );

    const title = screen.getByText('Crisis Feed');
    expect(title.style.writingMode).toBe('');
  });

  it('calls onToggleMinimize when toggle button is clicked', async () => {
    const user = userEvent.setup();
    const onToggleMinimize = vi.fn();

    render(
      <FeedPanelWrapper isMinimized={false} onToggleMinimize={onToggleMinimize}>
        <div>Feed Content</div>
      </FeedPanelWrapper>
    );

    const toggleButton = screen.getByRole('button', { name: /minimize feed panel/i });
    await user.click(toggleButton);

    expect(onToggleMinimize).toHaveBeenCalledTimes(1);
  });

  it('renders PanelToggleButton with correct props', () => {
    render(
      <FeedPanelWrapper isMinimized={false} onToggleMinimize={vi.fn()}>
        <div>Feed Content</div>
      </FeedPanelWrapper>
    );

    const toggleButton = screen.getByRole('button', { name: /minimize feed panel/i });
    expect(toggleButton).toBeInTheDocument();
  });
});
