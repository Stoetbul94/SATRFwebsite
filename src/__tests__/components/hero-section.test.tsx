import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/router';
import HeroSection from '@/components/home/HeroSection';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

const mockPush = jest.fn();

describe('HeroSection', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the main headline with correct text', () => {
    render(<HeroSection />);
    
    const headline = screen.getByText('South African Target Rifle Federation');
    expect(headline).toBeInTheDocument();
    expect(headline.tagName).toBe('H1');
  });

  it('renders the subtitle text', () => {
    render(<HeroSection />);
    
    const subtitle = screen.getByText(/Promoting excellence in target rifle shooting/);
    expect(subtitle).toBeInTheDocument();
  });

  it('renders both CTA buttons', () => {
    render(<HeroSection />);
    
    const joinButton = screen.getByText('Join SATRF');
    const eventsButton = screen.getByText('View Events');
    
    expect(joinButton).toBeInTheDocument();
    expect(eventsButton).toBeInTheDocument();
  });

  it('navigates to register page when Join SATRF button is clicked', () => {
    render(<HeroSection />);
    
    const joinButton = screen.getByText('Join SATRF');
    fireEvent.click(joinButton);
    
    expect(mockPush).toHaveBeenCalledWith('/register');
  });

  it('navigates to events page when View Events button is clicked', () => {
    render(<HeroSection />);
    
    const eventsButton = screen.getByText('View Events');
    fireEvent.click(eventsButton);
    
    expect(mockPush).toHaveBeenCalledWith('/events');
  });

  it('has the correct CSS classes for styling', () => {
    render(<HeroSection />);
    
    const section = document.querySelector('section');
    expect(section).toHaveClass('relative', 'h-screen', 'w-full', 'overflow-hidden');
  });

  it('applies Oxanium font to the headline', () => {
    render(<HeroSection />);
    
    const headline = screen.getByText('South African Target Rifle Federation');
    expect(headline).toHaveClass('font-oxanium');
  });

  it('has the marquee animation elements', () => {
    render(<HeroSection />);
    
    const marqueeElements = document.querySelectorAll('.animate-marquee');
    expect(marqueeElements.length).toBeGreaterThan(0);
  });

  it('has the scroll indicator', () => {
    render(<HeroSection />);
    
    const scrollIndicator = document.querySelector('.w-6.h-10');
    expect(scrollIndicator).toBeInTheDocument();
  });

  it('has ambient effect elements', () => {
    render(<HeroSection />);
    
    const ambientElements = document.querySelectorAll('.animate-pulse');
    expect(ambientElements.length).toBeGreaterThan(0);
  });

  it('applies neon glow effects to the headline', () => {
    render(<HeroSection />);
    
    const headline = screen.getByText('South African Target Rifle Federation');
    expect(headline).toHaveClass('animate-glow-pulse');
  });

  it('has responsive text sizing classes', () => {
    render(<HeroSection />);
    
    const headline = screen.getByText('South African Target Rifle Federation');
    expect(headline).toHaveClass('text-4xl', 'md:text-6xl', 'lg:text-7xl', 'xl:text-8xl');
  });

  it('has GPU-accelerated transforms', () => {
    render(<HeroSection />);
    
    const headline = screen.getByText('South African Target Rifle Federation');
    expect(headline).toHaveClass('transform-gpu');
  });
}); 