import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useAuth, useProtectedRoute } from '../contexts/AuthContext';
import { GetServerSideProps } from 'next';
import { UserDashboardData, UserScoreSummary } from '../lib/auth';

const DashboardPage: NextPage = () => {
  const { user, dashboard, loadDashboard, isLoading, error } = useAuth();
  
  // Protect this route
  useProtectedRoute();

  const [activeTab, setActiveTab] = useState('overview');

  // Load dashboard data when component mounts
  useEffect(() => {
    if (user && !dashboard) {
      loadDashboard();
    }
  }, [user, dashboard, loadDashboard]);

  // Loading state
  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-midnight-steel via-midnight-dark to-midnight-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-electric-cyan mx-auto mb-4"></div>
          <p className="text-gray-300 font-oxanium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard - SATRF</title>
        <meta name="description" content="Your SATRF shooting dashboard and statistics" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-midnight-steel via-midnight-dark to-midnight-light">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-oxanium font-bold text-electric-cyan mb-2">
                  Welcome back, {user.firstName}!
                </h1>
                <p className="text-gray-300 font-oxanium">
                  Here's your shooting performance overview
                </p>
              </div>
              <a
                href="/analytics"
                className="px-4 py-2 bg-electric-cyan text-midnight-steel font-oxanium font-medium rounded-lg hover:bg-electric-neon transition-colors duration-200"
              >
                View Analytics
              </a>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-oxanium">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="mb-6">
            <nav className="flex space-x-8">
              {[
                { id: 'overview', name: 'Overview' },
                { id: 'scores', name: 'Scores' },
                { id: 'events', name: 'Events' },
                { id: 'statistics', name: 'Statistics' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
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
            {activeTab === 'overview' && <OverviewTab user={user} dashboard={dashboard} />}
            {activeTab === 'scores' && <ScoresTab dashboard={dashboard} />}
            {activeTab === 'events' && <EventsTab dashboard={dashboard} />}
            {activeTab === 'statistics' && <StatisticsTab dashboard={dashboard} />}
          </div>
        </div>
      </div>
    </>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{ user: any; dashboard: UserDashboardData | null }> = ({ user, dashboard }) => {
  if (!dashboard) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 font-oxanium">Loading dashboard data...</p>
      </div>
    );
  }

  const { scoreSummary } = dashboard;

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
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
              <p className="text-2xl font-oxanium font-bold text-electric-cyan">{scoreSummary.totalMatches}</p>
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
              <p className="text-2xl font-oxanium font-bold text-green-400">{scoreSummary.personalBest}</p>
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
              <p className="text-2xl font-oxanium font-bold text-blue-400">{scoreSummary.averageScore.toFixed(1)}</p>
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
              <p className="text-2xl font-oxanium font-bold text-yellow-400">{scoreSummary.totalXCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Scores */}
        <div className="bg-midnight-light/30 rounded-lg border border-gray-600 p-6">
          <h3 className="text-lg font-oxanium font-medium text-electric-cyan mb-4">
            Recent Scores
          </h3>
          {scoreSummary.recentScores && scoreSummary.recentScores.length > 0 ? (
            <div className="space-y-3">
              {scoreSummary.recentScores.slice(0, 5).map((score: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-midnight-light/20 rounded-lg">
                  <div>
                    <p className="text-sm font-oxanium text-gray-300">{score.eventName || 'Unknown Event'}</p>
                    <p className="text-xs text-gray-400 font-oxanium">{new Date(score.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-oxanium font-bold text-electric-cyan">{score.score}</p>
                    {score.xCount && (
                      <p className="text-xs text-yellow-400 font-oxanium">{score.xCount} X</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 font-oxanium text-center py-4">No recent scores available</p>
          )}
        </div>

        {/* Upcoming Events */}
        <div className="bg-midnight-light/30 rounded-lg border border-gray-600 p-6">
          <h3 className="text-lg font-oxanium font-medium text-electric-cyan mb-4">
            Upcoming Events
          </h3>
          {dashboard.upcomingEvents && dashboard.upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {dashboard.upcomingEvents.slice(0, 5).map((event: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-midnight-light/20 rounded-lg">
                  <div>
                    <p className="text-sm font-oxanium text-gray-300">{event.title}</p>
                    <p className="text-xs text-gray-400 font-oxanium">{event.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-oxanium text-electric-cyan">{new Date(event.date).toLocaleDateString()}</p>
                    <span className={`text-xs px-2 py-1 rounded-full font-oxanium ${
                      event.status === 'open' ? 'bg-green-900/50 text-green-400' :
                      event.status === 'full' ? 'bg-yellow-900/50 text-yellow-400' :
                      'bg-red-900/50 text-red-400'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 font-oxanium text-center py-4">No upcoming events</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Scores Tab Component
const ScoresTab: React.FC<{ dashboard: UserDashboardData | null }> = ({ dashboard }) => {
  if (!dashboard) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 font-oxanium">Loading scores data...</p>
      </div>
    );
  }

  const { scoreSummary } = dashboard;

  return (
    <div className="space-y-6">
      {/* Score Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-midnight-light/30 rounded-lg border border-gray-600 p-6">
          <h3 className="text-lg font-oxanium font-medium text-electric-cyan mb-4">Score Distribution</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-oxanium text-gray-300">90-100</span>
              <span className="text-sm font-oxanium text-electric-cyan">25%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-oxanium text-gray-300">80-89</span>
              <span className="text-sm font-oxanium text-electric-cyan">45%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-oxanium text-gray-300">70-79</span>
              <span className="text-sm font-oxanium text-electric-cyan">20%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-oxanium text-gray-300">Below 70</span>
              <span className="text-sm font-oxanium text-electric-cyan">10%</span>
            </div>
          </div>
        </div>

        <div className="bg-midnight-light/30 rounded-lg border border-gray-600 p-6">
          <h3 className="text-lg font-oxanium font-medium text-electric-cyan mb-4">X Count Analysis</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-oxanium text-gray-300">Total X Count</span>
              <span className="text-sm font-oxanium text-yellow-400">{scoreSummary.totalXCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-oxanium text-gray-300">Average X Count</span>
              <span className="text-sm font-oxanium text-yellow-400">{scoreSummary.averageXCount.toFixed(1)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-oxanium text-gray-300">X Rate</span>
              <span className="text-sm font-oxanium text-yellow-400">
                {scoreSummary.totalMatches > 0 ? ((scoreSummary.totalXCount / (scoreSummary.totalMatches * 10)) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-midnight-light/30 rounded-lg border border-gray-600 p-6">
          <h3 className="text-lg font-oxanium font-medium text-electric-cyan mb-4">Performance Trends</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-oxanium text-gray-300">Best Score</span>
              <span className="text-sm font-oxanium text-green-400">{scoreSummary.personalBest}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-oxanium text-gray-300">Average Score</span>
              <span className="text-sm font-oxanium text-blue-400">{scoreSummary.averageScore.toFixed(1)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-oxanium text-gray-300">Total Score</span>
              <span className="text-sm font-oxanium text-electric-cyan">{scoreSummary.totalScore}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Score History */}
      <div className="bg-midnight-light/30 rounded-lg border border-gray-600 p-6">
        <h3 className="text-lg font-oxanium font-medium text-electric-cyan mb-4">Score History</h3>
        {scoreSummary.recentScores && scoreSummary.recentScores.length > 0 ? (
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
                {scoreSummary.recentScores.map((score: any, index: number) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-oxanium text-gray-300">
                      {score.eventName || 'Unknown Event'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-oxanium text-gray-300">
                      {new Date(score.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-oxanium font-bold text-electric-cyan">
                      {score.score}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-oxanium text-yellow-400">
                      {score.xCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-oxanium text-gray-300">
                      {score.position || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 font-oxanium text-center py-8">No score history available</p>
        )}
      </div>
    </div>
  );
};

// Events Tab Component
const EventsTab: React.FC<{ dashboard: UserDashboardData | null }> = ({ dashboard }) => {
  if (!dashboard) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 font-oxanium">Loading events data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Recent Events */}
      <div className="bg-midnight-light/30 rounded-lg border border-gray-600 p-6">
        <h3 className="text-lg font-oxanium font-medium text-electric-cyan mb-4">Recent Events</h3>
        {dashboard.recentEvents && dashboard.recentEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboard.recentEvents.map((event: any, index: number) => (
              <div key={index} className="bg-midnight-light/20 rounded-lg p-4 border border-gray-600">
                <h4 className="text-sm font-oxanium font-medium text-gray-300 mb-2">{event.title}</h4>
                <p className="text-xs text-gray-400 font-oxanium mb-2">{event.location}</p>
                <p className="text-xs text-gray-400 font-oxanium mb-3">{new Date(event.date).toLocaleDateString()}</p>
                <div className="flex justify-between items-center">
                  <span className={`text-xs px-2 py-1 rounded-full font-oxanium ${
                    event.status === 'completed' ? 'bg-green-900/50 text-green-400' :
                    event.status === 'ongoing' ? 'bg-blue-900/50 text-blue-400' :
                    'bg-gray-900/50 text-gray-400'
                  }`}>
                    {event.status}
                  </span>
                  {event.result && (
                    <span className="text-xs font-oxanium text-electric-cyan">
                      Score: {event.result.score}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 font-oxanium text-center py-4">No recent events</p>
        )}
      </div>

      {/* Upcoming Events */}
      <div className="bg-midnight-light/30 rounded-lg border border-gray-600 p-6">
        <h3 className="text-lg font-oxanium font-medium text-electric-cyan mb-4">Upcoming Events</h3>
        {dashboard.upcomingEvents && dashboard.upcomingEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboard.upcomingEvents.map((event: any, index: number) => (
              <div key={index} className="bg-midnight-light/20 rounded-lg p-4 border border-gray-600">
                <h4 className="text-sm font-oxanium font-medium text-gray-300 mb-2">{event.title}</h4>
                <p className="text-xs text-gray-400 font-oxanium mb-2">{event.location}</p>
                <p className="text-xs text-gray-400 font-oxanium mb-3">{new Date(event.date).toLocaleDateString()}</p>
                <div className="flex justify-between items-center">
                  <span className={`text-xs px-2 py-1 rounded-full font-oxanium ${
                    event.status === 'open' ? 'bg-green-900/50 text-green-400' :
                    event.status === 'full' ? 'bg-yellow-900/50 text-yellow-400' :
                    'bg-red-900/50 text-red-400'
                  }`}>
                    {event.status}
                  </span>
                  <button className="text-xs font-oxanium text-electric-cyan hover:text-electric-neon transition-colors duration-200">
                    Register
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 font-oxanium text-center py-4">No upcoming events</p>
        )}
      </div>
    </div>
  );
};

// Statistics Tab Component
const StatisticsTab: React.FC<{ dashboard: UserDashboardData | null }> = ({ dashboard }) => {
  if (!dashboard) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 font-oxanium">Loading statistics data...</p>
      </div>
    );
  }

  const { scoreSummary } = dashboard;

  return (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-midnight-light/30 rounded-lg border border-gray-600 p-6 text-center">
          <div className="text-3xl font-oxanium font-bold text-electric-cyan mb-2">
            {scoreSummary.totalMatches}
          </div>
          <p className="text-sm font-oxanium text-gray-400">Total Matches</p>
        </div>

        <div className="bg-midnight-light/30 rounded-lg border border-gray-600 p-6 text-center">
          <div className="text-3xl font-oxanium font-bold text-green-400 mb-2">
            {scoreSummary.personalBest}
          </div>
          <p className="text-sm font-oxanium text-gray-400">Personal Best</p>
        </div>

        <div className="bg-midnight-light/30 rounded-lg border border-gray-600 p-6 text-center">
          <div className="text-3xl font-oxanium font-bold text-blue-400 mb-2">
            {scoreSummary.averageScore.toFixed(1)}
          </div>
          <p className="text-sm font-oxanium text-gray-400">Average Score</p>
        </div>

        <div className="bg-midnight-light/30 rounded-lg border border-gray-600 p-6 text-center">
          <div className="text-3xl font-oxanium font-bold text-yellow-400 mb-2">
            {scoreSummary.totalXCount}
          </div>
          <p className="text-sm font-oxanium text-gray-400">Total X Count</p>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-midnight-light/30 rounded-lg border border-gray-600 p-6">
          <h3 className="text-lg font-oxanium font-medium text-electric-cyan mb-4">Score Analysis</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm font-oxanium mb-1">
                <span className="text-gray-300">Score Range</span>
                <span className="text-gray-300">Count</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-oxanium">
                  <span className="text-gray-400">90-100</span>
                  <span className="text-electric-cyan">5</span>
                </div>
                <div className="flex justify-between text-sm font-oxanium">
                  <span className="text-gray-400">80-89</span>
                  <span className="text-electric-cyan">12</span>
                </div>
                <div className="flex justify-between text-sm font-oxanium">
                  <span className="text-gray-400">70-79</span>
                  <span className="text-electric-cyan">8</span>
                </div>
                <div className="flex justify-between text-sm font-oxanium">
                  <span className="text-gray-400">Below 70</span>
                  <span className="text-electric-cyan">3</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-midnight-light/30 rounded-lg border border-gray-600 p-6">
          <h3 className="text-lg font-oxanium font-medium text-electric-cyan mb-4">Performance Trends</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-oxanium text-gray-300 mb-2">Progress Over Time</p>
              <div className="h-32 bg-midnight-light/20 rounded-lg flex items-end justify-center space-x-1 p-4">
                <div className="w-4 bg-electric-cyan rounded-t" style={{ height: '60%' }}></div>
                <div className="w-4 bg-electric-cyan rounded-t" style={{ height: '75%' }}></div>
                <div className="w-4 bg-electric-cyan rounded-t" style={{ height: '85%' }}></div>
                <div className="w-4 bg-electric-cyan rounded-t" style={{ height: '70%' }}></div>
                <div className="w-4 bg-electric-cyan rounded-t" style={{ height: '90%' }}></div>
                <div className="w-4 bg-electric-cyan rounded-t" style={{ height: '95%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

// Make this page server-side rendered to avoid useAuth issues during static generation
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {}
  };
}; 