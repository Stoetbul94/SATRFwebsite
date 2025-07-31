'use client';

import { useState, useEffect } from 'react';
import { FiFilter, FiDownload, FiPrinter, FiUsers, FiTarget } from 'react-icons/fi';
import { FaTrophy } from 'react-icons/fa';
import Layout from '@/components/layout/Layout';
import { leaderboardAPI } from '@/lib/api';
import type { LeaderboardEntry } from '@/lib/api';

type LeaderboardType = 'overall' | 'event' | 'club';
type TimePeriod = 'all' | 'year' | 'month' | 'week';

export default function Leaderboard() {
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('overall');
  const [discipline, setDiscipline] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [loading, setLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState<{
    data: LeaderboardEntry[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    filters?: Record<string, any>;
  } | null>(null);

  // Fetch leaderboard data
  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      let data;
      
      switch (leaderboardType) {
        case 'overall':
          data = await leaderboardAPI.getOverall({
            discipline: discipline || undefined,
            category: category || undefined,
            time_period: timePeriod,
            page,
            limit,
          });
          break;
        case 'club':
          data = await leaderboardAPI.getClubLeaderboard({
            time_period: timePeriod,
            page,
            limit,
          });
          break;
        default:
          data = await leaderboardAPI.getOverall({
            discipline: discipline || undefined,
            category: category || undefined,
            time_period: timePeriod,
            page,
            limit,
          });
      }
      
      setLeaderboardData(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [leaderboardType, discipline, category, timePeriod, page]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleExport = () => {
    // Export functionality would be implemented here
    console.log('Export leaderboard data');
  };

  const handlePrint = () => {
    window.print();
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <FaTrophy className="text-yellow-500 text-xl" />;
      case 2:
        return <FaTrophy className="text-gray-400 text-xl" />;
      case 3:
        return <FaTrophy className="text-orange-600 text-xl" />;
      default:
        return <span className="text-gray-500 font-medium">{rank}</span>;
    }
  };

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

  if (loading && !leaderboardData) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4 w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded mb-8 w-1/2"></div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="space-y-4">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded"></div>
                  ))}
                </div>
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
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Leaderboard
            </h1>
            <p className="text-gray-600">
              View rankings and performance statistics across all disciplines
            </p>
          </div>

          {/* Filters */}
          <div className="card mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4 items-center">
                {/* Leaderboard Type */}
                <div className="flex items-center space-x-2">
                  <FiFilter className="text-gray-400" />
                  <select
                    value={leaderboardType}
                    onChange={(e) => {
                      setLeaderboardType(e.target.value as LeaderboardType);
                      setPage(1);
                    }}
                    className="input-field text-sm"
                  >
                    <option value="overall">Overall Rankings</option>
                    <option value="club">Club Rankings</option>
                  </select>
                </div>

                {/* Discipline Filter */}
                {leaderboardType === 'overall' && (
                  <select
                    value={discipline}
                    onChange={(e) => {
                      setDiscipline(e.target.value);
                      setPage(1);
                    }}
                    className="input-field text-sm"
                  >
                    <option value="">All Disciplines</option>
                    <option value="10m Air Rifle">10m Air Rifle</option>
                    <option value="10m Air Pistol">10m Air Pistol</option>
                    <option value="50m Rifle 3 Positions">50m Rifle 3 Positions</option>
                    <option value="50m Rifle Prone">50m Rifle Prone</option>
                    <option value="25m Rapid Fire Pistol">25m Rapid Fire Pistol</option>
                    <option value="25m Standard Pistol">25m Standard Pistol</option>
                    <option value="25m Center Fire Pistol">25m Center Fire Pistol</option>
                    <option value="50m Pistol">50m Pistol</option>
                    <option value="Skeet">Skeet</option>
                    <option value="Trap">Trap</option>
                    <option value="Double Trap">Double Trap</option>
                  </select>
                )}

                {/* Category Filter */}
                {leaderboardType === 'overall' && (
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setPage(1);
                    }}
                    className="input-field text-sm"
                  >
                    <option value="">All Categories</option>
                    <option value="junior">Junior</option>
                    <option value="senior">Senior</option>
                    <option value="veteran">Veteran</option>
                  </select>
                )}

                {/* Time Period Filter */}
                <select
                  value={timePeriod}
                  onChange={(e) => {
                    setTimePeriod(e.target.value as TimePeriod);
                    setPage(1);
                  }}
                  className="input-field text-sm"
                >
                  <option value="all">All Time</option>
                  <option value="year">This Year</option>
                  <option value="month">This Month</option>
                  <option value="week">This Week</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  className="btn-secondary text-sm flex items-center"
                >
                  <FiDownload className="mr-1" />
                  Export
                </button>
                <button
                  onClick={handlePrint}
                  className="btn-secondary text-sm flex items-center"
                >
                  <FiPrinter className="mr-1" />
                  Print
                </button>
              </div>
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="card">
            {loading ? (
              <div className="animate-pulse space-y-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : leaderboardData && leaderboardData.data.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rank
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Club
                        </th>
                        {leaderboardType === 'overall' && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                        )}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Best Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Average
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          X-Count
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Events
                        </th>
                        {leaderboardType === 'club' && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Members
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {leaderboardData.data.map((entry) => (
                        <tr key={entry.userId || entry.club} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getRankIcon(entry.rank)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {entry.userName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {entry.club}
                            </div>
                          </td>
                          {leaderboardType === 'overall' && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                entry.category === 'junior' ? 'bg-blue-100 text-blue-800' :
                                entry.category === 'senior' ? 'bg-green-100 text-green-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                {entry.category.charAt(0).toUpperCase() + entry.category.slice(1)}
                              </span>
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {entry.bestScore}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {entry.averageScore}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {entry.totalXCount}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {entry.eventCount}
                            </div>
                          </td>
                          {leaderboardType === 'club' && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {entry.memberCount}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {leaderboardData.total_pages > 1 && (
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page === leaderboardData.total_pages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing{' '}
                          <span className="font-medium">
                            {((page - 1) * limit) + 1}
                          </span>{' '}
                          to{' '}
                          <span className="font-medium">
                            {Math.min(page * limit, leaderboardData.total)}
                          </span>{' '}
                          of{' '}
                          <span className="font-medium">{leaderboardData.total}</span>{' '}
                          results
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <button
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          
                          {Array.from({ length: Math.min(5, leaderboardData.total_pages) }, (_, i) => {
                            const pageNum = i + 1;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  page === pageNum
                                    ? 'z-10 bg-satrf-lightBlue border-satrf-lightBlue text-white'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                          
                          <button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page === leaderboardData.total_pages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <FiTarget className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No rankings found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your filters or check back later for updated rankings.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
} 