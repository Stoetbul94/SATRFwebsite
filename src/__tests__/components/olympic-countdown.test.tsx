import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import OlympicCountdown from '../../components/OlympicCountdown';

// Mock the current date to test countdown functionality
const mockDate = new Date('2024-01-01T12:00:00Z');
const originalDate = global.Date;

beforeEach(() => {
  // Reset to a date before Olympics for most tests
  global.Date = class extends Date {
    constructor() {
      return mockDate;
    }
  } as DateConstructor;
});

afterEach(() => {
  global.Date = originalDate;
});

describe('OlympicCountdown Component', () => {
  it('renders component successfully', () => {
    render(<OlympicCountdown />);
    
    // Component should render without crashing
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  it('displays countdown numbers', () => {
    render(<OlympicCountdown />);
    
    // The countdown should show numbers (even if they're 00)
    const timeElements = screen.getAllByText(/\d{2}/);
    expect(timeElements.length).toBeGreaterThan(0);
  });

  it('shows festive message when Olympics have started', () => {
    // Mock a date after the Olympics start
    const futureDate = new Date('2028-08-01T12:00:00Z');
    global.Date = class extends Date {
      constructor() {
        return futureDate;
      }
    } as DateConstructor;

    render(<OlympicCountdown />);
    
    expect(screen.getByText('🎉 The Olympics Have Begun! 🎉')).toBeInTheDocument();
    expect(screen.getByText(/Go Team South Africa/)).toBeInTheDocument();
    
    // Reset the date mock
    global.Date = originalDate;
  });

  it('has proper semantic structure', () => {
    render(<OlympicCountdown />);
    
    // Check if the section has proper semantic structure
    const section = screen.getByRole('heading');
    expect(section).toBeInTheDocument();
  });
}); 