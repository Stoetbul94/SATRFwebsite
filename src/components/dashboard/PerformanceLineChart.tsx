import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
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

export interface ChartReferenceLine {
  value: number;
  label: string;
  color?: string;
}

interface PerformanceLineChartProps {
  data: Record<string, unknown>[];
  lines: ChartLineConfig[];
  yAxisLabel?: string;
  emptyMessage?: string;
  height?: number;
  /** Raw points for rich tooltips (keyed by xLabel) */
  pointLookup?: Map<string, AthleteChartPoint>;
  referenceLines?: ChartReferenceLine[];
  highlightValues?: number[];
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

function computeYDomain(
  data: Record<string, unknown>[],
  lines: ChartLineConfig[],
  referenceLines: ChartReferenceLine[] = [],
): [number, number] {
  const values: number[] = [];

  for (const row of data) {
    for (const line of lines) {
      const value = row[line.dataKey];
      if (typeof value === 'number' && !Number.isNaN(value)) {
        values.push(value);
      }
    }
  }

  for (const ref of referenceLines) {
    values.push(ref.value);
  }

  if (!values.length) return [0, 100];

  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max((max - min) * 0.08, 5);
  return [Math.floor(min - pad), Math.ceil(max + pad)];
}

export default function PerformanceLineChart({
  data,
  lines,
  yAxisLabel,
  emptyMessage = 'No scores to chart yet.',
  height = 280,
  pointLookup,
  referenceLines = [],
  highlightValues = [],
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

  const yDomain = computeYDomain(data, lines, referenceLines);
  const highlightSet = new Set(highlightValues);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 12, right: 24, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="xLabel"
          tick={{ fontSize: 11, fill: '#6b7280' }}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={yDomain}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          label={
            yAxisLabel
              ? { value: yAxisLabel, angle: -90, position: 'insideLeft', style: { fontSize: 11 } }
              : undefined
          }
        />
        <Tooltip content={<ChartTooltip pointLookup={pointLookup} />} />
        {lines.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {referenceLines.map((ref) => (
          <ReferenceLine
            key={ref.label}
            y={ref.value}
            stroke={ref.color ?? '#d97706'}
            strokeDasharray="6 4"
            strokeWidth={1.5}
            label={{
              value: ref.label,
              position: 'insideTopRight',
              fontSize: 10,
              fill: ref.color ?? '#b45309',
            }}
          />
        ))}
        {lines.map((line) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            name={line.name}
            stroke={line.color}
            strokeWidth={2}
            dot={(props) => {
              const { cx, cy, payload } = props;
              const value = payload?.[line.dataKey];
              const isPb = typeof value === 'number' && highlightSet.has(value);
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={isPb ? 6 : 4}
                  fill={isPb ? '#fbbf24' : line.color}
                  stroke={isPb ? '#b45309' : line.color}
                  strokeWidth={isPb ? 2.5 : 2}
                />
              );
            }}
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
