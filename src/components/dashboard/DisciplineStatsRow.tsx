import type { DisciplineAnalytics } from '@/lib/athleteAnalytics';
import {
  latestQualPoint,
  recentQualAverage,
} from '@/lib/athleteAnalytics';
import { qualScoreVariant } from '@/lib/rankingsDisplay';

interface DisciplineStatsRowProps {
  analytics: DisciplineAnalytics;
  /** @deprecated aim marks hidden in My Performance — kept for backwards compatibility */
  showAimMarks?: boolean;
}

function StatCard({
  title,
  value,
  subtitle,
  accent = 'blue',
}: {
  title: string;
  value: string;
  subtitle?: string;
  accent?: 'blue' | 'green' | 'navy' | 'amber';
}) {
  const accentClasses = {
    blue: 'border-blue-100 bg-blue-50/60',
    green: 'border-green-100 bg-green-50/60',
    navy: 'border-slate-200 bg-slate-50/80',
    amber: 'border-amber-100 bg-amber-50/60',
  }[accent];

  return (
    <div className={`rounded-lg border px-4 py-3 min-h-[88px] ${accentClasses}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{title}</p>
      <p className="text-lg font-semibold text-gray-900 mt-0.5">{value}</p>
      {subtitle && <p className="text-xs text-gray-600 mt-1 truncate">{subtitle}</p>}
    </div>
  );
}

export default function DisciplineStatsRow({ analytics }: DisciplineStatsRowProps) {
  const recentAvg = recentQualAverage(analytics.qualSeries, 3);
  const latest = latestQualPoint(analytics.qualSeries);
  const qualUnit =
    qualScoreVariant(analytics.discipline, 'qualification') === 'ringPrimary' ? 'rings' : 'decimal';

  const fourthCard =
    analytics.finalCompetitions > 0 && analytics.bestFinal
      ? {
          title: 'Best Final',
          value: analytics.bestFinal.label,
          subtitle: analytics.bestFinal.eventName,
          accent: 'amber' as const,
        }
      : {
          title: 'Competitions',
          value: String(analytics.qualCompetitions),
          subtitle: `${analytics.finalCompetitions} final${analytics.finalCompetitions === 1 ? '' : 's'}`,
          accent: 'navy' as const,
        };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <StatCard
        title="Personal Best"
        value={analytics.bestQual?.label ?? '—'}
        subtitle={
          analytics.bestQual
            ? `${analytics.bestQual.eventName} · Personal best`
            : 'No qualification scores yet'
        }
        accent="blue"
      />
      <StatCard
        title="Recent Average"
        value={recentAvg != null ? String(recentAvg) : '—'}
        subtitle={
          analytics.qualSeries.length >= 3
            ? `Last 3 qualification (${qualUnit})`
            : analytics.qualSeries.length > 0
              ? 'Need 3+ matches for 3-event average'
              : undefined
        }
        accent="green"
      />
      <StatCard
        title="Latest Score"
        value={latest?.label ?? '—'}
        subtitle={latest ? latest.eventName : undefined}
        accent="navy"
      />
      <StatCard
        title={fourthCard.title}
        value={fourthCard.value}
        subtitle={fourthCard.subtitle}
        accent={fourthCard.accent}
      />
    </div>
  );
}
