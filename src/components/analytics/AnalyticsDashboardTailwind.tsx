import React, { useState, useEffect, useCallback } from 'react';
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
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart
} from 'recharts';
import { FaDownload, FaRedo, FaEye, FaEyeSlash, FaChartLine, FaChartBar, FaChartPie, FaCalendarAlt } from 'react-icons/fa';
import { analyticsAPI, analyticsUtils, UserAnalytics, AnalyticsFilters, ScoreDataPoint } from '../../lib/analytics';
import { useAnalytics } from '../../hooks/useAnalytics';

interface AnalyticsDashboardProps {
  userId?: string;
  initialFilters?: AnalyticsFilters;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  userId,
  initialFilters = {}
}) => {
  const {
    analytics,
    loading,
    error,
    filters,
    loadAnalytics,
    updateFilters,
    refreshData,
    exportData,
    summary,
    scoreHistory,
    disciplineStats,
    availableDisciplines,
    dateRange,
    getDisciplineColor,
    getPerformanceLevel,
    formatDate
  } = useAnalytics({
    userId,
    initialFilters,
    autoRefresh: false,
    enableCaching: true
  });

  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
  const [showXCount, setShowXCount] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'scores' | 'disciplines' | 'trends' | 'events'>('overview');
  const [selectedDataPoint, setSelectedDataPoint] = useState<ScoreDataPoint | null>(null);
  const [showModal, setShowModal] = useState(false);

  // SATRF color scheme
  const colors = {
    primary: '#2C5282', // SATRF navy
    accent: '#E53E3E', // SATRF red
    success: '#38A169', // Green
    warning: '#D69E2E', // Yellow
    info: '#3182CE', // Blue
    gray: '#4A5568', // Steel
    lightGray: '#718096',
    darkGray: '#2D3748'
  };

  // Handle discipline filter change
  const handleDisciplineChange = (discipline: string) => {
    setSelectedDiscipline(discipline);
    updateFilters({
      discipline: discipline === 'all' ? undefined : discipline
    });
  };

  // Handle date range change
  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    const newDateRange = { ...dateRange, [field]: value };
    updateFilters({ dateRange: newDateRange });
  };

  // Handle export
  const handleExport = async (format: 'csv' | 'json' | 'pdf') => {
    try {
      await exportData(format);
      // Show success message (you can use a toast library here)
      console.log(`Analytics exported as ${format.toUpperCase()}`);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="font-bold text-gray-800 mb-2">
            {formatDate(label)}
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
                onClick={refreshData}
                className="flex items-center px-3 py-2 bg-midnight-light/30 border border-gray-600 rounded-lg text-gray-300 hover:text-electric-cyan transition-colors duration-200"
                title="Refresh data"
              >
                <FaRedo className="w-4 h-4" />
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

        {/* Filters */}
        <div className="mb-6 bg-midnight-light/30 rounded-lg border border-gray-600 p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1">
              <label className="block text-sm font-oxanium text-gray-300 mb-1">Discipline</label>
              <select
                value={selectedDiscipline}
                onChange={(e) => handleDisciplineChange(e.target.value)}
                className="w-full px-3 py-2 bg-midnight-light/50 border border-gray-600 rounded-lg text-gray-300 focus:outline-none focus:border-electric-cyan"
              >
                <option value="all">All Disciplines</option>
                {availableDisciplines.map((discipline) => (
                  <option key={discipline} value={discipline}>
                    {discipline}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-oxanium text-gray-300 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                className="px-3 py-2 bg-midnight-light/50 border border-gray-600 rounded-lg text-gray-300 focus:outline-none focus:border-electric-cyan"
              />
            </div>

            <div>
              <label className="block text-sm font-oxanium text-gray-300 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                className="px-3 py-2 bg-midnight-light/50 border border-gray-600 rounded-lg text-gray-300 focus:outline-none focus:border-electric-cyan"
              />
            </div>

            <button
              onClick={() => setShowXCount(!showXCount)}
              className="flex items-center px-3 py-2 bg-midnight-light/30 border border-gray-600 rounded-lg text-gray-300 hover:text-electric-cyan transition-colors duration-200"
            >
              {showXCount ? <FaEye className="w-4 h-4 mr-2" /> : <FaEyeSlash className="w-4 h-4 mr-2" />}
              {showXCount ? 'Hide' : 'Show'} X Count
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: FaChartLine },
              { id: 'scores', name: 'Scores', icon: FaChartBar },
              { id: 'disciplines', name: 'Disciplines', icon: FaChartPie },
              { id: 'trends', name: 'Trends', icon: FaChartLine },
              { id: 'events', name: 'Events', icon: FaCalendarAlt },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center py-2 px-1 border-b-2 font-oxanium font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-electric-cyan text-electric-cyan'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Dashboard Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && <OverviewTab analytics={analytics} colors={colors} />}
          {activeTab === 'scores' && (
            <ScoresTab 
              analytics={analytics} 
              colors={colors}
              showXCount={showXCount}
              onDataPointClick={(dataPoint) => {
                setSelectedDataPoint(dataPoint);
                setShowModal(true);
              }}
            />
          )}
          {activeTab === 'disciplines' && <DisciplinesTab analytics={analytics} colors={colors} />}
          {activeTab === 'trends' && <TrendsTab analytics={analytics} colors={colors} />}
          {activeTab === 'events' && <EventsTab analytics={analytics} />}
        </div>
      </div>

      {/* Data Point Detail Modal */}
      {showModal && selectedDataPoint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-midnight-light rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-oxanium font-bold text-electric-cyan">Score Details</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-oxanium font-bold text-gray-300">
                  {selectedDataPoint.eventName}
                </h4>
                <p className="text-sm text-gray-400 font-oxanium">
                  {formatDate(selectedDataPoint.date)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400 font-oxanium">Score</p>
                  <p className="text-lg font-oxanium font-bold text-electric-cyan">
                    {selectedDataPoint.score}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 font-oxanium">X Count</p>
                  <p className="text-lg font-oxanium font-bold text-yellow-400">
                    {selectedDataPoint.xCount}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 font-oxanium">Discipline</p>
                  <p className="text-lg font-oxanium font-bold" style={{ color: getDisciplineColor(selectedDataPoint.discipline) }}>
                    {selectedDataPoint.discipline}
                  </p>
                </div>
                
                {selectedDataPoint.position && (
                  <div>
                    <p className="text-sm text-gray-400 font-oxanium">Position</p>
                    <p className="text-lg font-oxanium font-bold text-green-400">
                      {selectedDataPoint.position}
                      {selectedDataPoint.totalParticipants && ` / ${selectedDataPoint.totalParticipants}`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{ analytics: UserAnalytics; colors: any }> = ({ analytics, colors }) => {
  const { summary, scoreHistory } = analytics;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-midnight-light/30 rounded-lg border border-gray-600 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-electric-cyan rounded-lg flex items-center justify-center">
                <FaChartBar className="w-5 h-5 text-midnight-steel" />
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
                <FaChartLine className="w-5 h-5 text-white" />
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
                <FaChartBar className="w-5 h-5 text-white" />
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
                <FaChartPie className="w-5 h-5 text-white" />
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
            <ComposedChart data={scoreHistory}>
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
                fill={colors.primary}
                fillOpacity={0.1}
                stroke={colors.primary}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke={colors.primary}
                strokeWidth={3}
                dot={{ fill: colors.primary, strokeWidth: 2, r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// Scores Tab Component
const ScoresTab: React.FC<{ 
  analytics: UserAnalytics; 
  colors: any;
  showXCount: boolean;
  onDataPointClick: (dataPoint: ScoreDataPoint) => void;
}> = ({ analytics, colors, showXCount, onDataPointClick }) => {
  const { scoreHistory } = analytics;

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
              <Bar 
                dataKey="score" 
                fill={colors.primary}
                onClick={(data) => {
                  // Extract the actual ScoreDataPoint from Recharts event payload
                  // Recharts passes BarRectangleItem but we need the original data
                  const scoreData = data.payload as ScoreDataPoint;
                  onDataPointClick(scoreData);
                }}
                cursor="pointer"
              />
              {showXCount && (
                <Bar 
                  dataKey="xCount" 
                  fill={colors.warning}
                  onClick={(data) => {
                    // Extract the actual ScoreDataPoint from Recharts event payload
                    // Recharts passes BarRectangleItem but we need the original data
                    const scoreData = data.payload as ScoreDataPoint;
                    onDataPointClick(scoreData);
                  }}
                  cursor="pointer"
                />
              )}
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
                <th className="px-6 py-3 text-left text-xs font-oxanium font-medium text-gray-300 uppercase tracking-wider">
                  Position
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {scoreHistory.map((score, index) => (
                <tr 
                  key={index}
                  onClick={() => onDataPointClick(score)}
                  className="cursor-pointer hover:bg-midnight-light/20 transition-colors duration-200"
                >
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-oxanium text-gray-300">
                    {score.position && score.totalParticipants 
                      ? `${score.position}/${score.totalParticipants}`
                      : score.position || 'N/A'
                    }
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
const DisciplinesTab: React.FC<{ analytics: UserAnalytics; colors: any }> = ({ analytics, colors }) => {
  const { disciplineStats } = analytics;

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
              <Bar dataKey="averageScore" fill={colors.primary} name="Average Score" />
              <Bar dataKey="personalBest" fill={colors.success} name="Personal Best" />
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
              
              <p className="text-xs text-gray-500 font-oxanium">
                Best: {analyticsUtils.formatDate(stat.bestScoreDate)} - {stat.bestScoreEvent}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Trends Tab Component
const TrendsTab: React.FC<{ analytics: UserAnalytics; colors: any }> = ({ analytics, colors }) => {
  const { performanceTrends } = analytics;

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
                stroke={colors.primary}
                strokeWidth={3}
                dot={{ fill: colors.primary, strokeWidth: 2, r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="totalMatches"
                stroke={colors.success}
                strokeWidth={2}
                dot={{ fill: colors.success, strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Improvement Rate */}
      <div className="bg-midnight-light/30 rounded-lg border border-gray-600 p-6">
        <h3 className="text-lg font-oxanium font-medium text-electric-cyan mb-4">
          Improvement Rate
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performanceTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
              <XAxis dataKey="period" fontSize={12} tick={{ fill: '#A0AEC0' }} />
              <YAxis fontSize={12} tick={{ fill: '#A0AEC0' }} />
              <Tooltip />
              <Bar 
                dataKey="improvement" 
                fill={colors.gray}
              >
                {performanceTrends.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={entry.improvement >= 0 ? colors.success : colors.accent}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// Events Tab Component
const EventsTab: React.FC<{ analytics: UserAnalytics }> = ({ analytics }) => {
  const { eventParticipation } = analytics;

  return (
    <div className="space-y-6">
      <div className="bg-midnight-light/30 rounded-lg border border-gray-600 p-6">
        <h3 className="text-lg font-oxanium font-medium text-electric-cyan mb-4">
          Event Participation
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-600">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-oxanium font-medium text-gray-300 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-oxanium font-medium text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-oxanium font-medium text-gray-300 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-oxanium font-medium text-gray-300 uppercase tracking-wider">
                  Discipline
                </th>
                <th className="px-6 py-3 text-left text-xs font-oxanium font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-oxanium font-medium text-gray-300 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-oxanium font-medium text-gray-300 uppercase tracking-wider">
                  Position
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {eventParticipation.map((event, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-oxanium font-medium text-gray-300">
                    {event.eventName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-oxanium text-gray-300">
                    {analyticsUtils.formatDate(event.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-oxanium text-gray-300">
                    {event.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-oxanium">
                    <span className="px-2 py-1 text-xs font-oxanium bg-blue-900/50 text-blue-400 rounded-full">
                      {event.discipline}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-oxanium">
                    <span className={`px-2 py-1 text-xs font-oxanium rounded-full ${
                      event.status === 'completed' ? 'bg-green-900/50 text-green-400' :
                      event.status === 'registered' ? 'bg-blue-900/50 text-blue-400' :
                      'bg-red-900/50 text-red-400'
                    }`}>
                      {event.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-oxanium font-bold text-electric-cyan">
                    {event.score || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-oxanium text-gray-300">
                    {event.position && event.totalParticipants 
                      ? `${event.position}/${event.totalParticipants}`
                      : event.position || 'N/A'
                    }
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