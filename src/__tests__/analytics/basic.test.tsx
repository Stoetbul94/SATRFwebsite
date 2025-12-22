import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Simple test component
const TestComponent = () => {
  return <div data-testid="test-component">Test Component</div>;
};

describe('Basic Test', () => {
  it('renders a simple component', () => {
    render(<TestComponent />);
    expect(screen.getByTestId('test-component')).toBeInTheDocument();
    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });

  it('handles basic assertions', () => {
    expect(1 + 1).toBe(2);
    expect('hello').toBe('hello');
  });
}); 