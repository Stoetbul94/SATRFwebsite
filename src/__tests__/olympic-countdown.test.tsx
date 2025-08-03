import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OlympicCountdown from '../components/OlympicCountdown';

// Mock the date to ensure consistent testing
const mockDate = new Date('2024-01-01T12:00:00Z');
const originalDate = global.Date;

beforeAll(() => {
  global.Date = class extends Date {
    constructor() {
      return mockDate;
    }
  } as DateConstructor;
});

afterAll(() => {
  global.Date = originalDate;
});

describe('OlympicCountdown', () => {
  it('renders the countdown component', () => {
    render(<OlympicCountdown />);
    
    expect(screen.getByText('Countdown to the 2028 Olympics')).toBeInTheDocument();
    expect(screen.getByText(/The Olympic Games begin on July 21, 2028/)).toBeInTheDocument();
  });

  it('displays countdown numbers in rings', () => {
    render(<OlympicCountdown />);
    
    // Check that countdown numbers are displayed
    expect(screen.getByText('Days')).toBeInTheDocument();
    expect(screen.getByText('Hours')).toBeInTheDocument();
    expect(screen.getByText('Minutes')).toBeInTheDocument();
    expect(screen.getByText('Seconds')).toBeInTheDocument();
  });

  it('renders with fifth ring when showFifthRing is true', () => {
    render(
      <OlympicCountdown 
        showFifthRing={true}
        fifthRingContent={<div data-testid="fifth-ring-content">🇿🇦</div>}
      />
    );
    
    expect(screen.getByTestId('fifth-ring-content')).toBeInTheDocument();
  });

  it('does not render fifth ring by default', () => {
    render(<OlympicCountdown />);
    
    // The fifth ring should not be visible by default
    expect(screen.queryByText('Logo')).not.toBeInTheDocument();
  });

  it('displays target shooting events information', () => {
    render(<OlympicCountdown />);
    
    expect(screen.getByText(/Target Shooting Events: July 27 - August 5, 2028/)).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<OlympicCountdown />);
    
    const svg = screen.getByLabelText('Olympic rings countdown timer');
    expect(svg).toBeInTheDocument();
  });

  it('updates countdown every second', async () => {
    render(<OlympicCountdown />);
    
    // Wait for the component to update
    await waitFor(() => {
      // The countdown should be running
      expect(screen.getByText('Days')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('displays Olympic celebration when countdown reaches zero', () => {
    // Mock date to be after Olympics start
    const pastDate = new Date('2028-07-22T12:00:00Z');
    global.Date = class extends Date {
      constructor() {
        return pastDate;
      }
    } as DateConstructor;

    render(<OlympicCountdown />);
    
    expect(screen.getByText('🎉 The Olympics Have Begun! 🎉')).toBeInTheDocument();
    expect(screen.getByText(/The 2028 Olympic Games are now in full swing/)).toBeInTheDocument();
  });
}); 