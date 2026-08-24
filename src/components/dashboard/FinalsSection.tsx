import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AthleteChartPoint } from '@/lib/athleteAnalytics';
import { STAGE_LABELS } from '@/lib/athleteAnalytics';
import type { Score } from '@/types/scores';

interface FinalsSectionProps {
  finalScores: Score[];
  finalSeries: AthleteChartPoint[];
}

export default function FinalsSection({ finalScores, finalSeries }: FinalsSectionProps) {
  if (!finalSeries.length) {
    return (
      <section className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Finals</h2>
        <p className="text-sm text-gray-500">No final scores recorded for this discipline yet.</p>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Finals</h2>
        <p className="text-sm text-gray-500">Final results are kept separate from qualification trends.</p>
      </div>

      <div className="space-y-4 md:hidden">
        {finalSeries
          .slice()
          .reverse()
          .map((row) => {
            const score = finalScores.find((s) => s.id === row.id);
            return (
              <div key={row.id} className="border border-gray-200 rounded-lg p-3">
                <p className="font-medium text-gray-900">{row.eventName}</p>
                <p className="text-sm text-gray-500">
                  {row.date ? new Date(row.date).toLocaleDateString('en-ZA') : '—'}
                </p>
                <p className="text-lg font-bold text-gray-900 mt-1">{row.label}</p>
                {row.finalRank != null && (
                  <p className="text-sm text-gray-600">Rank #{row.finalRank}</p>
                )}
                {row.eliminatedAtShot != null && (
                  <p className="text-sm text-gray-600">Eliminated at shot {row.eliminatedAtShot}</p>
                )}
                {score?.finalShots?.length ? (
                  <FinalProgression shots={score.finalShots} />
                ) : null}
              </div>
            );
          })}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {finalSeries
              .slice()
              .reverse()
              .map((row) => {
                const score = finalScores.find((s) => s.id === row.id);
                return (
                  <tr key={row.id}>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {row.date ? new Date(row.date).toLocaleDateString('en-ZA') : '—'}
                    </td>
                    <td className="px-3 py-2">{row.eventName}</td>
                    <td className="px-3 py-2">{STAGE_LABELS[row.stage]}</td>
                    <td className="px-3 py-2 font-semibold">{row.label}</td>
                    <td className="px-3 py-2">{row.finalRank != null ? `#${row.finalRank}` : '—'}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {finalScores.some((s) => s.finalShots?.length) ? (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Final Progression
          </h3>
          {finalScores
            .filter((s) => s.finalShots?.length)
            .slice(-1)
            .map((s) => (
              <div key={s.id}>
                <p className="text-sm text-gray-600 mb-2">{s.eventName}</p>
                <FinalProgression shots={s.finalShots!} />
              </div>
            ))}
        </div>
      ) : null}
    </section>
  );
}

function FinalProgression({ shots }: { shots: number[] }) {
  let cumulative = 0;
  const data = shots.map((shot, index) => {
    cumulative += shot;
    return {
      shot: index + 1,
      value: shot,
      cumulative: Math.round(cumulative * 10) / 10,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis dataKey="shot" tick={{ fontSize: 10 }} label={{ value: 'Shot', position: 'insideBottom', offset: -4 }} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip />
        <Bar dataKey="value" fill="#e53e3e" radius={[2, 2, 0, 0]} name="Shot score" />
      </BarChart>
    </ResponsiveContainer>
  );
}
