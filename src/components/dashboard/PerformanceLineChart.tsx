import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AthleteChartPoint } from '@/lib/athleteAnalytics';

export interface ChartLineConfig {
  dataKey: string;
  name: string;
  color: string;
}

interface PerformanceLineChartProps {
  data: Record<string, unknown>[];
  lines: ChartLineConfig[];
  yAxisLabel?: string;
  emptyMessage?: string;
  height?: number;
  /** Raw points for rich tooltips (keyed by xLabel) */
  pointLookup?: Map<string, AthleteChartPoint>;
}

function ChartTooltip({
  active,
  payload,
  label,
  pointLookup,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number; color: string; name?: string; payload: Record<string, unknown> }[];
  label?: string;
  pointLookup?: Map<string, AthleteChartPoint>;
}) {
  if (!active || !payload?.length) return null;

  const rawPayload = payload[0].payload;
  const meta =
    pointLookup?.get(String(label)) ??
    (rawPayload as unknown as AthleteChartPoint | undefined);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm shadow-lg">
      <p className="font-semibold text-gray-900">{meta?.eventName ?? label}</p>
      {meta?.date && (
        <p className="text-xs text-gray-500 mb-2">
          {new Date(meta.date).toLocaleDateString('en-ZA', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      )}
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-gray-700" style={{ color: entry.color }}>
          {entry.name ?? entry.dataKey}: <span className="font-medium">{entry.value}</span>
        </p>
      ))}
      {meta?.label && (
        <p className="text-gray-600 mt-1">Score: {meta.label}</p>
      )}
      {meta?.innerTens != null && meta.innerTens > 0 && (
        <p className="text-gray-500 text-xs">Inner 10s: {meta.innerTens}</p>
      )}
      {meta?.finalRank != null && (
        <p className="text-gray-500 text-xs">Final rank: #{meta.finalRank}</p>
      )}
      {meta?.eliminatedAtShot != null && (
        <p className="text-gray-500 text-xs">Eliminated at shot {meta.eliminatedAtShot}</p>
      )}
    </div>
  );
}

export default function PerformanceLineChart({
  data,
  lines,
  yAxisLabel,
  emptyMessage = 'No scores to chart yet.',
  height = 280,
  pointLookup,
}: PerformanceLineChartProps) {
  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500"
        style={{ height }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="xLabel"
          tick={{ fontSize: 11, fill: '#6b7280' }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#6b7280' }}
          label={
            yAxisLabel
              ? { value: yAxisLabel, angle: -90, position: 'insideLeft', style: { fontSize: 11 } }
              : undefined
          }
        />
        <Tooltip content={<ChartTooltip pointLookup={pointLookup} />} />
        {lines.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {lines.map((line) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            name={line.name}
            stroke={line.color}
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 2 }}
            activeDot={{ r: 6 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function chartPointsToLineData(points: AthleteChartPoint[]) {
  return points.map((p) => ({
    ...p,
    value: p.primaryValue,
  }));
}

export function buildPositionChartData(
  positions: NonNullable<import('@/lib/athleteAnalytics').DisciplineAnalytics['threePPositions']>,
) {
  const byLabel = new Map<string, Record<string, unknown>>();

  const add = (key: 'kneeling' | 'prone' | 'standing', points: AthleteChartPoint[]) => {
    for (const p of points) {
      const row = byLabel.get(p.xLabel) ?? {
        xLabel: p.xLabel,
        date: p.date,
        eventName: p.eventName,
      };
      row[key] = p.primaryValue;
      byLabel.set(p.xLabel, row);
    }
  };

  add('kneeling', positions.kneeling);
  add('prone', positions.prone);
  add('standing', positions.standing);

  return Array.from(byLabel.values()).sort((a, b) =>
    String(a.date).localeCompare(String(b.date)),
  );
}

export function buildPointLookup(points: AthleteChartPoint[]): Map<string, AthleteChartPoint> {
  return new Map(points.map((p) => [p.xLabel, p]));
}
