import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import AnalyticsDashboard from '../../components/analytics/AnalyticsDashboard';

const mockAnalyticsPayload = {
  summary: {
    totalMatches: 18,
    totalScore: 1647,
    averageScore: 91.5,
    personalBest: 98,
    totalXCount: 105,
    averageXCount: 5.8,
    improvementRate: 3.2,
    consistencyScore: 85.4,
  },
  scoreHistory: [],
  disciplineStats: [],
  performanceTrends: [],
  eventParticipation: [],
};

// jest.setup sets NODE_ENV=test — use mocked API path (avoids AnalyticsDashboard's 1s dev setTimeout).
jest.mock('../../lib/analytics', () => ({
  analyticsAPI: {
    getUserAnalytics: jest.fn(),
    exportAnalytics: jest.fn().mockResolvedValue(new Blob(['test'], { type: 'text/csv' })),
  },
  analyticsUtils: {
    generateMockAnalytics: jest.fn().mockReturnValue({
      scoreHistory: [],
      disciplineStats: [],
      performanceTrends: [],
      eventParticipation: [],
      summary: {
        totalMatches: 18,
        totalScore: 1647,
        averageScore: 91.5,
        personalBest: 98,
        totalXCount: 105,
        averageXCount: 5.8,
        improvementRate: 3.2,
        consistencyScore: 85.4,
      },
    }),
    formatDate: jest.fn((date) => new Date(date).toLocaleDateString()),
    getDisciplineColor: jest.fn(() => '#3B82F6'),
    getPerformanceLevel: jest.fn(() => ({ level: 'Good', color: '#F59E0B' })),
  },
}));

jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

jest.mock('react-icons/fa', () => ({
  FaDownload: () => <div data-testid="download-icon" />,
  FaRedo: () => <div data-testid="refresh-icon" />,
  FaEye: () => <div data-testid="eye-icon" />,
  FaEyeSlash: () => <div data-testid="eye-slash-icon" />,
}));

function setupMockAPI() {
  const { analyticsAPI } = require('../../lib/analytics');
  analyticsAPI.getUserAnalytics.mockImplementation(() =>
    Promise.resolve(mockAnalyticsPayload),
  );
}

const LOADED_TIMEOUT = { timeout: 5000 };

describe('AnalyticsDashboard Simple Tests', () => {
  beforeEach(() => {
    setupMockAPI();
  });

  it('renders loading state initially', () => {
    const { analyticsAPI } = require('../../lib/analytics');
    analyticsAPI.getUserAnalytics.mockImplementation(() => new Promise(() => {}));

    render(<AnalyticsDashboard />);
    expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
  });

  it('renders analytics dashboard after loading', async () => {
    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.queryByText('Loading analytics...')).not.toBeInTheDocument();
      expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
    }, LOADED_TIMEOUT);
  });

  it('displays summary statistics', async () => {
    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.queryByText('Loading analytics...')).not.toBeInTheDocument();
      expect(screen.getByText('Total Matches')).toBeInTheDocument();
      expect(screen.getByText('18')).toBeInTheDocument();
      expect(screen.getByText('Personal Best')).toBeInTheDocument();
      expect(screen.getByText('98')).toBeInTheDocument();
    }, LOADED_TIMEOUT);
  });

  it('shows navigation tabs', async () => {
    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.queryByText('Loading analytics...')).not.toBeInTheDocument();
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Scores')).toBeInTheDocument();
      expect(screen.getByText('Disciplines')).toBeInTheDocument();
      expect(screen.getByText('Trends')).toBeInTheDocument();
    }, LOADED_TIMEOUT);
  });
});
