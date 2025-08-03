import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { FaDownload, FaRefresh, FaEye, FaEyeSlash } from 'react-icons/fa';
import { analyticsAPI, analyticsUtils, UserAnalytics, AnalyticsFilters, ScoreDataPoint } from '../../lib/analytics';

interface AnalyticsDashboardProps {
  userId?: string;
  initialFilters?: AnalyticsFilters;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  userId,
  initialFilters = {}
}) => {
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
  const [showXCount, setShowXCount] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'scores' | 'disciplines' | 'trends'>('overview');

  // Load analytics data
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        // In development, use mock data if API is not available
        if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_API_BASE_URL) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          setAnalytics(analyticsUtils.generateMockAnalytics());
        } else {
          const data = await analyticsAPI.getUserAnalytics(initialFilters);
          setAnalytics(data);
        }
      } catch (err: any) {
        console.error('Error loading analytics:', err);
        setError('Failed to load analytics data. Please try again.');
        
        if (process.env.NODE_ENV === 'development') {
          setAnalytics(analyticsUtils.generateMockAnalytics());
        }
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [initialFilters]);

  // Handle export
  const handleExport = async (format: 'csv' | 'json' | 'pdf') => {
    try {
      const blob = await analyticsAPI.exportAnalytics(format, initialFilters);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `satrf-analytics-${new Date().toISOString().split('T')[0]}.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="font-bold text-gray-800 mb-2">
            {analyticsUtils.formatDate(label)}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-midnight-steel via-midnight-dark to-midnight-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-electric-cyan mx-auto mb-4"></div>
          <p className="text-gray-300 font-oxanium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-midnight-steel via-midnight-dark to-midnight-light flex items-center justify-center">
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-6 py-4 rounded-lg max-w-md">
          <h3 className="font-bold mb-2">Error loading analytics</h3>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-midnight-steel via-midnight-dark to-midnight-light flex items-center justify-center">
        <p className="text-gray-300 font-oxanium">No analytics data available</p>
      </div>
    );
  }

  const { summary, scoreHistory, disciplineStats, performanceTrends } = analytics;

  return (
    <div className="min-h-screen bg-gradient-to-br from-midnight-steel via-midnight-dark to-midnight-light">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-oxanium font-bold text-electric-cyan mb-2">
                Performance Analytics
              </h1>
              <p className="text-gray-300 font-oxanium">
                Track your shooting performance and trends
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center px-3 py-2 bg-midnight-light/30 border border-gray-600 rounded-lg text-gray-300 hover:text-electric-cyan transition-colors duration-200"
                title="Refresh data"
              >
                <FaRefresh className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => handleExport('csv')}
                className="flex items-center px-3 py-2 bg-midnight-light/30 border border-gray-600 rounded-lg text-gray-300 hover:text-electric-cyan transition-colors duration-200"
              >
                <FaDownload className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview' },
              { id: 'scores', name: 'Scores' },
              { id: 'disciplines', name: 'Disciplines' },
              { id: 'trends', name: 'Trends' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-oxanium font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-electric-cyan text-electric-cyan'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Dashboard Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <OverviewTab summary={summary} scoreHistory={scoreHistory} />
          )}
          {activeTab === 'scores' && (
            <ScoresTab scoreHistory={scoreHistory} showXCount={showXCount} />
          )}
          {activeTab === 'disciplines' && (
            <DisciplinesTab disciplineStats={disciplineStats} />
          )}
          {activeTab === 'trends' && (
            <TrendsTab performanceTrends={performanceTrends} />
          )}
        </div>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{ summary: any; scoreHistory: ScoreDataPoint[] }> = ({ summary, scoreHistory }) => {
  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-midnight-light/30 rounded-lg border border-gray-600 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-electric-cyan rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-midnight-steel" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-oxanium text-gray-400">Total Matches</p>
              <p className="text-2xl font-oxanium font-bold text-electric-cyan">{summary.totalMatches}</p>
            </div>
          </div>
        </div>

        <div className="bg-midnight-light/30 rounded-lg border border-gray-600 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-oxanium text-gray-400">Personal Best</p>
              <p className="text-2xl font-oxanium font-bold text-green-400">{summary.personalBest}</p>
            </div>
          </div>
        </div>

        <div className="bg-midnight-light/30 rounded-lg border border-gray-600 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-oxanium text-gray-400">Average Score</p>
              <p className="text-2xl font-oxanium font-bold text-blue-400">{summary.averageScore.toFixed(1)}</p>
            </div>
          </div>
        </div>

        <div className="bg-midnight-light/30 rounded-lg border border-gray-600 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-oxanium text-gray-400">Total X Count</p>
              <p className="text-2xl font-oxanium font-bold text-yellow-400">{summary.totalXCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-midnight-light/30 rounded-lg border border-gray-600 p-6">
        <h3 className="text-lg font-oxanium font-medium text-electric-cyan mb-4">
          Score History
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={scoreHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => analyticsUtils.formatDate(value)}
                fontSize={12}
                tick={{ fill: '#A0AEC0' }}
              />
              <YAxis fontSize={12} tick={{ fill: '#A0AEC0' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="score"
                fill="#2C5282"
                fillOpacity={0.3}
                stroke="#2C5282"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// Scores Tab Component
const ScoresTab: React.FC<{ scoreHistory: ScoreDataPoint[]; showXCount: boolean }> = ({ scoreHistory, showXCount }) => {
  return (
    <div className="space-y-6">
      {/* Score Distribution */}
      <div className="bg-midnight-light/30 rounded-lg border border-gray-600 p-6">
        <h3 className="text-lg font-oxanium font-medium text-electric-cyan mb-4">
          Score Distribution
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scoreHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => analyticsUtils.formatDate(value)}
                fontSize={12}
                tick={{ fill: '#A0AEC0' }}
              />
              <YAxis fontSize={12} tick={{ fill: '#A0AEC0' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="score" fill="#2C5282" />
              {showXCount && <Bar dataKey="xCount" fill="#D69E2E" />}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Score Table */}
      <div className="bg-midnight-light/30 rounded-lg border border-gray-600 p-6">
        <h3 className="text-lg font-oxanium font-medium text-electric-cyan mb-4">
          Recent Scores
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-600">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-oxanium font-medium text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-oxanium font-medium text-gray-300 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-oxanium font-medium text-gray-300 uppercase tracking-wider">
                  Discipline
                </th>
                <th className="px-6 py-3 text-left text-xs font-oxanium font-medium text-gray-300 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-oxanium font-medium text-gray-300 uppercase tracking-wider">
                  X Count
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {scoreHistory.map((score, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-oxanium text-gray-300">
                    {analyticsUtils.formatDate(score.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-oxanium text-gray-300">
                    {score.eventName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-oxanium">
                    <span className="px-2 py-1 text-xs font-oxanium bg-blue-900/50 text-blue-400 rounded-full">
                      {score.discipline}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-oxanium font-bold text-electric-cyan">
                    {score.score}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-oxanium text-yellow-400">
                    {score.xCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Disciplines Tab Component
const DisciplinesTab: React.FC<{ disciplineStats: any[] }> = ({ disciplineStats }) => {
  return (
    <div className="space-y-6">
      {/* Discipline Performance */}
      <div className="bg-midnight-light/30 rounded-lg border border-gray-600 p-6">
        <h3 className="text-lg font-oxanium font-medium text-electric-cyan mb-4">
          Discipline Performance
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={disciplineStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
              <XAxis dataKey="discipline" fontSize={12} tick={{ fill: '#A0AEC0' }} />
              <YAxis fontSize={12} tick={{ fill: '#A0AEC0' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="averageScore" fill="#2C5282" name="Average Score" />
              <Bar dataKey="personalBest" fill="#38A169" name="Personal Best" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Discipline Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {disciplineStats.map((stat, index) => (
          <div
            key={stat.discipline}
            className="bg-midnight-light/30 rounded-lg border border-gray-600 p-6"
          >
            <div className="space-y-4">
              <h4 className="text-sm font-oxanium font-bold" style={{ color: analyticsUtils.getDisciplineColor(stat.discipline) }}>
                {stat.discipline}
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-oxanium text-gray-400">Matches</p>
                  <p className="text-lg font-oxanium font-bold text-gray-300">{stat.totalMatches}</p>
                </div>
                
                <div>
                  <p className="text-xs font-oxanium text-gray-400">Avg Score</p>
                  <p className="text-lg font-oxanium font-bold text-electric-cyan">
                    {stat.averageScore.toFixed(1)}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs font-oxanium text-gray-400">Best Score</p>
                  <p className="text-lg font-oxanium font-bold text-green-400">
                    {stat.personalBest}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs font-oxanium text-gray-400">Avg X Count</p>
                  <p className="text-lg font-oxanium font-bold text-yellow-400">
                    {stat.averageXCount.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Trends Tab Component
const TrendsTab: React.FC<{ performanceTrends: any[] }> = ({ performanceTrends }) => {
  return (
    <div className="space-y-6">
      {/* Performance Trends */}
      <div className="bg-midnight-light/30 rounded-lg border border-gray-600 p-6">
        <h3 className="text-lg font-oxanium font-medium text-electric-cyan mb-4">
          Performance Trends
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performanceTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
              <XAxis dataKey="period" fontSize={12} tick={{ fill: '#A0AEC0' }} />
              <YAxis fontSize={12} tick={{ fill: '#A0AEC0' }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="averageScore"
                stroke="#2C5282"
                strokeWidth={3}
                dot={{ fill: '#2C5282', strokeWidth: 2, r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="totalMatches"
                stroke="#38A169"
                strokeWidth={2}
                dot={{ fill: '#38A169', strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// Custom Tooltip Component
const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
        <p className="font-bold text-gray-800 mb-2">
          {analyticsUtils.formatDate(label)}
        </p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default AnalyticsDashboard; 