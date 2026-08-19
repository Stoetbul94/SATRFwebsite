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
});
