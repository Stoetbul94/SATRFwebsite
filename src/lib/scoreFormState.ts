import {
  DISCIPLINES,
  POSITION_LABELS,
  MAX_DECIMAL_PER_POSITION_3P,
  MAX_DECIMAL_PER_POSITION_3P_FINAL,
  MAX_5SHOT_SERIES_DECIMAL,
} from '@/lib/issf';
import type {
  Category,
  Discipline,
  Position,
  Score,
  ScoreInput,
  ScoreStage,
  ScoreStatus,
} from '@/types/scores';

export interface SeriesEntry {
  decimal: string;
  integer: string;
}

export type PositionEntryMode = 'series' | 'total';

export const GUEST_MEMBER = '__guest__';
export const CUSTOM_EVENT = '__custom__';

export function parseDecimalValue(raw: string): number {
  const normalized = raw.trim().replace(',', '.');
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
}

export function emptySeries(): SeriesEntry {
  return { decimal: '', integer: '' };
}

export function makePositionSeries(discipline: Discipline): Record<Position, SeriesEntry[]> {
  const spec = DISCIPLINES[discipline];
  const map = {} as Record<Position, SeriesEntry[]>;
  spec.positions.forEach((pos) => {
    map[pos] = Array.from({ length: spec.seriesPerPosition }, emptySeries);
  });
  return map;
}

export function makePositionEntryMode(discipline: Discipline): Record<Position, PositionEntryMode> {
  const map = {} as Record<Position, PositionEntryMode>;
  DISCIPLINES[discipline].positions.forEach((pos) => {
    map[pos] = 'series';
  });
  return map;
}

export function isThreePQual(discipline: Discipline, stage: ScoreStage): boolean {
  return discipline === 'three_position_50m' && stage === 'qualification';
}

export function isThreePFinal(discipline: Discipline, stage: ScoreStage): boolean {
  return discipline === 'three_position_50m' && stage === '3p_final';
}

export function supportsPositionTotalEntry(discipline: Discipline, stage: ScoreStage): boolean {
  return isThreePQual(discipline, stage) || isThreePFinal(discipline, stage);
}

export interface ScoreFormState {
  discipline: Discipline;
  stage: ScoreStage;
  selectedMemberId: string;
  shooterName: string;
  club: string;
  category: Category;
  veteran: boolean;
  selectedEventId: string;
  eventName: string;
  date: string;
  seriesByPosition: Record<Position, SeriesEntry[]>;
  positionEntryMode: Record<Position, PositionEntryMode>;
  finalRank: string;
  elimShots: string[];
  status: ScoreStatus;
}

export function scoreToFormState(score: Score): ScoreFormState {
  const discipline = score.discipline;
  const stage = score.stage ?? 'qualification';
  const seriesByPosition = makePositionSeries(discipline);
  const positionEntryMode = makePositionEntryMode(discipline);
  const spec = DISCIPLINES[discipline];

  for (const block of score.positions ?? []) {
    if (block.aggregate) {
      positionEntryMode[block.position] = 'total';
      const filled = block.series.find((s) => s.decimal > 0 || s.integer > 0) ?? block.series[0];
      seriesByPosition[block.position] = [
        {
          decimal: (filled?.decimal ?? block.decimalTotal) > 0 ? String(filled?.decimal ?? block.decimalTotal) : '',
          integer:
            (filled?.integer ?? block.integerTotal) > 0
              ? String(filled?.integer ?? block.integerTotal)
              : '',
        },
        ...Array.from({ length: Math.max(0, spec.seriesPerPosition - 1) }, emptySeries),
      ];
    } else {
      const entries = block.series.map((s) => ({
        decimal: s.decimal > 0 ? String(s.decimal) : '',
        integer: s.integer > 0 ? String(s.integer) : '',
      }));
      while (entries.length < spec.seriesPerPosition) entries.push(emptySeries());
      seriesByPosition[block.position] = entries;
    }
  }

  const elim = score.finalShots?.map((s) => (s > 0 ? String(s) : '')) ?? [];
  while (elim.length < 5) elim.push('');

  return {
    discipline,
    stage,
    selectedMemberId: score.userId || GUEST_MEMBER,
    shooterName: score.shooterName,
    club: score.club,
    category: score.category,
    veteran: score.isVeteran === true,
    selectedEventId: score.eventId || CUSTOM_EVENT,
    eventName: score.eventName,
    date: score.date ? score.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
    seriesByPosition,
    positionEntryMode,
    finalRank: score.finalRank ? String(score.finalRank) : '',
    elimShots: elim,
    status: score.status,
  };
}

