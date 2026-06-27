import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiCalendar, FiEdit, FiEye } from 'react-icons/fi';
import { useAuth, useProtectedRoute } from '../../contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { shouldRedirectAdminFromDashboard } from '@/lib/userAthlete';
import { auth } from '@/lib/firebase';
import { buildAthleteAnalytics, type AthleteAnalyticsSummary } from '@/lib/athleteAnalytics';
import AthleteSummaryCards from '@/components/dashboard/AthleteSummaryCards';
import DisciplineTabs from '@/components/dashboard/DisciplineTabs';
import DisciplinePerformancePanel from '@/components/dashboard/DisciplinePerformancePanel';
import RecentScoresTable from '@/components/dashboard/RecentScoresTable';
import type { Score } from '@/types/scores';

export default function Dashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [analytics, setAnalytics] = useState<AthleteAnalyticsSummary | null>(null);
  const [recentScores, setRecentScores] = useState<Score[]>([]);
  const [overallRank, setOverallRank] = useState<number | null>(null);
  const [activeDiscipline, setActiveDiscipline] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useProtectedRoute();

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (shouldRedirectAdminFromDashboard(user)) {
        router.replace('/admin/dashboard');
      }
    }
  }, [user, isAuthenticated, authLoading, router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (!isAuthenticated || !user) return;

        const token = await auth.currentUser?.getIdToken();
        const myScoresRes = await fetch('/api/scores/my-scores', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const myScoresJson = await myScoresRes.json().catch(() => ({ data: [] }));
        const myScores: Score[] = myScoresJson.data || [];

        setRecentScores(myScores.slice(0, 10));

        const built = buildAthleteAnalytics(myScores);
        setAnalytics(built);
        if (built.disciplines.length > 0) {
          setActiveDiscipline((prev) =>
            prev && built.disciplines.some((d) => d.discipline === prev)
              ? prev
              : built.disciplines[0].discipline,
          );
        }

        const lbRes = await fetch('/api/leaderboard/overall?discipline=prone_50m').catch(() => null);
        const lbJson = lbRes ? await lbRes.json().catch(() => ({ data: [] })) : { data: [] };
        const userRank = (lbJson.data || []).findIndex((e: { userId: string }) => e.userId === user.id) + 1;
        setOverallRank(userRank > 0 ? userRank : null);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setAnalytics({
          totalQualCompetitions: 0,
          totalFinalCompetitions: 0,
          disciplinesActive: 0,
          totalInnerTens: 0,
          totalScoreRecords: 0,
          disciplines: [],
        });
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && isAuthenticated) {
      fetchDashboardData();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [isAuthenticated, user, authLoading]);

  const activePanel = analytics?.disciplines.find((d) => d.discipline === activeDiscipline);

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 bg-gray-200 rounded" />
              ))}
            </div>
            <div className="h-80 bg-gray-200 rounded" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <Layout>
      <Head>
        <title>Dashboard - SATRF</title>
        <meta
          name="description"
          content="Your SATRF athlete dashboard — competition history, performance charts, and scores by discipline."
        />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8" id="performance">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user.firstName}!
            </h1>
            <p className="text-gray-600">
              Your competition history and performance trends across disciplines
            </p>
          </div>

          {analytics && (
            <AthleteSummaryCards summary={analytics} overallRank={overallRank} />
          )}

          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">
                  {user.firstName} {user.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Membership</p>
                <p className="font-medium capitalize">{user.membershipType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Club</p>
                <p className="font-medium">{user.club}</p>
              </div>
            </div>
          </div>

          {analytics && analytics.disciplines.length > 0 ? (
            <>
              <DisciplineTabs
                disciplines={analytics.disciplines}
                active={activeDiscipline}
                onChange={setActiveDiscipline}
              />
              {activePanel && <DisciplinePerformancePanel analytics={activePanel} />}
            </>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 mb-8 text-center">
              <p className="text-gray-600 mb-2">No competition scores linked to your account yet.</p>
              <p className="text-sm text-gray-500">
                Scores appear here once recorded at an event by SATRF officials.
              </p>
            </div>
          )}

          <RecentScoresTable scores={recentScores} />

          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/scores"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FiEye className="h-5 w-5 text-green-600 mr-3" />
                <span className="font-medium">Season Rankings</span>
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

          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
