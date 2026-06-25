import type { DisciplineAnalytics } from '@/lib/athleteAnalytics';
import { qualScoreVariant } from '@/lib/rankingsDisplay';

interface DisciplineStatsRowProps {
  analytics: DisciplineAnalytics;
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
  accent?: 'blue' | 'red' | 'amber';
}) {
  const accentClasses = {
    blue: 'border-blue-100 bg-blue-50/60',
    red: 'border-red-100 bg-red-50/60',
    amber: 'border-amber-100 bg-amber-50/60',
  }[accent];

  return (
    <div className={`rounded-lg border px-4 py-3 ${accentClasses}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{title}</p>
      <p className="text-lg font-semibold text-gray-900 mt-0.5">{value}</p>
      {subtitle && <p className="text-xs text-gray-600 mt-1 truncate">{subtitle}</p>}
    </div>
  );
}

export default function DisciplineStatsRow({ analytics }: DisciplineStatsRowProps) {
  const qualUnit =
    qualScoreVariant(analytics.discipline, 'qualification') === 'ringPrimary' ? 'rings' : 'decimal';
  const qualAim = analytics.aimMarks.qual;
  const finalAim = analytics.aimMarks.final;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <StatCard
        title="Personal best · Qualification"
        value={analytics.bestQual?.label ?? '—'}
        subtitle={analytics.bestQual ? analytics.bestQual.eventName : 'No qualification scores yet'}
        accent="blue"
      />
      <StatCard
        title="Personal best · Final"
        value={analytics.bestFinal?.label ?? '—'}
        subtitle={analytics.bestFinal ? analytics.bestFinal.eventName : 'No final scores yet'}
        accent="red"
      />
      <StatCard
        title="Qualification aim"
        value={`${qualAim.value} ${qualUnit}`}
        subtitle={qualAim.label}
        accent="amber"
      />
      {finalAim ? (
        <StatCard
          title="Final aim"
          value={`${finalAim.value} decimal`}
          subtitle={finalAim.label}
          accent="amber"
        />
      ) : (
        <StatCard title="Final aim" value="—" subtitle="No finals for this discipline" accent="amber" />
      )}
    </div>
  );
}
