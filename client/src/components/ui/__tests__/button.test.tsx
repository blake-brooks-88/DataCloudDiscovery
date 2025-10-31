import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const mockOnClick = vi.fn();

    render(<Button onClick={mockOnClick}>Click me</Button>);

    const button = screen.getByRole('button', { name: /click me/i });
    await user.click(button);

    expect(mockOnClick).toHaveBeenCalledOnce();
  });

  it('applies default variant styles', () => {
    render(<Button>Default Button</Button>);
    const button = screen.getByRole('button', { name: /default button/i });

    expect(button).toHaveClass('bg-primary');
    expect(button).toHaveClass('text-primary-foreground');
  });

  it('applies destructive variant styles', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole('button', { name: /delete/i });

    expect(button).toHaveClass('bg-destructive');
    expect(button).toHaveClass('text-destructive-foreground');
  });

  it('applies outline variant styles', () => {
    render(<Button variant="outline">Outline</Button>);
    const button = screen.getByRole('button', { name: /outline/i });

    expect(button).toHaveClass('border');
    expect(button).toHaveClass('bg-background');
  });

  it('applies secondary variant styles', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole('button', { name: /secondary/i });

    expect(button).toHaveClass('bg-secondary');
    expect(button).toHaveClass('text-secondary-foreground');
  });

  it('applies ghost variant styles', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const button = screen.getByRole('button', { name: /ghost/i });

    expect(button).toHaveClass('hover:bg-secondary-100');
  });

  it('applies link variant styles', () => {
    render(<Button variant="link">Link</Button>);
    const button = screen.getByRole('button', { name: /link/i });

    expect(button).toHaveClass('text-primary');
    expect(button).toHaveClass('underline-offset-4');
  });

  it('applies default size', () => {
    render(<Button>Default Size</Button>);
    const button = screen.getByRole('button', { name: /default size/i });

    expect(button).toHaveClass('h-10');
    expect(button).toHaveClass('px-4');
  });

  it('applies small size', () => {
    render(<Button size="sm">Small</Button>);
    const button = screen.getByRole('button', { name: /small/i });

    expect(button).toHaveClass('h-[36px]');
    expect(button).toHaveClass('px-3');
  });

  it('applies large size', () => {
    render(<Button size="lg">Large</Button>);
    const button = screen.getByRole('button', { name: /large/i });

    expect(button).toHaveClass('h-[44px]');
    expect(button).toHaveClass('px-8');
  });

  it('applies icon size', () => {
    render(
      <Button size="icon" aria-label="Icon button">
        🔍
      </Button>
    );
    const button = screen.getByRole('button', { name: /icon button/i });

    expect(button).toHaveClass('h-10');
    expect(button).toHaveClass('w-10');
  });

  it('respects disabled prop', async () => {
    const user = userEvent.setup();
    const mockOnClick = vi.fn();

    render(
      <Button disabled onClick={mockOnClick}>
        Disabled
      </Button>
    );

    const button = screen.getByRole('button', { name: /disabled/i });
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:opacity-50');

    await user.click(button);
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('has correct role attribute', () => {
    render(<Button>Button</Button>);
    const button = screen.getByRole('button');

    expect(button).toBeInTheDocument();
  });

  it('applies custom className alongside variant classes', () => {
    render(<Button className="custom-class">Custom</Button>);
    const button = screen.getByRole('button', { name: /custom/i });

    expect(button).toHaveClass('custom-class');
    expect(button).toHaveClass('bg-primary'); // Still has variant class
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();

    render(<Button ref={ref}>Ref Button</Button>);

    expect(ref).toHaveBeenCalled();
    expect(ref.mock.calls[0]?.[0]).toBeInstanceOf(HTMLButtonElement);
  });

  it('supports type attribute', () => {
    render(<Button type="submit">Submit</Button>);
    const button = screen.getByRole('button', { name: /submit/i });

    expect(button).toHaveAttribute('type', 'submit');
  });

  it('supports aria attributes', () => {
    render(<Button aria-label="Accessible button">🔔</Button>);
    const button = screen.getByRole('button', { name: /accessible button/i });

    expect(button).toHaveAttribute('aria-label', 'Accessible button');
  });

  it('combines variant and size props', () => {
    render(
      <Button variant="destructive" size="lg">
        Large Destructive
      </Button>
    );
    const button = screen.getByRole('button', { name: /large destructive/i });

    expect(button).toHaveClass('bg-destructive');
    expect(button).toHaveClass('h-[44px]');
    expect(button).toHaveClass('px-8');
  });

  it('renders with icon children', () => {
    render(
      <Button>
        <span>📧</span>
        Email
      </Button>
    );

    const button = screen.getByRole('button', { name: /email/i });
    expect(button).toBeInTheDocument();
    expect(button.textContent).toContain('📧');
    expect(button.textContent).toContain('Email');
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const mockOnClick = vi.fn();

    render(
      <Button disabled onClick={mockOnClick}>
        Disabled
      </Button>
    );

    const button = screen.getByRole('button', { name: /disabled/i });
    await user.click(button);

    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('has correct base classes for all buttons', () => {
    render(<Button>Base Classes</Button>);
    const button = screen.getByRole('button', { name: /base classes/i });

    expect(button).toHaveClass('inline-flex');
    expect(button).toHaveClass('items-center');
    expect(button).toHaveClass('justify-center');
    expect(button).toHaveClass('rounded-lg');
    expect(button).toHaveClass('font-medium');
  });
});
