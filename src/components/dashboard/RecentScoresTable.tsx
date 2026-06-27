import Link from 'next/link';
import { FiTarget } from 'react-icons/fi';
import { DISCIPLINES } from '@/lib/issf';
import { formatScorePair, qualScoreVariant, ringTotalForScore } from '@/lib/rankingsDisplay';
import { STAGE_LABELS } from '@/lib/athleteAnalytics';
import type { Score } from '@/types/scores';

interface RecentScoresTableProps {
  scores: Score[];
}

function statusBadge(status: string) {
  const base = 'px-2 py-1 rounded-full text-xs font-medium';
  if (status === 'official') return `${base} bg-green-100 text-green-800`;
  if (status === 'provisional') return `${base} bg-yellow-100 text-yellow-800`;
  return `${base} bg-gray-100 text-gray-800`;
}

function formatTotal(score: Score): string {
  const stage = score.stage ?? 'qualification';
  const rings = ringTotalForScore(score);
  const pair = formatScorePair(
    score.decimalTotal,
    rings,
    qualScoreVariant(score.discipline, stage),
  );
  if (pair.secondary) return `${pair.primary} (${pair.secondary})`;
  return pair.primary;
}

export default function RecentScoresTable({ scores }: RecentScoresTableProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Recent Scores</h2>
        <Link href="/scores" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
          Season rankings →
        </Link>
      </div>
      {scores.length === 0 ? (
        <div className="text-center py-8">
          <FiTarget className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600 mb-2">No scores yet</p>
          <Link href="/scores" className="text-blue-600 hover:text-blue-800 font-medium">
            View season rankings →
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discipline
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inner 10s
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {scores.map((score) => (
                <tr key={score.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {score.date ? new Date(score.date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 max-w-[10rem] truncate">
                    {score.eventName}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {DISCIPLINES[score.discipline]?.label ?? score.discipline}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {STAGE_LABELS[score.stage ?? 'qualification']}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {formatTotal(score)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {score.innerTens ?? 0}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={statusBadge(score.status)}>{score.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
