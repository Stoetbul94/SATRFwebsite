import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/router';
import Results from '../pages/results';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock the Layout component
jest.mock('../components/layout/Layout', () => {
  return function MockLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="layout">{children}</div>;
  };
});

// Mock fetch
global.fetch = jest.fn();

describe('Results Page', () => {
  const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      route: '/results',
      pathname: '/results',
      query: {},
      asPath: '/results',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
      isLocaleDomain: false,
      isReady: true,
      defaultLocale: 'en',
      domainLocales: [],
      isPreview: false,
    });

    (fetch as jest.Mock).mockClear();
  });

  it('renders the results page with header', () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: [],
      }),
    });

    render(<Results />);
    
    expect(screen.getByText('Match Results')).toBeInTheDocument();
    expect(screen.getByText('View and filter competition results by event and match number')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<Results />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('displays results when API call succeeds', async () => {
    const mockResults = [
      {
        event: 'Prone Match 1',
        matchNumber: 1,
        results: [
          {
            id: '1',
            place: 1,
            name: 'John Smith',
            club: 'SATRF Club A',
            division: 'Senior',
            veteran: false,
            series1: 98,
            series2: 99,
            series3: 97,
            series4: 100,
            series5: 98,
            series6: 99,
            total: 591,
            isPersonalBest: true,
            isMatchBest: true,
          },
        ],
      },
    ];

    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: mockResults,
      }),
    });

    render(<Results />);

    await waitFor(() => {
      expect(screen.getByText('Prone Match 1 - Match 1')).toBeInTheDocument();
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('SATRF Club A')).toBeInTheDocument();
      expect(screen.getByText('591')).toBeInTheDocument();
    });
  });

  it('shows no results message when API returns empty data', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: [],
      }),
    });

    render(<Results />);

    await waitFor(() => {
      expect(screen.getByText('No results found')).toBeInTheDocument();
      expect(screen.getByText('No match results are available for the selected filters.')).toBeInTheDocument();
    });
  });

  it('filters results by event', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: [],
      }),
    });

    render(<Results />);

    const eventSelect = screen.getByLabelText('Event');
    fireEvent.change(eventSelect, { target: { value: 'Prone Match 1' } });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/results?event=Prone%20Match%201');
    });
  });

  it('filters results by match number', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: [],
      }),
    });

    render(<Results />);

    const matchSelect = screen.getByLabelText('Match Number');
    fireEvent.change(matchSelect, { target: { value: '2' } });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/results?match=2');
    });
  });

  it('clears filters when clear button is clicked', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: [],
      }),
    });

    render(<Results />);

    const clearButton = screen.getByText('Clear Filters');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/results?');
    });
  });

  it('handles API errors gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<Results />);

    await waitFor(() => {
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });
  });

  it('displays veteran badge for veteran shooters', async () => {
    const mockResults = [
      {
        event: 'Prone Match 1',
        matchNumber: 1,
        results: [
          {
            id: '1',
            place: 1,
            name: 'Mike Brown',
            club: 'SATRF Club C',
            division: 'Veteran',
            veteran: true,
            series1: 96,
            series2: 97,
            series3: 95,
            series4: 98,
            series5: 96,
            series6: 97,
            total: 579,
            isPersonalBest: true,
            isMatchBest: false,
          },
        ],
      },
    ];

    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: mockResults,
      }),
    });

    render(<Results />);

    await waitFor(() => {
      expect(screen.getByText('Veteran')).toBeInTheDocument();
    });
  });

  it('highlights personal best scores', async () => {
    const mockResults = [
      {
        event: 'Prone Match 1',
        matchNumber: 1,
        results: [
          {
            id: '1',
            place: 1,
            name: 'John Smith',
            club: 'SATRF Club A',
            division: 'Senior',
            veteran: false,
            series1: 98,
            series2: 99,
            series3: 97,
            series4: 100,
            series5: 98,
            series6: 99,
            total: 591,
            isPersonalBest: true,
            isMatchBest: true,
          },
        ],
      },
    ];

    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: mockResults,
      }),
    });

    render(<Results />);

    await waitFor(() => {
      const totalCell = screen.getByText('591');
      expect(totalCell).toHaveClass('font-bold', 'text-green-600', 'bg-green-50');
    });
  });

  it('shows legend for score highlighting', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: [],
      }),
    });

    render(<Results />);

    await waitFor(() => {
      expect(screen.getByText('Match Best')).toBeInTheDocument();
      expect(screen.getByText('Personal Best')).toBeInTheDocument();
    });
  });
}); 