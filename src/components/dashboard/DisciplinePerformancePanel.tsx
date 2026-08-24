import { useState } from 'react';
import type { DisciplineAnalytics } from '@/lib/athleteAnalytics';
import { enrichQualSeriesWithRollingAverage } from '@/lib/athleteAnalytics';
import { qualScoreVariant } from '@/lib/rankingsDisplay';
import DisciplineStatsRow from '@/components/dashboard/DisciplineStatsRow';
import PerformanceLineChart, {
  buildPointLookup,
  buildPositionChartData,
  type ChartReferenceLine,
} from '@/components/dashboard/PerformanceLineChart';
import ConsistencyChart from '@/components/dashboard/ConsistencyChart';
import MatchBreakdownPanel from '@/components/dashboard/MatchBreakdownPanel';
import FinalsSection from '@/components/dashboard/FinalsSection';
import type { Score } from '@/types/scores';

interface DisciplinePerformancePanelProps {
  analytics: DisciplineAnalytics;
  qualScores: Score[];
  finalScores: Score[];
  selectedScoreId: string | null;
  onSelectScore: (scoreId: string | null) => void;
}

const POSITION_LINES = [
  { dataKey: 'kneeling', name: 'Kneeling', color: '#3182ce' },
  { dataKey: 'prone', name: 'Prone', color: '#1a365d' },
  { dataKey: 'standing', name: 'Standing', color: '#e53e3e' },
] as const;

export default function DisciplinePerformancePanel({
  analytics,
  qualScores,
  finalScores,
  selectedScoreId,
  onSelectScore,
}: DisciplinePerformancePanelProps) {
  const [threePView, setThreePView] = useState<'overall' | 'positions'>('overall');
  const is3P = analytics.discipline === 'three_position_50m';
  const qualYLabel =
    qualScoreVariant(analytics.discipline, 'qualification') === 'ringPrimary' ? 'Rings' : 'Decimal';

  const qualWithRolling = enrichQualSeriesWithRollingAverage(analytics.qualSeries);
  const qualLookup = buildPointLookup(analytics.qualSeries);
  const finalLookup = buildPointLookup(analytics.finalSeries);

  const qualHighlight = analytics.bestQual ? [analytics.bestQual.value] : [];
  const finalHighlight = analytics.bestFinal ? [analytics.bestFinal.value] : [];

  const selectedScore =
    qualScores.find((s) => s.id === selectedScoreId) ??
    qualScores[qualScores.length - 1] ??
    null;

  const progressionLines = [
    { dataKey: 'value', name: 'Qualification', color: '#1a365d' },
    ...(qualWithRolling.some((p) => p.rollingAvg != null)
      ? [{ dataKey: 'rollingAvg', name: '3-match rolling avg', color: '#059669' }]
      : []),
  ];

  const emptyReferenceLines: ChartReferenceLine[] = [];

  return (
    <div className="space-y-8">
      <DisciplineStatsRow analytics={analytics} />

      <section className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Score Progression</h2>
            <p className="text-sm text-gray-500">Qualification scores over time</p>
          </div>
          {is3P && analytics.threePPositions && (
            <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
              <button
                type="button"
                onClick={() => setThreePView('overall')}
                className={`px-3 py-2 min-h-[44px] text-xs font-medium rounded-md ${
                  threePView === 'overall' ? 'bg-white shadow text-gray-900' : 'text-gray-600'
                }`}
              >
                Overall
              </button>
              <button
                type="button"
                onClick={() => setThreePView('positions')}
                className={`px-3 py-2 min-h-[44px] text-xs font-medium rounded-md ${
                  threePView === 'positions' ? 'bg-white shadow text-gray-900' : 'text-gray-600'
                }`}
              >
                By Position
              </button>
            </div>
          )}
        </div>

        {is3P && threePView === 'positions' && analytics.threePPositions ? (
          <PerformanceLineChart
            data={buildPositionChartData(analytics.threePPositions)}
            lines={[...POSITION_LINES]}
            yAxisLabel="Rings"
            emptyMessage="No 3P position data yet."
            pointLookup={qualLookup}
            referenceLines={emptyReferenceLines}
            onPointClick={(id) => onSelectScore(id)}
          />
        ) : (
          <PerformanceLineChart
            data={qualWithRolling as unknown as Record<string, unknown>[]}
            lines={progressionLines}
            yAxisLabel={qualYLabel}
            emptyMessage="No qualification scores yet."
            pointLookup={qualLookup}
            referenceLines={emptyReferenceLines}
            highlightValues={qualHighlight}
            onPointClick={(id) => onSelectScore(id)}
          />
        )}
        {analytics.bestQual ? (
          <p className="text-xs text-amber-700 mt-2">
            Personal best highlighted on chart ({analytics.bestQual.label})
          </p>
        ) : null}
      </section>

      <ConsistencyChart qualSeries={analytics.qualSeries} disciplineLabel={analytics.label} />

      <MatchBreakdownPanel
        score={selectedScore}
        discipline={analytics.discipline}
        onClear={() => onSelectScore(null)}
      />

      <FinalsSection finalScores={finalScores} finalSeries={analytics.finalSeries} />

      {analytics.qualSeries.some((p) => p.innerTens > 0) &&
      qualScoreVariant(analytics.discipline, 'qualification') !== 'ringPrimary' ? (
        <section className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
            Inner 10s (latest qual)
          </h2>
          <p className="text-2xl font-bold text-gray-900">
            {latestQualInnerTens(analytics)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Total inner 10s from most recent qualification</p>
        </section>
      ) : null}
    </div>
  );
}

function latestQualInnerTens(analytics: DisciplineAnalytics): number {
  const latest = analytics.qualSeries[analytics.qualSeries.length - 1];
  return latest?.innerTens ?? 0;
}
