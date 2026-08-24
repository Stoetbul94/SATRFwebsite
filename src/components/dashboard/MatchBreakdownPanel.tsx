import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { STAGE_LABELS } from '@/lib/athleteAnalytics';
import { formatScoreTotalDisplay } from '@/lib/rankingsDisplay';
import type { Discipline, Position, Score } from '@/types/scores';

interface MatchBreakdownPanelProps {
  score: Score | null;
  discipline: Discipline;
  onClear: () => void;
}

const POSITION_ORDER: Position[] = ['kneeling', 'prone', 'standing'];

function positionLabel(position: Position): string {
  return position.charAt(0).toUpperCase() + position.slice(1);
}

function seriesChartData(score: Score, position?: Position) {
  const blocks = position
    ? score.positions?.filter((p) => p.position === position)
    : score.positions;

  const series = (blocks ?? []).flatMap((b) => b.series ?? []);
  return series.map((s) => ({
    name: `S${s.seriesNumber}`,
    decimal: s.decimal,
    integer: s.integer,
    innerTens: s.innerTens ?? 0,
    label: `${s.decimal.toFixed(1)} / ${s.integer}`,
  }));
}

export default function MatchBreakdownPanel({
  score,
  discipline,
  onClear,
}: MatchBreakdownPanelProps) {
  const [expandedSeries, setExpandedSeries] = useState<string | null>(null);

  if (!score) {
    return (
      <section className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Match Breakdown</h2>
        <p className="text-sm text-gray-500">
          Select a point on the score progression chart to view series breakdown.
        </p>
      </section>
    );
  }

  const is3P = discipline === 'three_position_50m';
  const positions = is3P
    ? POSITION_ORDER.filter((p) => score.positions?.some((b) => b.position === p))
    : [undefined];

  return (
    <section className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Match Breakdown</h2>
          <p className="font-medium text-gray-800">{score.eventName}</p>
          <p className="text-sm text-gray-500">
            {score.date ? new Date(score.date).toLocaleDateString('en-ZA') : '—'} ·{' '}
            {STAGE_LABELS[score.stage ?? 'qualification']} · {formatScoreTotalDisplay(score)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-sm text-blue-700 font-medium min-h-[44px] px-2"
        >
          Clear selection
        </button>
      </div>

      {positions.map((position) => {
        const data = seriesChartData(score, position);
        if (!data.length) return null;
        const block = position
          ? score.positions?.find((p) => p.position === position)
          : score.positions?.[0];

        return (
          <div key={position ?? 'all'} className="mb-8 last:mb-0">
            {position ? (
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                {positionLabel(position)} — {block?.decimalTotal?.toFixed(1) ?? '—'} (
                {block?.integerTotal ?? '—'} rings)
              </h3>
            ) : (
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                Series
              </h3>
            )}

            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                <Tooltip formatter={(_, __, props) => [props.payload.label, 'Series total']} />
                <Bar
                  dataKey="decimal"
                  fill="#1a365d"
                  radius={[4, 4, 0, 0]}
                  onClick={(entry) => setExpandedSeries(String(entry.name))}
                />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {(block?.series ?? []).map((s) => {
                const key = `S${s.seriesNumber}`;
                const isOpen = expandedSeries === key;
                return (
                  <div
                    key={key}
                    className="rounded border border-gray-200 p-2 text-sm cursor-pointer hover:bg-gray-50 min-h-[44px]"
                    onClick={() => setExpandedSeries(isOpen ? null : key)}
                  >
                    <p className="font-medium text-gray-900">
                      Series {s.seriesNumber} — {s.decimal.toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {s.integer} rings
                      {s.innerTens ? ` · ${s.innerTens}×10` : ''}
                    </p>
                    {isOpen && s.shots?.length ? (
                      <ul className="mt-2 text-xs text-gray-600 space-y-0.5">
                        {s.shots.map((shot, idx) => (
                          <li key={idx}>
                            {idx + 1}. {shot}
                          </li>
                        ))}
                      </ul>
                    ) : isOpen && !s.shots?.length ? (
                      <p className="text-xs text-gray-400 mt-1">Shot-level detail not recorded</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {score.groupMm != null && score.groupMm > 0 ? (
        <p className="text-xs text-gray-500 mt-4">Group size: {score.groupMm} mm</p>
      ) : null}
    </section>
  );
}
