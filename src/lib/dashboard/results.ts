import { DISCIPLINES } from '@/lib/issf';
import {
  formatScorePair,
  qualScoreVariant,
  ringTotalForScore,
} from '@/lib/rankingsDisplay';
import {
  isFinalStageForDiscipline,
  isQualificationStage,
} from '@/lib/athleteAnalytics';
import type { Discipline, Score, ScoreStage } from '@/types/scores';
import type { DashboardResult } from '@/lib/dashboard/types';

const STAGE_LABELS: Record<ScoreStage, string> = {
  qualification: 'Qualification',
  prone_final: 'Prone Final',
  '3p_final': '3P Final',
};

export function disciplineLabel(discipline: Discipline): string {
  return DISCIPLINES[discipline]?.label || discipline;
}

export function formatDashboardScoreLabel(score: Score): string {
  const stage = (score.stage ?? 'qualification') as ScoreStage;
  const rings = ringTotalForScore(score);
  const variant = qualScoreVariant(score.discipline, stage);
  const pair = formatScorePair(score.decimalTotal, rings, variant);
  if (pair.secondary) return `${pair.primary} (${pair.secondary})`;
  return pair.primary;
}

/**
 * Recent results for dashboard: newest first, keep qual and finals as separate
 * rows (never merge). Prefer showing qualification when both exist same day —
 * still list both if within limit.
 */
export function selectRecentResults(
  scores: Array<Score & { deleted?: boolean }>,
  limit: number,
): DashboardResult[] {
  const eligible = scores.filter((s) => {
    if (s.deleted) return false;
    const stage = s.stage ?? 'qualification';
    return (
      isQualificationStage(stage) || isFinalStageForDiscipline(stage, s.discipline)
    );
  });

  const sorted = [...eligible].sort((a, b) =>
    String(b.date || '').localeCompare(String(a.date || '')),
  );

  return sorted.slice(0, limit).map((score) => {
    const stage = (score.stage ?? 'qualification') as ScoreStage;
    return {
      id: score.id,
      discipline: score.discipline,
      disciplineLabel: disciplineLabel(score.discipline),
      eventId: score.eventId,
      eventName: score.eventName || 'Competition',
      date: score.date,
      scoreLabel: formatDashboardScoreLabel(score),
      stage,
      stageLabel: STAGE_LABELS[stage] || stage,
    };
  });
}

export function isCompetitionProfileLinked(scores: Array<Score & { deleted?: boolean }>): boolean {
  return scores.some((s) => !s.deleted && Boolean(s.userId));
}

export function isProfileIncomplete(user: {
  firstName?: string | null;
  club?: string | null;
  province?: string | null;
}): boolean {
  return !user.firstName?.trim() || !user.club?.trim() || !user.province?.trim();
}
