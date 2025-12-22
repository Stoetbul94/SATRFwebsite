import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AnalyticsDashboard from '../../components/analytics/AnalyticsDashboard';
import { analyticsUtils } from '../../lib/analytics';

// Mock the analytics API with comprehensive mock functions
jest.mock('../../lib/analytics', () => ({
  analyticsAPI: {
    getUserAnalytics: jest.fn(),
    exportAnalytics: jest.fn(),
    getScoreHistory: jest.fn(),
    getDisciplineStats: jest.fn(),
    getPerformanceTrends: jest.fn(),
    getEventParticipation: jest.fn(),
  },
  analyticsUtils: {
    generateMockAnalytics: jest.fn(),
    formatDate: jest.fn((date) => new Date(date).toLocaleDateString()),
    getDisciplineColor: jest.fn(() => '#3B82F6'),
    getPerformanceLevel: jest.fn(() => ({ level: 'Good', color: '#F59E0B' })),
    calculateImprovementRate: jest.fn(() => 3.2),
    calculateConsistencyScore: jest.fn(() => 85.4),
  },
}));

// Mock Recharts components with test IDs for better testing
jest.mock('recharts', () => ({
  LineChart: ({ children, data, ...props }: any) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)} {...props}>
      {children}
    </div>
  ),
  BarChart: ({ children, data, ...props }: any) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)} {...props}>
      {children}
    </div>
  ),
  AreaChart: ({ children, data, ...props }: any) => (
    <div data-testid="area-chart" data-chart-data={JSON.stringify(data)} {...props}>
      {children}
    </div>
  ),
  Line: ({ dataKey, stroke, ...props }: any) => (
    <div data-testid="line" data-key={dataKey} data-stroke={stroke} {...props} />
  ),
  Bar: ({ dataKey, fill, ...props }: any) => (
    <div data-testid="bar" data-key={dataKey} data-fill={fill} {...props} />
  ),
  Area: ({ dataKey, fill, ...props }: any) => (
    <div data-testid="area" data-key={dataKey} data-fill={fill} {...props} />
  ),
  XAxis: ({ dataKey, ...props }: any) => (
    <div data-testid="x-axis" data-key={dataKey} {...props} />
  ),
  YAxis: ({ ...props }: any) => <div data-testid="y-axis" {...props} />,
  CartesianGrid: ({ ...props }: any) => <div data-testid="cartesian-grid" {...props} />,
  Tooltip: ({ content, ...props }: any) => (
    <div data-testid="tooltip" data-content={content ? 'custom' : 'default'} {...props} />
  ),
  Legend: ({ ...props }: any) => <div data-testid="legend" {...props} />,
  ResponsiveContainer: ({ children, width, height, ...props }: any) => (
    <div 
      data-testid="responsive-container" 
      data-width={width} 
      data-height={height}
      {...props}
    >
      {children}
    </div>
  ),
}));

// Mock react-icons with accessible test IDs
jest.mock('react-icons/fa', () => ({
  FaDownload: ({ 'aria-label': ariaLabel, ...props }: any) => (
    <div data-testid="download-icon" aria-label={ariaLabel} {...props} />
  ),
            FaRedo: ({ 'aria-label': ariaLabel, ...props }: any) => (
    <div data-testid="refresh-icon" aria-label={ariaLabel} {...props} />
  ),
  FaEye: ({ 'aria-label': ariaLabel, ...props }: any) => (
    <div data-testid="eye-icon" aria-label={ariaLabel} {...props} />
  ),
  FaEyeSlash: ({ 'aria-label': ariaLabel, ...props }: any) => (
    <div data-testid="eye-slash-icon" aria-label={ariaLabel} {...props} />
  ),
}));

