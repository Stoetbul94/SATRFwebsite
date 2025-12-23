import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiTarget, FiCalendar, FiTrendingUp, FiUsers, FiAward, FiUpload, FiEye, FiEdit, FiInfo } from 'react-icons/fi';
import { useAuth, useProtectedRoute } from '../../contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { isUserAdmin } from '@/lib/userRole';
import { isEmailAdmin } from '@/lib/adminClient';

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
  // Use AuthContext instead of local state
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  // Local state for dashboard data
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Protected route guard - redirect to login if not authenticated
  useProtectedRoute();

  // CRITICAL: Redirect admins to admin dashboard - they must NEVER see user dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      const isAdmin = isUserAdmin(user as any) || isEmailAdmin(user.email);
      if (isAdmin) {
        // Admin detected: redirect to admin dashboard immediately
        router.replace('/admin/dashboard');
      }
    }
  }, [user, isAuthenticated, authLoading, router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Only fetch data if user is authenticated
        if (isAuthenticated && user) {
          // Fetch user's own scores from API
          const { scoresAPI, leaderboardAPI } = await import('@/lib/api');
          
          // Get user's scores (only their own)
          const myScoresResponse = await scoresAPI.getMyScores(1, 100);
          const myScores = myScoresResponse.data || [];
          
          // Calculate statistics from user's own scores
          const approvedScores = myScores.filter((s: any) => s.status === 'approved');
          const totalScores = approvedScores.length;
          const bestScore = approvedScores.length > 0 
            ? Math.max(...approvedScores.map((s: any) => s.score))
            : 0;
          const averageScore = approvedScores.length > 0
            ? Math.round(approvedScores.reduce((sum: number, s: any) => sum + s.score, 0) / approvedScores.length)
            : 0;
          const totalXCount = approvedScores.reduce((sum: number, s: any) => sum + (s.xCount || 0), 0);
          
          // Get user's ranking (if available)
          const leaderboardData = await leaderboardAPI.getOverall({}).catch(() => ({ data: [] }));
          const userRank = leaderboardData.data.findIndex((entry: any) => entry.userId === user.id) + 1;
          
          const calculatedStats: DashboardStats = {
            totalScores,
            bestScore,
            averageScore,
            totalXCount,
            currentRank: userRank > 0 ? userRank : null,
            clubRank: null, // Would need club-specific leaderboard
            categoryRank: null, // Would need category-specific leaderboard
          };
          setStats(calculatedStats);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set default stats on error
        setStats({
          totalScores: 0,
          bestScore: 0,
          averageScore: 0,
          totalXCount: 0,
          currentRank: null,
          clubRank: null,
          categoryRank: null,
        });
      } finally {
        setLoading(false);
      }
    };

    // Only fetch data when auth is complete and user is authenticated
    if (!authLoading && isAuthenticated) {
      fetchDashboardData();
    } else if (!authLoading && !isAuthenticated) {
      // If not authenticated, stop loading
      setLoading(false);
    }
  }, [isAuthenticated, user, authLoading]);

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

  // Show loading state while auth is being checked or data is loading
  if (authLoading || loading) {
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

  // Don't render anything if not authenticated (will be redirected by useProtectedRoute)
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <Layout>
      <Head>
        <title>Dashboard - SATRF</title>
        <meta name="description" content="Your personal shooting dashboard. View your scores, statistics, and performance metrics." />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Demo Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiInfo className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Demo Dashboard
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Welcome, {user.firstName} {user.lastName}! This is a demo dashboard showing mock data. 
                    In a real application, this would display your actual shooting statistics, recent scores, and upcoming events.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user.firstName}!
            </h1>
            <p className="text-gray-600">
              Here's your shooting performance overview
            </p>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FiTarget className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Scores</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalScores}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FiTrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Best Score</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.bestScore}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FiAward className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Average Score</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.averageScore}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* User Info */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">{user.firstName} {user.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Membership Type</p>
                <p className="font-medium capitalize">{user.membershipType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Club</p>
                <p className="font-medium">{user.club}</p>
              </div>
            </div>
          </div>

          {/* Rankings */}
          {stats && (
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Rankings</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Overall Rank</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.currentRank ? `#${stats.currentRank}` : 'N/A'}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Club Rank</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.clubRank ? `#${stats.clubRank}` : 'N/A'}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Category Rank</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.categoryRank ? `#${stats.categoryRank}` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/scores"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FiEye className="h-5 w-5 text-green-600 mr-3" />
                <span className="font-medium">View Scores</span>
              </Link>
              <Link
                href="/profile"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FiEdit className="h-5 w-5 text-purple-600 mr-3" />
                <span className="font-medium">Edit Profile</span>
              </Link>
              <Link
                href="/events"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FiCalendar className="h-5 w-5 text-orange-600 mr-3" />
                <span className="font-medium">View Events</span>
              </Link>
            </div>
          </div>

          {/* Back to Home Link */}
          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
} 