export function buildScoreInputFromForm(
  form: Pick<
    ScoreFormState,
    | 'discipline'
    | 'stage'
    | 'selectedMemberId'
    | 'shooterName'
    | 'club'
    | 'category'
    | 'veteran'
    | 'selectedEventId'
    | 'eventName'
    | 'date'
    | 'seriesByPosition'
    | 'positionEntryMode'
    | 'finalRank'
    | 'elimShots'
    | 'status'
  >,
  options?: { source?: Score['source'] }
): ScoreInput {
  const spec = DISCIPLINES[form.discipline];
  const totalEntrySupported = supportsPositionTotalEntry(form.discipline, form.stage);
  const positions = spec.positions.map((pos) => {
    if (totalEntrySupported && form.positionEntryMode[pos] === 'total') {
      const s = form.seriesByPosition[pos][0];
      return {
        position: pos,
        aggregate: true,
        series: [
          {
            seriesNumber: 1,
            decimal: parseDecimalValue(s.decimal),
            integer: parseInt(s.integer, 10) || 0,
          },
        ],
      };
    }
    return {
      position: pos,
      series: form.seriesByPosition[pos].map((s, i) => ({
        seriesNumber: i + 1,
        decimal: parseDecimalValue(s.decimal),
        integer: parseInt(s.integer, 10) || 0,
      })),
    };
  });

  const parsedElim = form.elimShots.map((s) => parseDecimalValue(s)).filter((v) => v > 0);
  const rank = parseInt(form.finalRank, 10);
  const isFinal = form.stage === 'prone_final' || form.stage === '3p_final';

  return {
    userId: form.selectedMemberId && form.selectedMemberId !== GUEST_MEMBER ? form.selectedMemberId : null,
    shooterName: form.shooterName.trim(),
    club: form.club.trim(),
    category: form.category === 'veteran' ? 'open' : form.category,
    ...(form.veteran || form.category === 'veteran' ? { isVeteran: true } : {}),
    eventId: form.selectedEventId && form.selectedEventId !== CUSTOM_EVENT ? form.selectedEventId : '',
    eventName: form.eventName.trim(),
    date: form.date,
    discipline: form.discipline,
    stage: form.stage,
    scoringType: 'decimal',
    status: form.status,
    source: options?.source ?? 'manual',
    positions,
    finalShots: form.stage === '3p_final' && parsedElim.length > 0 ? parsedElim : undefined,
    finalRank: isFinal && Number.isFinite(rank) && rank > 0 ? rank : undefined,
    eliminatedAtShot: undefined,
  };
}

export function isFClassQualification(discipline: Discipline, stage: ScoreStage): boolean {
  return (discipline === 'fclass_open' || discipline === 'fclass_tr') && stage === 'qualification';
}

export function seriesEntryHasScore(
  discipline: Discipline,
  stage: ScoreStage,
  entry: { decimal: string; integer: string },
): boolean {
  const dec = parseDecimalValue(entry.decimal);
  const intVal = parseInt(entry.integer, 10) || 0;
  if (isFClassQualification(discipline, stage)) {
    return dec > 0 || intVal > 0;
  }
  return dec > 0;
}

export function positionEntryHasScore(
  discipline: Discipline,
  stage: ScoreStage,
  positionEntryMode: Record<Position, PositionEntryMode>,
  seriesByPosition: Record<Position, SeriesEntry[]>,
  pos: Position,
): boolean {
  const totalEntrySupported = supportsPositionTotalEntry(discipline, stage);
  if (totalEntrySupported && positionEntryMode[pos] === 'total') {
    const dec = parseDecimalValue(seriesByPosition[pos][0]?.decimal ?? '');
    const intVal = parseInt(seriesByPosition[pos][0]?.integer ?? '', 10) || 0;
    if (isFClassQualification(discipline, stage)) {
      return dec > 0 || intVal > 0;
    }
    return dec > 0;
  }
  return (seriesByPosition[pos] ?? []).some((s) => seriesEntryHasScore(discipline, stage, s));
}

export function validateScoreForm(
  form: Pick<
    ScoreFormState,
    | 'discipline'
    | 'stage'
    | 'shooterName'
    | 'club'
    | 'eventName'
    | 'selectedEventId'
    | 'seriesByPosition'
    | 'positionEntryMode'
    | 'elimShots'
  >
): string | null {
  const spec = DISCIPLINES[form.discipline];
  if (!form.eventName.trim() && form.selectedEventId !== CUSTOM_EVENT && !form.selectedEventId) {
    return 'Select an event or enter a custom event name';
  }
  if (!form.eventName.trim()) return 'Event name is required';
  if (!form.shooterName.trim()) return 'Select a member or enter shooter name (guest)';
  if (form.stage === 'qualification' && !form.club.trim()) return 'Club is required';

  const totalEntrySupported = supportsPositionTotalEntry(form.discipline, form.stage);
  for (const pos of spec.positions) {
    if (totalEntrySupported && form.positionEntryMode[pos] === 'total') {
      const dec = parseDecimalValue(form.seriesByPosition[pos][0]?.decimal ?? '');
      const intVal = parseInt(form.seriesByPosition[pos][0]?.integer ?? '', 10) || 0;
      const maxDec = isThreePFinal(form.discipline, form.stage)
        ? MAX_DECIMAL_PER_POSITION_3P_FINAL
        : MAX_DECIMAL_PER_POSITION_3P;
      const maxInt = isThreePFinal(form.discipline, form.stage) ? 100 : 200;
      if (dec > 0 && dec > maxDec) {
        return `${POSITION_LABELS[pos]} decimal exceeds maximum`;
      }
      if (intVal > maxInt) {
        return `${POSITION_LABELS[pos]} ring total exceeds maximum`;
      }
      continue;
    }
    for (const s of form.seriesByPosition[pos]) {
      const dec = parseDecimalValue(s.decimal);
      if (dec > 0 && dec > (form.stage === '3p_final' ? MAX_5SHOT_SERIES_DECIMAL : 109)) {
        return `${POSITION_LABELS[pos]} series decimal exceeds maximum`;
      }
    }
  }

  const anyScore = spec.positions.some((pos) =>
    positionEntryHasScore(
      form.discipline,
      form.stage,
      form.positionEntryMode,
      form.seriesByPosition,
      pos,
    ),
  );
  const anyElim = form.elimShots.some((s) => parseDecimalValue(s) > 0);
  if (form.stage === '3p_final') {
    if (!anyScore && !anyElim) return 'Enter position series and/or elimination shots';
  } else if (!anyScore) {
    return 'Enter at least one series score';
  }
  return null;
}
