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
import { buildQualScoreDistribution } from '@/lib/athleteAnalytics';

interface ConsistencyChartProps {
  qualSeries: AthleteChartPoint[];
  disciplineLabel: string;
}

export default function ConsistencyChart({ qualSeries, disciplineLabel }: ConsistencyChartProps) {
  const buckets = buildQualScoreDistribution(qualSeries);

  return (
    <section className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Consistency</h2>
      <p className="text-sm text-gray-500 mb-4">
        Qualification score distribution — {disciplineLabel}
      </p>

      {buckets.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center border border-dashed border-gray-200 rounded-lg">
          More results are needed to show consistency (minimum 5 qualification scores).
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={buckets} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
            <Tooltip
              formatter={(value) => [
                `${value ?? 0} match${value === 1 ? '' : 'es'}`,
                'Count',
              ]}
            />
            <Bar dataKey="count" fill="#1a365d" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}