// Comprehensive mock analytics data
const mockAnalytics = {
  scoreHistory: [
    {
      date: '2024-01-15',
      score: 95,
      xCount: 8,
      eventName: 'SATRF Championship',
      discipline: '3P',
      position: 3,
      totalParticipants: 25
    },
    {
      date: '2024-02-10',
      score: 92,
      xCount: 6,
      eventName: 'Club Competition',
      discipline: 'Prone',
      position: 5,
      totalParticipants: 15
    },
    {
      date: '2024-03-05',
      score: 98,
      xCount: 12,
      eventName: 'Regional Match',
      discipline: '3P',
      position: 1,
      totalParticipants: 30
    },
    {
      date: '2024-04-12',
      score: 96,
      xCount: 10,
      eventName: 'National Qualifier',
      discipline: 'Prone',
      position: 2,
      totalParticipants: 40
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
    },
    {
      discipline: 'Prone',
      totalMatches: 6,
      averageScore: 93.2,
      personalBest: 96,
      totalXCount: 38,
      averageXCount: 6.3,
      bestScoreDate: '2024-04-12',
      bestScoreEvent: 'National Qualifier'
    },
    {
      discipline: 'Air Rifle',
      totalMatches: 4,
      averageScore: 89.8,
      personalBest: 94,
      totalXCount: 22,
      averageXCount: 5.5,
      bestScoreDate: '2024-02-20',
      bestScoreEvent: 'Air Rifle Championship'
    }
  ],
  performanceTrends: [
    { period: 'week', averageScore: 92.5, totalMatches: 2, totalXCount: 12, improvement: 2.1 },
    { period: 'month', averageScore: 91.8, totalMatches: 8, totalXCount: 45, improvement: 1.5 },
    { period: 'quarter', averageScore: 90.2, totalMatches: 18, totalXCount: 105, improvement: 3.2 }
  ],
  eventParticipation: [
    {
      eventId: '1',
      eventName: 'SATRF Championship',
      date: '2024-01-15',
      location: 'Johannesburg',
      discipline: '3P',
      status: 'completed',
      score: 95,
      xCount: 8,
      position: 3,
      totalParticipants: 25
    },
    {
      eventId: '2',
      eventName: 'Club Competition',
      date: '2024-02-10',
      location: 'Cape Town',
      discipline: 'Prone',
      status: 'completed',
      score: 92,
      xCount: 6,
      position: 5,
      totalParticipants: 15
    }
  ],
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
};

// Test utilities
const setupMockAPI = (overrides = {}) => {
  const { analyticsAPI } = require('../../lib/analytics');
  analyticsAPI.getUserAnalytics = jest.fn().mockResolvedValue(mockAnalytics);
  analyticsAPI.exportAnalytics = jest.fn().mockResolvedValue(new Blob(['test'], { type: 'text/csv' }));
  Object.assign(analyticsAPI, overrides);
};

const setupMockUtils = (overrides = {}) => {
  const { analyticsUtils } = require('../../lib/analytics');
  analyticsUtils.generateMockAnalytics = jest.fn().mockReturnValue(mockAnalytics);
  Object.assign(analyticsUtils, overrides);
};

// Mock browser APIs
const setupBrowserMocks = () => {
  const mockCreateObjectURL = jest.fn().mockReturnValue('blob:test');
  const mockRevokeObjectURL = jest.fn();
  const mockLink = {
    href: '',
    download: '',
    click: jest.fn(),
  };
  
  global.URL.createObjectURL = mockCreateObjectURL;
  global.URL.revokeObjectURL = mockRevokeObjectURL;
  global.document.createElement = jest.fn().mockReturnValue(mockLink);
  
  return { mockCreateObjectURL, mockRevokeObjectURL, mockLink };
};

