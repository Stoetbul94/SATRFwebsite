import { FiAward, FiCalendar, FiTarget, FiTrendingUp } from 'react-icons/fi';
import type { AthleteAnalyticsSummary } from '@/lib/athleteAnalytics';

interface AthleteSummaryCardsProps {
  summary: AthleteAnalyticsSummary;
  overallRank: number | null;
}

export default function AthleteSummaryCards({ summary, overallRank }: AthleteSummaryCardsProps) {
  const bestQual = summary.disciplines
    .flatMap((d) => d.qualSeries)
    .reduce<{ value: number; label: string } | null>((best, p) => {
      if (!best || p.primaryValue > best.value) {
        return { value: p.primaryValue, label: p.label };
      }
      return best;
    }, null);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FiCalendar className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Qual Competitions</p>
            <p className="text-2xl font-bold text-gray-900">{summary.totalQualCompetitions}</p>
            <p className="text-xs text-gray-500">{summary.totalFinalCompetitions} finals</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <FiTarget className="h-6 w-6 text-indigo-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Disciplines</p>
            <p className="text-2xl font-bold text-gray-900">{summary.disciplinesActive}</p>
            <p className="text-xs text-gray-500">{summary.totalScoreRecords} score records</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-2 bg-green-100 rounded-lg">
            <FiTrendingUp className="h-6 w-6 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Best Qualification</p>
            <p className="text-2xl font-bold text-gray-900">{bestQual?.label ?? '—'}</p>
            <p className="text-xs text-gray-500">{summary.totalInnerTens} inner 10s total</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-2 bg-amber-100 rounded-lg">
            <FiAward className="h-6 w-6 text-amber-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Prone Season Rank</p>
            <p className="text-2xl font-bold text-gray-900">
              {overallRank ? `#${overallRank}` : 'N/A'}
            </p>
            <p className="text-xs text-gray-500">Qualification leaderboard</p>
          </div>
        </div>
      </div>
    </div>
  );
}
