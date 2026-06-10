/** Shared display helpers for public event cards and hero. */

export function formatEventDate(value: Date | string | null | undefined): string {
  if (!value) return 'Date TBC';
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return 'Date TBC';
  return d.toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isEventPast(eventDate: Date): boolean {
  return eventDate < startOfToday();
}

export type DisciplineKey = 'prone' | '3p' | 'fclass' | 'other';

const DISCIPLINE_COLORS: Record<DisciplineKey, string> = {
  prone: 'blue',
  '3p': 'purple',
  fclass: 'teal',
  other: 'gray',
};

export function disciplineKey(label: string): DisciplineKey {
  const k = label.toLowerCase();
  if (k.includes('3p') || k.includes('3-p') || k.includes('three') || k.includes('position')) return '3p';
  if (k.includes('f-class') || k.includes('fclass') || k.includes('f-open') || k.includes('f-tr')) return 'fclass';
  if (k.includes('prone')) return 'prone';
  return 'other';
}

export function disciplineColor(label: string): string {
  return DISCIPLINE_COLORS[disciplineKey(label)];
}

/** De-duplicated discipline pills from type / discipline / category fields. */
export function parseDisciplineTags(
  type?: string | null,
  discipline?: string | null,
  category?: string | null
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  const add = (label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();
    if (lower === 'all categories' || lower === 'target rifle') return;
    const key = disciplineKey(trimmed);
    const display =
      key === 'prone' ? 'Prone' : key === '3p' ? '3P' : key === 'fclass' ? 'F-Class' : trimmed;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(display);
    }
  };

  const sources = [type, discipline, category].filter(Boolean) as string[];
  for (const src of sources) {
    src.split(/[,/|]+/).forEach((part) => add(part));
  }

  if (out.length === 0 && type?.trim()) add(type);
  return out;
}

export function hasCapacityLimit(maxSpots: number): boolean {
  return maxSpots > 0;
}

export function capacityPercent(current: number, max: number): number {
  if (!hasCapacityLimit(max)) return 0;
  return Math.min(100, Math.round((current / max) * 100));
}

export type RibbonStatus = 'open' | 'closing' | 'full' | 'concluded';

export function getRibbonStatus(opts: {
  isPast: boolean;
  maxSpots: number;
  currentSpots: number;
  registrationDeadline: Date;
}): RibbonStatus {
  if (opts.isPast) return 'concluded';
  if (hasCapacityLimit(opts.maxSpots) && opts.currentSpots >= opts.maxSpots) return 'full';
  const daysToClose =
    (opts.registrationDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (daysToClose >= 0 && daysToClose <= 7) return 'closing';
  return 'open';
}

export const RIBBON_LABELS: Record<RibbonStatus, string> = {
  open: 'Open',
  closing: 'Closing soon',
  full: 'Full',
  concluded: 'Concluded',
};

export const RIBBON_COLORS: Record<RibbonStatus, string> = {
  open: 'green',
  closing: 'orange',
  full: 'red',
  concluded: 'gray',
};

export function formatEventFee(price: number): { label: string; hasFee: boolean } {
  if (!price || price <= 0) return { label: 'Fee: TBC', hasFee: false };
  const rounded = Number.isInteger(price) ? String(price) : price.toFixed(2);
  return { label: `Entry Fee: R${rounded}`, hasFee: true };
}
