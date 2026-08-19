import React from 'react';
import { render, screen } from './setup';
import About from '@/pages/about';
import ContactPage from '@/pages/contact';
import CoachingPage from '@/pages/coaching';
import SatrfHero from '@/components/home/hero/SatrfHero';
import { EVERGREEN_TICKER_ITEMS } from '@/components/home/hero/HeroTicker';

jest.mock('@/components/layout/Layout', () => {
  return function MockLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="layout">{children}</div>;
  };
});

jest.mock('@/components/home/hero/SatrfHero3DStage', () => {
  return function Mock3DStage() {
    return <div data-testid="hero-3d-stage" />;
  };
});

jest.mock('@/components/ContactForm', () => {
  return function MockContactForm() {
    return <form aria-label="Contact form" />;
  };
});

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

const PLACEHOLDERS = [
  '123 Shooting Range Road',
  '+27 (0)12 345 6789',
  '+27 (0) 11 123 4567',
  'ISSF Affiliated',
  'Sarah van der Merwe',
  'Michael Botha',
  'GAUTENG OPEN',
  'PROTEA TRIALS',
  'LA28',
];

function pageText(container: HTMLElement) {
  return container.textContent || '';
}

describe('public runtime content integrity', () => {
  it('does not publish high-confidence placeholders on About, Contact or Coaching', () => {
    const about = render(<About />);
    const aboutText = pageText(about.container);
    about.unmount();
    const contact = render(<ContactPage />);
    const contactText = pageText(contact.container);
    contact.unmount();
    const coaching = render(<CoachingPage />);
    const coachingText = pageText(coaching.container);
    const blob = `${aboutText}\n${contactText}\n${coachingText}`;

    for (const phrase of PLACEHOLDERS) {
      expect(blob).not.toContain(phrase);
    }
    expect(blob).not.toContain('clubs in every province');
    expect(blob).not.toContain('SATRF Headquarters');
  });

  it('hero copy no longer claims ISSF affiliation or nationwide clubs', () => {
    render(<SatrfHero />);
    expect(screen.queryByText(/ISSF Affiliated/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/clubs in every province/i)).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /The home of competitive target rifle shooting in South Africa/i
    );
    expect(
      screen.getByText(/support athletes pursuing national and international competition goals/i)
    ).toBeInTheDocument();
  });

  it('hero ticker uses evergreen topics, not fabricated events', () => {
    render(<SatrfHero />);
    expect(screen.queryByText(/GAUTENG OPEN/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/PROTEA TRIALS/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/BEGINNER INTRO DAYS/i)).not.toBeInTheDocument();
    expect(EVERGREEN_TICKER_ITEMS.map((item) => item.text)).toEqual([
      'TARGET RIFLE',
      'PRONE',
      '3-POSITION',
      'F-CLASS',
      'EVENTS',
      'SCORES',
      'COACHING',
    ]);
    expect(screen.getAllByText('PRONE').length).toBeGreaterThan(0);
  });
});
