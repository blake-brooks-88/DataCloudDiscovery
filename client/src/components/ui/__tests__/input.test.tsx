import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../input';

describe('Input', () => {
  it('renders with correct type attribute', () => {
    render(<Input type="text" aria-label="Text input" />);
    const input = screen.getByRole('textbox');

    expect(input).toHaveAttribute('type', 'text');
  });

  it('renders with email type', () => {
    render(<Input type="email" aria-label="Email input" />);
    const input = screen.getByLabelText(/email input/i);

    expect(input).toHaveAttribute('type', 'email');
  });

  it('renders with password type', () => {
    render(<Input type="password" aria-label="Password input" />);
    const input = screen.getByLabelText(/password input/i);

    expect(input).toHaveAttribute('type', 'password');
  });

  it('renders with number type', () => {
    render(<Input type="number" aria-label="Number input" />);
    const input = screen.getByLabelText(/number input/i);

    expect(input).toHaveAttribute('type', 'number');
  });

  it('handles onChange events', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();

    render(<Input type="text" onChange={mockOnChange} aria-label="Text input" />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'Hello');

    expect(mockOnChange).toHaveBeenCalled();
    expect(input).toHaveValue('Hello');
  });

  it('reflects value prop', () => {
    render(<Input type="text" value="Test value" onChange={vi.fn()} aria-label="Text input" />);
    const input = screen.getByRole('textbox');

    expect(input).toHaveValue('Test value');
  });

  it('handles controlled input', async () => {
    const user = userEvent.setup();
    const TestComponent = () => {
      const [value, setValue] = React.useState('');

      return (
        <Input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label="Text input"
        />
      );
    };

    render(<TestComponent />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'New');

    expect(input).toHaveValue('New');
  });

  it('respects disabled prop', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();

    render(<Input type="text" disabled onChange={mockOnChange} aria-label="Text input" />);

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled:opacity-50');

    await user.type(input, 'Test');
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('respects readonly prop', () => {
    render(<Input type="text" readOnly value="Read only" aria-label="Text input" />);
    const input = screen.getByRole('textbox');

    expect(input).toHaveAttribute('readonly');
    expect(input).toHaveValue('Read only');
  });

  it('applies custom className', () => {
    render(<Input type="text" className="custom-input" aria-label="Text input" />);
    const input = screen.getByRole('textbox');

    expect(input).toHaveClass('custom-input');
    expect(input).toHaveClass('border'); // Still has base class
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();

    render(<Input type="text" ref={ref} aria-label="Text input" />);

    expect(ref).toHaveBeenCalled();
    expect(ref.mock.calls[0]?.[0]).toBeInstanceOf(HTMLInputElement);
  });

  it('supports placeholder attribute', () => {
    render(<Input type="text" placeholder="Enter text here" aria-label="Text input" />);
    const input = screen.getByPlaceholderText(/enter text here/i);

    expect(input).toBeInTheDocument();
  });

  it('supports required attribute', () => {
    render(<Input type="text" required aria-label="Text input" />);
    const input = screen.getByRole('textbox');

    expect(input).toBeRequired();
  });

  it('supports maxLength attribute', () => {
    render(<Input type="text" maxLength={10} aria-label="Text input" />);
    const input = screen.getByRole('textbox');

    expect(input).toHaveAttribute('maxLength', '10');
  });

  it('supports minLength attribute', () => {
    render(<Input type="text" minLength={3} aria-label="Text input" />);
    const input = screen.getByRole('textbox');

    expect(input).toHaveAttribute('minLength', '3');
  });

  it('supports pattern attribute', () => {
    render(<Input type="text" pattern="[A-Za-z]+" aria-label="Text input" />);
    const input = screen.getByRole('textbox');

    expect(input).toHaveAttribute('pattern', '[A-Za-z]+');
  });

  it('supports aria-label for accessibility', () => {
    render(<Input type="text" aria-label="Accessible input" />);
    const input = screen.getByLabelText(/accessible input/i);

    expect(input).toBeInTheDocument();
  });

  it('supports aria-describedby for accessibility', () => {
    render(
      <>
        <Input type="text" aria-describedby="help-text" aria-label="Text input" />
        <span id="help-text">Help text</span>
      </>
    );
    const input = screen.getByRole('textbox');

    expect(input).toHaveAttribute('aria-describedby', 'help-text');
  });

  it('has correct base classes', () => {
    render(<Input type="text" aria-label="Text input" />);
    const input = screen.getByRole('textbox');

    expect(input).toHaveClass('h-10');
    expect(input).toHaveClass('w-full');
    expect(input).toHaveClass('rounded-md');
    expect(input).toHaveClass('border');
    expect(input).toHaveClass('px-3');
    expect(input).toHaveClass('py-2');
  });

  it('handles onFocus event', async () => {
    const user = userEvent.setup();
    const mockOnFocus = vi.fn();

    render(<Input type="text" onFocus={mockOnFocus} aria-label="Text input" />);

    const input = screen.getByRole('textbox');
    await user.click(input);

    expect(mockOnFocus).toHaveBeenCalledOnce();
  });

  it('handles onBlur event', async () => {
    const user = userEvent.setup();
    const mockOnBlur = vi.fn();

    render(<Input type="text" onBlur={mockOnBlur} aria-label="Text input" />);

    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.tab(); // Tab away to blur

    expect(mockOnBlur).toHaveBeenCalledOnce();
  });

  it('supports defaultValue for uncontrolled input', () => {
    render(<Input type="text" defaultValue="Default text" aria-label="Text input" />);
    const input = screen.getByRole('textbox');

    expect(input).toHaveValue('Default text');
  });

  it('handles file input type', () => {
    render(<Input type="file" aria-label="File input" />);
    const input = screen.getByLabelText(/file input/i);

    expect(input).toHaveAttribute('type', 'file');
  });
});
