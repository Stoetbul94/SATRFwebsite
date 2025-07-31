'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiTarget, FiCalendar, FiTrendingUp, FiUsers, FiAward, FiUpload, FiEye, FiEdit } from 'react-icons/fi';
import Layout from '@/components/layout/Layout';
import { dashboardAPI, scoresAPI, eventsAPI, leaderboardAPI, authAPI } from '@/lib/api';
import type { Score, Event } from '@/lib/api';

interface DashboardStats {
  totalScores: number;
  bestScore: number;
  averageScore: number;
  totalXCount: number;
  currentRank: number | null;
  clubRank: number | null;
  categoryRank: number | null;
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentScores, setRecentScores] = useState<Score[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Get current user
        const userData = await authAPI.getCurrentUser();
        setUser(userData);

        // Get user statistics
        const statsData = await leaderboardAPI.getStatistics();
        setStats(statsData.data.statistics);

        // Get recent scores
        const scoresData = await scoresAPI.getMyScores(1, 5);
        setRecentScores(scoresData.data);

        // Get upcoming events
        const eventsData = await eventsAPI.getAll({ status: 'open' });
        setUpcomingEvents(eventsData.slice(0, 3));

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4 w-1/3"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-64 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.firstName}!
            </h1>
            <p className="text-gray-600">
              Here's your shooting performance overview and upcoming activities
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center">
                <div className="bg-satrf-lightBlue rounded-full w-12 h-12 flex items-center justify-center">
                  <FiTarget className="text-white text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Best Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.bestScore || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="bg-green-500 rounded-full w-12 h-12 flex items-center justify-center">
                  <FiTrendingUp className="text-white text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Average Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.averageScore || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="bg-purple-500 rounded-full w-12 h-12 flex items-center justify-center">
                  <FiAward className="text-white text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Current Rank</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.currentRank ? `#${stats.currentRank}` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/scores/upload"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FiUpload className="text-satrf-lightBlue text-xl mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Upload Score</p>
                  <p className="text-sm text-gray-500">Submit new score</p>
                </div>
              </Link>

              <Link
                href="/events"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FiCalendar className="text-satrf-lightBlue text-xl mr-3" />
                <div>
                  <p className="font-medium text-gray-900">View Events</p>
                  <p className="text-sm text-gray-500">Browse competitions</p>
                </div>
              </Link>

              <Link
                href="/scores/leaderboard"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FiAward className="text-satrf-lightBlue text-xl mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Leaderboard</p>
                  <p className="text-sm text-gray-500">Check rankings</p>
                </div>
              </Link>

              <Link
                href="/profile"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FiUsers className="text-satrf-lightBlue text-xl mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Profile</p>
                  <p className="text-sm text-gray-500">Update details</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Scores */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Recent Scores</h2>
                <Link
                  href="/scores"
                  className="text-satrf-lightBlue hover:text-satrf-navy text-sm font-medium"
                >
                  View all
                </Link>
              </div>

              {recentScores.length > 0 ? (
                <div className="space-y-4">
                  {recentScores.map((score) => (
                    <div
                      key={score.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center">
                        <div className="bg-satrf-lightBlue rounded-full w-10 h-10 flex items-center justify-center">
                          <FiTarget className="text-white" />
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">
                            {score.discipline}
                          </p>
                          <p className="text-sm text-gray-500">
                            Score: {score.score}
                            {score.xCount && ` (${score.xCount} X)`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={getStatusBadge(score.status)}>
                          {score.status}
                        </span>
                        <Link
                          href={`/scores/${score.id}`}
                          className="text-satrf-lightBlue hover:text-satrf-navy"
                        >
                          <FiEye className="text-lg" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FiTarget className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No scores yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Upload your first score to get started.
                  </p>
                  <div className="mt-6">
                    <Link
                      href="/scores/upload"
                      className="btn-primary"
                    >
                      Upload Score
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Upcoming Events */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Upcoming Events</h2>
                <Link
                  href="/events"
                  className="text-satrf-lightBlue hover:text-satrf-navy text-sm font-medium"
                >
                  View all
                </Link>
              </div>

              {upcomingEvents.length > 0 ? (
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">
                            {event.title}
                          </h3>
                          <p className="text-sm text-gray-500 mb-2">
                            {new Date(event.date).toLocaleDateString()} • {event.location}
                          </p>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              event.status === 'open' ? 'bg-green-100 text-green-800' :
                              event.status === 'full' ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {event.type}
                            </span>
                          </div>
                        </div>
                        <Link
                          href={`/events/register/${event.id}`}
                          className="btn-secondary text-sm"
                        >
                          Register
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FiCalendar className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming events</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Check back later for new competitions.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Performance Statistics */}
          <div className="mt-8 card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-satrf-navy mb-2">
                  {stats?.totalScores || 0}
                </div>
                <div className="text-sm text-gray-600">Total Scores</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-satrf-navy mb-2">
                  {stats?.totalXCount || 0}
                </div>
                <div className="text-sm text-gray-600">Total X-Count</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-satrf-navy mb-2">
                  {stats?.categoryRank ? `#${stats.categoryRank}` : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Category Rank</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-satrf-navy mb-2">
                  {stats?.clubRank ? `#${stats.clubRank}` : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Club Rank</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 