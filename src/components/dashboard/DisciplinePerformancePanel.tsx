import { useState } from 'react';
import type { DisciplineAnalytics } from '@/lib/athleteAnalytics';
import { qualScoreVariant } from '@/lib/rankingsDisplay';
import AthleteInsights from '@/components/dashboard/AthleteInsights';
import PerformanceLineChart, {
  buildPointLookup,
  buildPositionChartData,
  chartPointsToLineData,
} from '@/components/dashboard/PerformanceLineChart';

interface DisciplinePerformancePanelProps {
  analytics: DisciplineAnalytics;
}

const POSITION_LINES = [
  { dataKey: 'kneeling', name: 'Kneeling', color: '#3182ce' },
  { dataKey: 'prone', name: 'Prone', color: '#1a365d' },
  { dataKey: 'standing', name: 'Standing', color: '#e53e3e' },
] as const;

export default function DisciplinePerformancePanel({ analytics }: DisciplinePerformancePanelProps) {
  const [threePView, setThreePView] = useState<'overall' | 'positions'>('overall');
  const is3P = analytics.discipline === 'three_position_50m';
  const qualYLabel =
    qualScoreVariant(analytics.discipline, 'qualification') === 'ringPrimary' ? 'Rings' : 'Decimal';

  const qualLookup = buildPointLookup(analytics.qualSeries);
  const finalLookup = buildPointLookup(analytics.finalSeries);

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{analytics.label}</h2>
          <p className="text-sm text-gray-500">
            {analytics.qualCompetitions} qualification
            {analytics.qualCompetitions === 1 ? '' : 's'} · {analytics.finalCompetitions} final
            {analytics.finalCompetitions === 1 ? '' : 's'}
          </p>
        </div>
        {is3P && analytics.threePPositions && (
          <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
            <button
              type="button"
              onClick={() => setThreePView('overall')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                threePView === 'overall' ? 'bg-white shadow text-gray-900' : 'text-gray-600'
              }`}
            >
              Overall
            </button>
            <button
              type="button"
              onClick={() => setThreePView('positions')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                threePView === 'positions' ? 'bg-white shadow text-gray-900' : 'text-gray-600'
              }`}
            >
              By position
            </button>
          </div>
        )}
      </div>

      <AthleteInsights insights={analytics.insights} />

      <div className="space-y-8">
        <section>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Qualification
          </h3>
          {is3P && threePView === 'positions' && analytics.threePPositions ? (
            <PerformanceLineChart
              data={buildPositionChartData(analytics.threePPositions)}
              lines={[...POSITION_LINES]}
              yAxisLabel="Rings"
              emptyMessage="No 3P position data yet."
              pointLookup={qualLookup}
            />
          ) : (
            <PerformanceLineChart
              data={chartPointsToLineData(analytics.qualSeries)}
              lines={[{ dataKey: 'value', name: 'Qualification', color: '#1a365d' }]}
              yAxisLabel={qualYLabel}
              emptyMessage="No qualification scores yet."
              pointLookup={qualLookup}
            />
          )}
        </section>

        <section>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Finals
          </h3>
          <PerformanceLineChart
            data={chartPointsToLineData(analytics.finalSeries)}
            lines={[{ dataKey: 'value', name: 'Final', color: '#e53e3e' }]}
            yAxisLabel="Decimal"
            emptyMessage="No final scores recorded for this discipline yet."
            pointLookup={finalLookup}
          />
        </section>
      </div>
    </div>
  );
}
