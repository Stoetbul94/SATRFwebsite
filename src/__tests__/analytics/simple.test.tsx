import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AnalyticsDashboard from '../../components/analytics/AnalyticsDashboard';

// Simple mock for analytics API
jest.mock('../../lib/analytics', () => ({
  analyticsAPI: {
    getUserAnalytics: jest.fn().mockResolvedValue({
      scoreHistory: [
        {
          date: '2024-01-15',
          score: 95,
          xCount: 8,
          eventName: 'SATRF Championship',
          discipline: '3P',
          position: 3,
          totalParticipants: 25
        }
      ],
      disciplineStats: [
        {
          discipline: '3P',
          totalMatches: 8,
          averageScore: 91.5,
          personalBest: 98,
          totalXCount: 45,
          averageXCount: 5.6,
          bestScoreDate: '2024-03-05',
          bestScoreEvent: 'Regional Match'
        }
      ],
      performanceTrends: [
        { period: 'week', averageScore: 92.5, totalMatches: 2, totalXCount: 12, improvement: 2.1 }
      ],
      eventParticipation: [],
      summary: {
        totalMatches: 18,
        totalScore: 1647,
        averageScore: 91.5,
        personalBest: 98,
        totalXCount: 105,
        averageXCount: 5.8,
        improvementRate: 3.2,
        consistencyScore: 85.4
      }
    }),
    exportAnalytics: jest.fn().mockResolvedValue(new Blob(['test'], { type: 'text/csv' })),
  },
  analyticsUtils: {
    generateMockAnalytics: jest.fn().mockReturnValue({
      scoreHistory: [],
      disciplineStats: [],
      performanceTrends: [],
      eventParticipation: [],
      summary: {
        totalMatches: 0,
        totalScore: 0,
        averageScore: 0,
        personalBest: 0,
        totalXCount: 0,
        averageXCount: 0,
        improvementRate: 0,
        consistencyScore: 0
      }
    }),
    formatDate: jest.fn((date) => new Date(date).toLocaleDateString()),
    getDisciplineColor: jest.fn(() => '#3B82F6'),
    getPerformanceLevel: jest.fn(() => ({ level: 'Good', color: '#F59E0B' })),
  },
}));

// Mock Recharts components
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
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
}));

// Mock react-icons
jest.mock('react-icons/fa', () => ({
  FaDownload: () => <div data-testid="download-icon" />,
  FaRedo: () => <div data-testid="refresh-icon" />,
  FaEye: () => <div data-testid="eye-icon" />,
  FaEyeSlash: () => <div data-testid="eye-slash-icon" />,
}));

describe('AnalyticsDashboard Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<AnalyticsDashboard />);
    
    expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
  });

  it('renders analytics dashboard after loading', async () => {
    render(<AnalyticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
    });
  });

  it('displays summary statistics', async () => {
    render(<AnalyticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Total Matches')).toBeInTheDocument();
      expect(screen.getByText('18')).toBeInTheDocument();
      expect(screen.getByText('Personal Best')).toBeInTheDocument();
      expect(screen.getByText('98')).toBeInTheDocument();
    });
  });

  it('shows navigation tabs', async () => {
    render(<AnalyticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Scores')).toBeInTheDocument();
      expect(screen.getByText('Disciplines')).toBeInTheDocument();
      expect(screen.getByText('Trends')).toBeInTheDocument();
    });
  });
}); 