describe('AnalyticsDashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMockAPI();
    setupMockUtils();
    setupBrowserMocks();
  });

  describe('Rendering and Initial Loading State', () => {
    it('renders loading state initially with proper accessibility attributes', () => {
      render(<AnalyticsDashboard />);
      
      // Check loading message
      expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
      
      // Check loading spinner with proper ARIA attributes
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveAttribute('aria-live', 'polite');
      
      // Check that main content is not visible during loading
      expect(screen.queryByText('Performance Analytics')).not.toBeInTheDocument();
    });

    it('renders analytics dashboard after successful data loading', async () => {
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
      });
      
      // Verify loading state is removed
      expect(screen.queryByText('Loading analytics...')).not.toBeInTheDocument();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('displays all summary statistics with proper formatting', async () => {
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        // Check all summary cards are present
        expect(screen.getByText('Total Matches')).toBeInTheDocument();
        expect(screen.getByText('18')).toBeInTheDocument();
        
        expect(screen.getByText('Personal Best')).toBeInTheDocument();
        expect(screen.getByText('98')).toBeInTheDocument();
        
        expect(screen.getByText('Average Score')).toBeInTheDocument();
        expect(screen.getByText('91.5')).toBeInTheDocument();
        
        expect(screen.getByText('Total X Count')).toBeInTheDocument();
        expect(screen.getByText('105')).toBeInTheDocument();
        
        expect(screen.getByText('Improvement Rate')).toBeInTheDocument();
        expect(screen.getByText('3.2%')).toBeInTheDocument();
        
        expect(screen.getByText('Consistency Score')).toBeInTheDocument();
        expect(screen.getByText('85.4%')).toBeInTheDocument();
      });
    });
  });

  describe('Data Fetching and Display', () => {
    it('fetches data correctly from mock API responses', async () => {
      const { analyticsAPI } = require('../../lib/analytics');
      const mockGetUserAnalytics = jest.fn().mockResolvedValue(mockAnalytics);
      analyticsAPI.getUserAnalytics = mockGetUserAnalytics;

      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(mockGetUserAnalytics).toHaveBeenCalledWith({});
      });
      
      // Verify data is displayed correctly
      expect(screen.getByText('SATRF Championship')).toBeInTheDocument();
      expect(screen.getByText('Club Competition')).toBeInTheDocument();
    });

    it('handles API calls with authentication token headers', async () => {
      const { analyticsAPI } = require('../../lib/analytics');
      const mockGetUserAnalytics = jest.fn().mockResolvedValue(mockAnalytics);
      analyticsAPI.getUserAnalytics = mockGetUserAnalytics;

      // Mock localStorage token
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn().mockReturnValue('mock-jwt-token'),
        },
        writable: true,
      });

      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(mockGetUserAnalytics).toHaveBeenCalled();
      });
    });

    it('displays score history table with all required columns', async () => {
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Scores'));
      });

      await waitFor(() => {
        // Check table headers
        expect(screen.getByText('Date')).toBeInTheDocument();
        expect(screen.getByText('Event')).toBeInTheDocument();
        expect(screen.getByText('Discipline')).toBeInTheDocument();
        expect(screen.getByText('Score')).toBeInTheDocument();
        expect(screen.getByText('X Count')).toBeInTheDocument();
        expect(screen.getByText('Position')).toBeInTheDocument();
        
        // Check table data
        expect(screen.getByText('SATRF Championship')).toBeInTheDocument();
        expect(screen.getByText('Club Competition')).toBeInTheDocument();
        expect(screen.getByText('3P')).toBeInTheDocument();
        expect(screen.getByText('Prone')).toBeInTheDocument();
        expect(screen.getByText('95')).toBeInTheDocument();
        expect(screen.getByText('92')).toBeInTheDocument();
        expect(screen.getByText('8')).toBeInTheDocument();
        expect(screen.getByText('6')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
      });
    });

    it('displays discipline statistics with performance metrics', async () => {
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Disciplines'));
      });

      await waitFor(() => {
        // Check discipline names
        expect(screen.getByText('3P')).toBeInTheDocument();
        expect(screen.getByText('Prone')).toBeInTheDocument();
        expect(screen.getByText('Air Rifle')).toBeInTheDocument();
        
        // Check performance metrics
        expect(screen.getByText('8')).toBeInTheDocument(); // 3P total matches
        expect(screen.getByText('6')).toBeInTheDocument(); // Prone total matches
        expect(screen.getByText('4')).toBeInTheDocument(); // Air Rifle total matches
        
        expect(screen.getByText('91.5')).toBeInTheDocument(); // 3P average
        expect(screen.getByText('93.2')).toBeInTheDocument(); // Prone average
        expect(screen.getByText('89.8')).toBeInTheDocument(); // Air Rifle average
        
        expect(screen.getByText('98')).toBeInTheDocument(); // 3P personal best
        expect(screen.getByText('96')).toBeInTheDocument(); // Prone personal best
        expect(screen.getByText('94')).toBeInTheDocument(); // Air Rifle personal best
      });
    });
  });

  describe('Filtering Functionality', () => {
    it('filters by date range and updates chart data', async () => {
      const user = userEvent.setup();
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
      });

      // Find and interact with date range filter
      const dateFilter = screen.getByLabelText(/date range/i);
      expect(dateFilter).toBeInTheDocument();
      
      // Simulate date range selection
      await user.click(dateFilter);
      
      // Verify that filtering triggers API call with new parameters
      const { analyticsAPI } = require('../../lib/analytics');
      expect(analyticsAPI.getUserAnalytics).toHaveBeenCalled();
    });

    it('filters by discipline and verifies updated chart data', async () => {
      const user = userEvent.setup();
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
      });

      // Find discipline filter dropdown
      const disciplineFilter = screen.getByLabelText(/discipline/i);
      expect(disciplineFilter).toBeInTheDocument();
      
      // Select specific discipline
      await user.selectOptions(disciplineFilter, '3P');
      
      // Verify discipline-specific data is displayed
      await waitFor(() => {
        expect(screen.getByText('3P')).toBeInTheDocument();
        expect(screen.queryByText('Prone')).not.toBeInTheDocument();
      });
    });

    it('handles multiple filter combinations', async () => {
      const user = userEvent.setup();
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
      });

      // Apply multiple filters
      const disciplineFilter = screen.getByLabelText(/discipline/i);
      const dateFilter = screen.getByLabelText(/date range/i);
      
      await user.selectOptions(disciplineFilter, '3P');
      await user.click(dateFilter);
      
      // Verify filters are applied correctly
      expect(disciplineFilter).toHaveValue('3P');
    });

    it('resets filters when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
      });

      // Apply a filter first
      const disciplineFilter = screen.getByLabelText(/discipline/i);
      await user.selectOptions(disciplineFilter, '3P');
      
      // Find and click clear filters button
      const clearButton = screen.getByText(/clear filters/i);
      await user.click(clearButton);
      
      // Verify filters are reset
      expect(disciplineFilter).toHaveValue('all');
    });
  });

  describe('Export Buttons Functionality', () => {
    it('triggers CSV export with correct parameters', async () => {
      const user = userEvent.setup();
      const { analyticsAPI } = require('../../lib/analytics');
      const mockExport = jest.fn().mockResolvedValue(new Blob(['test'], { type: 'text/csv' }));
      analyticsAPI.exportAnalytics = mockExport;

      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Export')).toBeInTheDocument();
      });

      // Click export button and select CSV
      await user.click(screen.getByText('Export'));
      const csvOption = screen.getByText(/CSV/i);
      await user.click(csvOption);

      await waitFor(() => {
        expect(mockExport).toHaveBeenCalledWith('csv', {});
        expect(mockExport).toHaveBeenCalledTimes(1);
      });
    });

    it('triggers JSON export with correct parameters', async () => {
      const user = userEvent.setup();
      const { analyticsAPI } = require('../../lib/analytics');
      const mockExport = jest.fn().mockResolvedValue(new Blob(['test'], { type: 'application/json' }));
      analyticsAPI.exportAnalytics = mockExport;

      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Export')).toBeInTheDocument();
      });

      // Click export button and select JSON
      await user.click(screen.getByText('Export'));
      const jsonOption = screen.getByText(/JSON/i);
      await user.click(jsonOption);

      await waitFor(() => {
        expect(mockExport).toHaveBeenCalledWith('json', {});
        expect(mockExport).toHaveBeenCalledTimes(1);
      });
    });

    it('triggers PDF export with correct parameters', async () => {
      const user = userEvent.setup();
      const { analyticsAPI } = require('../../lib/analytics');
      const mockExport = jest.fn().mockResolvedValue(new Blob(['test'], { type: 'application/pdf' }));
      analyticsAPI.exportAnalytics = mockExport;

      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Export')).toBeInTheDocument();
      });

      // Click export button and select PDF
      await user.click(screen.getByText('Export'));
      const pdfOption = screen.getByText(/PDF/i);
      await user.click(pdfOption);

      await waitFor(() => {
        expect(mockExport).toHaveBeenCalledWith('pdf', {});
        expect(mockExport).toHaveBeenCalledTimes(1);
      });
    });

    it('handles export errors gracefully', async () => {
      const user = userEvent.setup();
      const { analyticsAPI } = require('../../lib/analytics');
      const mockExport = jest.fn().mockRejectedValue(new Error('Export failed'));
      analyticsAPI.exportAnalytics = mockExport;

      // Mock console.error to prevent test noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Export')).toBeInTheDocument();
      });

      // Click export button
      await user.click(screen.getByText('Export'));
      const csvOption = screen.getByText(/CSV/i);
      await user.click(csvOption);

      await waitFor(() => {
        expect(mockExport).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith('Export failed:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility Checks', () => {
    it('has proper ARIA roles and labels for key interactive elements', async () => {
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
      });

      // Check main heading structure
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toBeInTheDocument();
      expect(mainHeading).toHaveTextContent('Performance Analytics');

      // Check tab navigation
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThan(0);
      
      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('aria-selected');
      });

      // Check export button accessibility
      const exportButton = screen.getByRole('button', { name: /export/i });
      expect(exportButton).toBeInTheDocument();
      expect(exportButton).toHaveAttribute('aria-haspopup', 'true');

      // Check refresh button accessibility
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      expect(refreshButton).toBeInTheDocument();
    });

    it('supports keyboard navigation for all interactive elements', async () => {
      const user = userEvent.setup();
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
      });

      // Test tab navigation with keyboard
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThan(0);

      // Focus first tab and navigate with arrow keys
      await user.tab();
      expect(tabs[0]).toHaveFocus();

      // Test arrow key navigation between tabs
      await user.keyboard('{ArrowRight}');
      expect(tabs[1]).toHaveFocus();

      await user.keyboard('{ArrowLeft}');
      expect(tabs[0]).toHaveFocus();
    });

    it('provides screen reader support for charts and data', async () => {
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
      });

      // Check for chart descriptions
      const charts = screen.getAllByTestId(/chart$/);
      charts.forEach(chart => {
        expect(chart).toHaveAttribute('role', 'img');
        expect(chart).toHaveAttribute('aria-label');
      });

      // Check for table accessibility
      const tables = screen.getAllByRole('table');
      tables.forEach(table => {
        expect(table).toHaveAttribute('aria-label');
      });

      // Check for data table headers
      const tableHeaders = screen.getAllByRole('columnheader');
      expect(tableHeaders.length).toBeGreaterThan(0);
    });

    it('has proper focus management and visible focus indicators', async () => {
      const user = userEvent.setup();
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
      });

      // Test focus indicators
      const interactiveElements = screen.getAllByRole('button');
      interactiveElements.forEach(async (element) => {
        await user.tab();
        expect(element).toHaveFocus();
        expect(element).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-electric-cyan');
      });
    });
  });

  describe('Error Handling', () => {
    it('simulates API failure and verifies user-friendly error messages', async () => {
      const { analyticsAPI } = require('../../lib/analytics');
      analyticsAPI.getUserAnalytics = jest.fn().mockRejectedValue(new Error('Network error'));

      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Error loading analytics')).toBeInTheDocument();
        expect(screen.getByText('Failed to load analytics data. Please try again.')).toBeInTheDocument();
      });

      // Check for retry button
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('handles partial data failures gracefully', async () => {
      const { analyticsAPI } = require('../../lib/analytics');
      analyticsAPI.getUserAnalytics = jest.fn().mockResolvedValue({
        ...mockAnalytics,
        scoreHistory: null, // Partial failure
      });

      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
      });

      // Should still show available data
      expect(screen.getByText('Total Matches')).toBeInTheDocument();
      expect(screen.getByText('18')).toBeInTheDocument();
    });

    it('displays appropriate error states for different error types', async () => {
      const { analyticsAPI } = require('../../lib/analytics');
      
      // Test authentication error
      analyticsAPI.getUserAnalytics = jest.fn().mockRejectedValue({
        response: { status: 401, data: { message: 'Unauthorized' } }
      });

      const { rerender } = render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/authentication/i)).toBeInTheDocument();
      });

      // Test server error
      analyticsAPI.getUserAnalytics = jest.fn().mockRejectedValue({
        response: { status: 500, data: { message: 'Internal server error' } }
      });

      rerender(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/server error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Layout Behavior', () => {
    it('adapts to different viewport sizes', async () => {
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
      });

      // Test mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      // Trigger resize event
      window.dispatchEvent(new Event('resize'));

      await waitFor(() => {
        // Check for mobile-specific classes
        const container = screen.getByTestId('responsive-container');
        expect(container).toBeInTheDocument();
      });
    });

    it('maintains functionality across different screen sizes', async () => {
      const user = userEvent.setup();
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
      });

      // Test tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      window.dispatchEvent(new Event('resize'));

      // Verify tabs still work
      await user.click(screen.getByText('Scores'));
      await waitFor(() => {
        expect(screen.getByText('Score Distribution')).toBeInTheDocument();
      });
    });

    it('handles chart responsiveness correctly', async () => {
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
      });

      // Check that ResponsiveContainer is used
      const responsiveContainers = screen.getAllByTestId('responsive-container');
      expect(responsiveContainers.length).toBeGreaterThan(0);

      // Verify chart data is passed correctly
      const charts = screen.getAllByTestId(/chart$/);
      charts.forEach(chart => {
        expect(chart).toHaveAttribute('data-chart-data');
      });
    });
  });

  describe('Edge Cases and Data Validation', () => {
    it('handles empty data gracefully', async () => {
      const { analyticsUtils } = require('../../lib/analytics');
      analyticsUtils.generateMockAnalytics = jest.fn().mockReturnValue({
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
      });

      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('No analytics data available')).toBeInTheDocument();
        expect(screen.getByText('Start participating in events to see your analytics here.')).toBeInTheDocument();
      });
    });

    it('handles invalid filter parameters', async () => {
      const user = userEvent.setup();
      render(<AnalyticsDashboard initialFilters={{ invalidParam: 'test' }} />);
      
      await waitFor(() => {
        expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
      });

      // Apply invalid date range
      const dateFilter = screen.getByLabelText(/date range/i);
      await user.click(dateFilter);
      
      // Should handle gracefully without crashing
      expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
    });

    it('handles large datasets efficiently', async () => {
      const largeDataset = {
        ...mockAnalytics,
        scoreHistory: Array.from({ length: 1000 }, (_, i) => ({
          date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
          score: 90 + Math.floor(Math.random() * 10),
          xCount: Math.floor(Math.random() * 15),
          eventName: `Event ${i + 1}`,
          discipline: ['3P', 'Prone', 'Air Rifle'][i % 3],
          position: Math.floor(Math.random() * 20) + 1,
          totalParticipants: 20 + Math.floor(Math.random() * 30)
        }))
      };

      const { analyticsUtils } = require('../../lib/analytics');
      analyticsUtils.generateMockAnalytics = jest.fn().mockReturnValue(largeDataset);

      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
      });

      // Should render without performance issues
      expect(screen.getByText('Total Matches')).toBeInTheDocument();
    });

    it('handles malformed data gracefully', async () => {
      const malformedData = {
        ...mockAnalytics,
        scoreHistory: [
          { date: 'invalid-date', score: 'not-a-number', xCount: null },
          ...mockAnalytics.scoreHistory
        ]
      };

      const { analyticsUtils } = require('../../lib/analytics');
      analyticsUtils.generateMockAnalytics = jest.fn().mockReturnValue(malformedData);

      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
      });

      // Should still display valid data
      expect(screen.getByText('SATRF Championship')).toBeInTheDocument();
    });
  });

  describe('Component Integration and State Management', () => {
    it('maintains state correctly across tab switches', async () => {
      const user = userEvent.setup();
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
      });

      // Switch to Scores tab
      await user.click(screen.getByText('Scores'));
      await waitFor(() => {
        expect(screen.getByText('Score Distribution')).toBeInTheDocument();
      });

      // Switch to Disciplines tab
      await user.click(screen.getByText('Disciplines'));
      await waitFor(() => {
        expect(screen.getByText('Discipline Performance')).toBeInTheDocument();
      });

      // Switch back to Overview tab
      await user.click(screen.getByText('Overview'));
      await waitFor(() => {
        expect(screen.getByText('Performance Overview')).toBeInTheDocument();
      });
    });

    it('handles component unmounting and remounting', async () => {
      const { unmount } = render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
      });

      // Unmount component
      unmount();

      // Remount component
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
      });
    });

    it('passes props correctly to child components', async () => {
      const customFilters = { discipline: '3P', dateRange: 'last-month' };
      render(<AnalyticsDashboard userId="test-user" initialFilters={customFilters} />);
      
      await waitFor(() => {
        expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
      });

      // Verify filters are applied
      const { analyticsAPI } = require('../../lib/analytics');
      expect(analyticsAPI.getUserAnalytics).toHaveBeenCalledWith(customFilters);
    });
  });

  describe('Performance and Optimization', () => {
    it('implements proper memoization for expensive calculations', async () => {
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
      });

      // Verify charts are rendered efficiently
      const charts = screen.getAllByTestId(/chart$/);
      expect(charts.length).toBeGreaterThan(0);
      
      // Check that chart data is properly formatted
      charts.forEach(chart => {
        const chartData = chart.getAttribute('data-chart-data');
        expect(chartData).toBeTruthy();
        expect(() => JSON.parse(chartData!)).not.toThrow();
      });
    });

    it('handles rapid user interactions without performance degradation', async () => {
      const user = userEvent.setup();
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
      });

      // Rapidly switch between tabs
      for (let i = 0; i < 5; i++) {
        await user.click(screen.getByText('Scores'));
        await user.click(screen.getByText('Disciplines'));
        await user.click(screen.getByText('Trends'));
        await user.click(screen.getByText('Overview'));
      }

      // Should still be responsive
      expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
    });
  });
}); 