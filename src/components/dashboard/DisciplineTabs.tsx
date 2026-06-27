import type { DisciplineAnalytics } from '@/lib/athleteAnalytics';

interface DisciplineTabsProps {
  disciplines: DisciplineAnalytics[];
  active: string;
  onChange: (discipline: string) => void;
}

export default function DisciplineTabs({ disciplines, active, onChange }: DisciplineTabsProps) {
  if (disciplines.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-6" role="tablist" aria-label="Disciplines">
      {disciplines.map((d) => {
        const selected = d.discipline === active;
        return (
          <button
            key={d.discipline}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(d.discipline)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selected
                ? 'bg-satrf-navy text-white shadow'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {d.label}
          </button>
        );
      })}
    </div>
  );
}
