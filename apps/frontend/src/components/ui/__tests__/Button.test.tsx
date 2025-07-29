/**
 * Button Component Test Suite
 * Tests for the reusable Button UI component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies variant classes correctly', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    let button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary');

    rerender(<Button variant="secondary">Secondary</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('bg-secondary');

    rerender(<Button variant="outline">Outline</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('border-border');

    rerender(<Button variant="ghost">Ghost</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('hover:bg-accent');

    rerender(<Button variant="destructive">Destructive</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('bg-destructive');
  });

  it('applies size classes correctly', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    let button = screen.getByRole('button');
    expect(button).toHaveClass('h-8', 'px-3', 'text-sm');

    rerender(<Button size="md">Medium</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('h-9', 'px-4', 'text-sm');

    rerender(<Button size="lg">Large</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('h-10', 'px-6', 'text-base');
  });

  it('shows loading state correctly', () => {
    render(<Button loading>Loading</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    
    // Should show loading spinner
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toBeInTheDocument();
  });

  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('renders left icon when provided', () => {
    const TestIcon = () => <span data-testid="test-icon">Icon</span>;
    render(<Button leftIcon={<TestIcon />}>With Icon</Button>);
    
    const icon = screen.getByTestId('test-icon');
    expect(icon).toBeInTheDocument();
    
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('With Icon');
  });

  it('renders right icon when provided', () => {
    const TestIcon = () => <span data-testid="test-icon">Icon</span>;
    render(<Button rightIcon={<TestIcon />}>With Icon</Button>);
    
    const icon = screen.getByTestId('test-icon');
    expect(icon).toBeInTheDocument();
    
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('With Icon');
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref Button</Button>);
    
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current?.textContent).toBe('Ref Button');
  });

  it('prevents click when loading', () => {
    const handleClick = jest.fn();
    render(<Button loading onClick={handleClick}>Loading</Button>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('prevents click when disabled', () => {
    const handleClick = jest.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders as different element when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test');
    expect(link).toHaveClass('inline-flex'); // Button classes should be applied
  });

  it('supports keyboard navigation', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Keyboard</Button>);
    
    const button = screen.getByRole('button');
    button.focus();
    
    expect(button).toHaveFocus();
    
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalledTimes(1);
    
    fireEvent.keyDown(button, { key: ' ' });
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it('has correct accessibility attributes', () => {
    render(<Button aria-label="Custom label">Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Custom label');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('renders full width when fullWidth prop is true', () => {
    render(<Button fullWidth>Full Width</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('w-full');
  });

  describe('Button variants visual regression', () => {
    it('matches snapshot for all variants', () => {
      const variants = ['primary', 'secondary', 'outline', 'ghost', 'destructive'] as const;
      
      variants.forEach(variant => {
        const { container } = render(<Button variant={variant}>{variant}</Button>);
        expect(container.firstChild).toMatchSnapshot(`button-${variant}`);
      });
    });

    it('matches snapshot for all sizes', () => {
      const sizes = ['sm', 'md', 'lg'] as const;
      
      sizes.forEach(size => {
        const { container } = render(<Button size={size}>{size}</Button>);
        expect(container.firstChild).toMatchSnapshot(`button-${size}`);
      });
    });

    it('matches snapshot for loading state', () => {
      const { container } = render(<Button loading>Loading</Button>);
      expect(container.firstChild).toMatchSnapshot('button-loading');
    });

    it('matches snapshot for disabled state', () => {
      const { container } = render(<Button disabled>Disabled</Button>);
      expect(container.firstChild).toMatchSnapshot('button-disabled');
    });
  });
});
