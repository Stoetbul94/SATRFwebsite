import { render, screen } from './setup';
import RulesPage from '@/pages/rules';

jest.mock('next/router', () => ({
  useRouter: () => ({
    isReady: true,
    query: {},
    replace: jest.fn(),
    pathname: '/rules',
  }),
}));

jest.mock('@/components/layout/Layout', () => {
  return function MockLayout({ children }: { children: React.ReactNode }) {
    return <div>{children}</div>;
  };
});

describe('Rules page SSR content', () => {
  it('renders finder heading, ISSF authority, and F-Class separation', () => {
    render(<RulesPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('ISSF Rules & Rule Finder');
    expect(screen.getByText(/Official ISSF documentation remains authoritative/i)).toBeInTheDocument();
    expect(screen.queryByText(/All SATRF competitions follow ISSF rules/i)).not.toBeInTheDocument();
    expect(screen.getByText(/F-Class Open and F-TR are a separate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Search ISSF rifle rules/i)).toBeInTheDocument();
  });

  it('makes Second Print the primary Open and Download target', () => {
    render(<RulesPage />);
    const card = screen.getByTestId('current-rulebook');
    const open = card.querySelector('a[href$="second-print-07-2026-effective-1-july-2026.pdf"]');
    expect(open).toBeTruthy();
    expect(open).toHaveAttribute('target', '_blank');
    expect(open).not.toHaveAttribute('download');

    const download = card.querySelector('a[download]');
    expect(download).toHaveAttribute(
      'href',
      '/documents/issf/issf-rule-book-2026-edition-2025-second-print-07-2026-effective-1-july-2026.pdf',
    );
    expect(download).toHaveTextContent('Download PDF');
    expect(download?.getAttribute('href')).not.toContain('first-print');

    expect(card.querySelector('a[href="https://www.issf-sports.org/rules"]')).toHaveTextContent(
      'View on ISSF',
    );
  });

  it('labels First Print as archive, not the current download', () => {
    render(<RulesPage />);
    expect(screen.getByText('ARCHIVE / SUPERSEDED')).toBeInTheDocument();
    const current = screen.getByTestId('current-rulebook');
    expect(current.textContent).not.toMatch(/First Print/i);
  });
});
