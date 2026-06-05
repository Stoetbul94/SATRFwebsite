import { DISCIPLINES, EVENT_DISCIPLINE_ORDER } from '@/lib/issf';
import type { Discipline } from '@/types/scores';

/** Canonical event discipline options for admin multi-select (matches scoring IDs). */
export const EVENT_DISCIPLINE_OPTIONS: { id: Discipline; label: string; shortLabel: string }[] = [
  { id: 'prone_50m', label: 'Prone', shortLabel: 'Prone' },
  { id: 'fclass_open', label: 'F-Class Open', shortLabel: 'F-Open' },
  { id: 'fclass_tr', label: 'F-Class Target Rifle', shortLabel: 'F-TR' },
  { id: 'three_position_50m', label: '3-Position', shortLabel: '3P' },
];

const OPTION_BY_ID = new Map(EVENT_DISCIPLINE_OPTIONS.map((o) => [o.id, o]));

/** Best-effort map free-text legacy `type` strings to discipline IDs. */
const LEGACY_TEXT_HINTS: { pattern: RegExp; id: Discipline }[] = [
  { pattern: /\b3\s*[- ]?p(?:osition)?\b/i, id: 'three_position_50m' },
  { pattern: /\bthree[- ]position\b/i, id: 'three_position_50m' },
  { pattern: /\bf[- ]?class\s*tr\b/i, id: 'fclass_tr' },
  { pattern: /\btarget\s*rifle\b/i, id: 'fclass_tr' },
  { pattern: /\bf[- ]?class\s*open\b/i, id: 'fclass_open' },
  { pattern: /\bf[- ]?class\b/i, id: 'fclass_open' },
  { pattern: /\bprone\b/i, id: 'prone_50m' },
];

export function isValidEventDiscipline(id: string): id is Discipline {
  return id in DISCIPLINES;
}

export function disciplineShortLabel(id: Discipline): string {
  return OPTION_BY_ID.get(id)?.shortLabel ?? DISCIPLINES[id]?.label ?? id;
}

export function disciplinePublicLabel(id: Discipline): string {
  return OPTION_BY_ID.get(id)?.label ?? DISCIPLINES[id]?.label ?? id;
}

export function disciplinesToLegacyType(ids: Discipline[]): string {
  return ids.map((id) => disciplinePublicLabel(id)).join(', ');
}

/** Parse discipline IDs from Firestore event data (array or legacy free-text `type`). */
export function parseEventDisciplines(data: {
  disciplines?: unknown;
  type?: unknown;
  discipline?: unknown;
}): Discipline[] {
  const fromArray = Array.isArray(data.disciplines)
    ? data.disciplines.filter((d): d is Discipline => typeof d === 'string' && isValidEventDiscipline(d))
    : [];

  if (fromArray.length > 0) {
    return EVENT_DISCIPLINE_ORDER.filter((id) => fromArray.includes(id));
  }

  const text = [data.type, data.discipline]
    .filter((v) => typeof v === 'string' && v.trim())
    .join(', ');

  if (!text.trim()) return [];

  const found = new Set<Discipline>();
  const segments = text.split(/[,;/|]+/).map((s) => s.trim()).filter(Boolean);

  for (const segment of segments) {
    const normalized = segment.toLowerCase().replace(/\s+/g, '_');
    if (isValidEventDiscipline(normalized)) {
      found.add(normalized);
      continue;
    }
    for (const hint of LEGACY_TEXT_HINTS) {
      if (hint.pattern.test(segment)) {
        found.add(hint.id);
      }
    }
  }

  if (found.size === 0) {
    for (const hint of LEGACY_TEXT_HINTS) {
      if (hint.pattern.test(text)) found.add(hint.id);
    }
  }

  return EVENT_DISCIPLINE_ORDER.filter((id) => found.has(id));
}

export function formatEntryFee(price: number | null | undefined): string {
  if (price == null || Number.isNaN(price)) return 'Fee: TBC';
  if (price <= 0) return 'Fee: TBC';
  const rounded = Number.isInteger(price) ? price : Math.round(price * 100) / 100;
  return `Entry Fee: R${rounded}`;
}

export function parseEntryFee(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : parseFloat(String(value));
  if (Number.isNaN(n) || n < 0) return null;
  return n;
}
