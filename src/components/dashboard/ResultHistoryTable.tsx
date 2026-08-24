import Link from 'next/link';
import { DISCIPLINES } from '@/lib/issf';
import { STAGE_LABELS } from '@/lib/athleteAnalytics';
import { formatScoreTotalDisplay } from '@/lib/rankingsDisplay';
import type { Score } from '@/types/scores';

interface ResultHistoryTableProps {
  scores: Score[];
}

export default function ResultHistoryTable({ scores }: ResultHistoryTableProps) {
  const sorted = [...scores].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

  return (
    <section className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Result History</h2>

      {sorted.length === 0 ? (
        <p className="text-sm text-gray-500">No results to display.</p>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {sorted.map((score) => (
              <div key={score.id} className="border border-gray-200 rounded-lg p-3">
                <p className="text-sm text-gray-500">
                  {score.date ? new Date(score.date).toLocaleDateString('en-ZA') : '—'}
                </p>
                <Link
                  href={score.eventId ? `/events/${score.eventId}` : '#'}
                  className="font-medium text-blue-800 hover:underline"
                >
                  {score.eventName}
                </Link>
                <p className="text-sm text-gray-700 mt-1">
                  {DISCIPLINES[score.discipline]?.label ?? score.discipline} ·{' '}
                  {STAGE_LABELS[score.stage ?? 'qualification']}
                </p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {formatScoreTotalDisplay(score)}
                </p>
                {score.finalRank != null && (
                  <p className="text-xs text-gray-500">Rank #{score.finalRank}</p>
                )}
              </div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Discipline</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sorted.map((score) => (
                  <tr key={score.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap">
                      {score.date ? new Date(score.date).toLocaleDateString('en-ZA') : '—'}
                    </td>
                    <td className="px-3 py-2 max-w-[12rem] truncate">
                      {score.eventId ? (
                        <Link href={`/events/${score.eventId}`} className="text-blue-800 hover:underline">
                          {score.eventName}
                        </Link>
                      ) : (
                        score.eventName
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {DISCIPLINES[score.discipline]?.label ?? score.discipline}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {STAGE_LABELS[score.stage ?? 'qualification']}
                    </td>
                    <td className="px-3 py-2 font-semibold whitespace-nowrap">
                      {formatScoreTotalDisplay(score)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {score.finalRank != null ? `#${score.finalRank}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
