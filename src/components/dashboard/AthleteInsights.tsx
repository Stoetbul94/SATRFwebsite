import type { DisciplineAnalytics } from '@/lib/athleteAnalytics';

interface AthleteInsightsProps {
  insights: string[];
}

export default function AthleteInsights({ insights }: AthleteInsightsProps) {
  if (insights.length === 0) return null;

  return (
    <ul className="mb-6 space-y-2">
      {insights.map((text) => (
        <li
          key={text}
          className="flex items-start gap-2 text-sm text-gray-700 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2"
        >
          <span className="text-amber-600 mt-0.5" aria-hidden>
            ●
          </span>
          {text}
        </li>
      ))}
    </ul>
  );
}
