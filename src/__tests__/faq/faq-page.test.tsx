import React from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen } from '../setup';
import FaqPage from '@/pages/faq';
import { FAQ_H1, faqItems, inlineToText } from '@/data/faq';

jest.mock('@/components/layout/Layout', () => {
  return function MockLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="layout">{children}</div>;
  };
});

describe('FAQ page', () => {
  it('renders H1, groups, and every configured question with answers in HTML', () => {
    render(<FaqPage />);
    expect(screen.getByRole('heading', { level: 1, name: FAQ_H1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'About SATRF' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Rifle Disciplines' })).toBeInTheDocument();
    faqItems.forEach((item) => {
      expect(screen.getByRole('heading', { level: 3, name: item.question })).toBeInTheDocument();
      const answer = document.getElementById(`${item.id}-answer`);
      expect(answer?.textContent).toContain(inlineToText(item.paragraphs[0]));
    });
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
  });

  it('exposes accordion summaries and keeps answers in the document', async () => {
    const user = userEvent.setup();
    render(<FaqPage />);
    const summaries = document.querySelectorAll('summary');
    expect(summaries.length).toBe(faqItems.length);
    const first = summaries[0] as HTMLElement;
    await user.click(first);
    expect(first.closest('details')).toHaveAttribute('open');
    expect(screen.getByRole('link', { name: 'Events calendar' })).toHaveAttribute(
      'href',
      '/events/calendar'
    );
  });
});
