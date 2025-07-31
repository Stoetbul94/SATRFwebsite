import React from 'react'
import { render, screen } from '@testing-library/react'

// Simple test component
const TestComponent = () => {
  return <div data-testid="test-component">Hello World</div>
}

describe('Basic Test', () => {
  it('should render a simple component', () => {
    render(<TestComponent />)
    expect(screen.getByTestId('test-component')).toBeInTheDocument()
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('should have proper test environment', () => {
    expect(typeof window).toBe('object')
    expect(typeof document).toBe('object')
  })
}) 