import React from 'react';
import { render, screen } from '@testing-library/react';
import SatrfHero from '@/components/home/hero/SatrfHero';

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

jest.mock('@/components/home/hero/SatrfHero3DStage', () => {
  return function Mock3DStage() {
    return <div data-testid="hero-3d-stage" />;
  };
});

jest.mock('@chakra-ui/react', () => ({
  ...jest.requireActual('@chakra-ui/react'),
  usePrefersReducedMotion: () => false,
}));

describe('SatrfHero', () => {
  it('renders the locked H1 headline', () => {
    render(<SatrfHero />);
    const headline = screen.getByRole('heading', { level: 1 });
    expect(headline).toHaveTextContent(/The home of competitive target rifle shooting in South Africa/i);
  });

  it('renders the lede with SATRF and coaching link', () => {
    render(<SatrfHero />);
    expect(screen.getAllByText(/SATRF/).length).toBeGreaterThan(0);
    expect(screen.getByText(/develops the sport from first shot to final/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /coaching/i })).toHaveAttribute('href', '/coaching');
  });

  it('renders both CTAs with correct links', () => {
    render(<SatrfHero />);
    expect(screen.getByRole('link', { name: /Create an account/i })).toHaveAttribute(
      'href',
      '/register'
    );
    expect(screen.getByRole('link', { name: /Learn to shoot/i })).toHaveAttribute('href', '/coaching');
  });

  it('includes the 3D stage placeholder', () => {
    render(<SatrfHero />);
    expect(screen.getByTestId('hero-3d-stage')).toBeInTheDocument();
  });

  it('renders evergreen ticker topics instead of mock events', () => {
    render(<SatrfHero />);
    expect(screen.getAllByText(/TARGET RIFLE/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/F-CLASS/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/GAUTENG OPEN/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/PROTEA TRIALS/i)).not.toBeInTheDocument();
  });
});
