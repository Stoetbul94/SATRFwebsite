import type { Event } from '@/lib/events';
import { disciplinePublicLabel, parseEventDisciplines } from '@/lib/eventDisciplines';
import type { Discipline } from '@/types/scores';

export const AFRICA_JOHANNESBURG = 'Africa/Johannesburg';

export interface CalendarEvent extends Event {
  disciplines: Discipline[];
  payfastUrl?: string | null;
  eftInstructions?: string | null;
  allDay: boolean;
}

export function civilDateInJohannesburg(value: string | Date): string | null {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: AFRICA_JOHANNESBURG,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

function padClock(value: string): string {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return '00:00:00';
  return `${match[1].padStart(2, '0')}:${match[2]}:${match[3] ?? '00'}`;
}

export function mapEventStatusToCalendar(
  status: string | undefined,
  currentSpots: number,
  maxSpots: number
): Event['status'] {
  const normalised = String(status || '').toLowerCase();
  if (normalised === 'cancelled' || normalised === 'canceled') return 'CANCELLED';
  if (['completed', 'closed', 'concluded', 'past'].includes(normalised)) return 'CLOSED';
  if (maxSpots > 0 && currentSpots >= maxSpots) return 'FULL';
  // Firestore currently uses `open` (also `upcoming` as serializer default).
  // Unknown values stay OPEN so registration is not silently closed.
  return 'OPEN';
}

function parseExplicitSource(raw: unknown): Event['source'] | undefined {
  return raw === 'SATRF' || raw === 'ISSF' ? raw : undefined;
}

function asRecord(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return raw as Record<string, unknown>;
}

export function normalizeCalendarEvent(raw: unknown): CalendarEvent | null {
  const event = asRecord(raw);
  if (!event) return null;

  const id = String(event.id ?? '').trim();
  if (!id) return null;

  const dateRaw = event.date ?? event.startDate ?? event.start;
  if (dateRaw == null || dateRaw === '') return null;

  const parsed = new Date(dateRaw as string);
  if (Number.isNaN(parsed.getTime())) return null;

  const civil = civilDateInJohannesburg(parsed);
  if (!civil) return null;

  const startTime = typeof event.startTime === 'string' ? event.startTime.trim() : '';
  const endTime = typeof event.endTime === 'string' ? event.endTime.trim() : '';
  const timed = Boolean(startTime || endTime);

  let start: string;
  let end: string;
  let allDay: boolean;

  if (timed) {
    allDay = false;
    const startClock = padClock(startTime || '00:00:00');
    const endClock = padClock(endTime || startClock);
    start = `${civil}T${startClock}+02:00`;
    end = `${civil}T${endClock}+02:00`;
  } else {
    allDay = true;
    start = civil;
    end = civil;
  }

  const disciplines = Array.isArray(event.disciplines)
    ? (event.disciplines as Discipline[])
    : parseEventDisciplines(event);

  const discipline =
    disciplines.length > 0
      ? disciplinePublicLabel(disciplines[0])
      : String(event.type || event.discipline || 'Target Rifle');

  const maxSpots = Number(event.maxParticipants ?? event.maxSpots) || 0;
  const currentSpots = Number(event.currentParticipants ?? event.currentSpots) || 0;
  const source = parseExplicitSource(event.source);

  return {
    id,
    title: String(event.title || event.name || 'Untitled Event'),
    description: String(event.description || ''),
    start,
    end,
    location: String(event.location || ''),
    category: String(event.type || event.category || 'General'),
    discipline,
    price: typeof event.price === 'number' ? event.price : Number(event.price) || 0,
    maxSpots,
    currentSpots,
    status: mapEventStatusToCalendar(String(event.status || ''), currentSpots, maxSpots),
    registrationDeadline: `${civil}T23:59:59+02:00`,
    image:
      (typeof event.imageUrl === 'string' && event.imageUrl) ||
      (typeof event.image === 'string' && event.image) ||
      undefined,
    isLocal: source !== 'ISSF',
    source,
    createdAt: typeof event.createdAt === 'string' ? event.createdAt : undefined,
    updatedAt: typeof event.updatedAt === 'string' ? event.updatedAt : undefined,
    disciplines,
    payfastUrl: typeof event.payfastUrl === 'string' ? event.payfastUrl : null,
    eftInstructions: typeof event.eftInstructions === 'string' ? event.eftInstructions : null,
    allDay,
  };
}

export function normalizeCalendarEvents(raw: unknown): CalendarEvent[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => normalizeCalendarEvent(item))
    .filter((item): item is CalendarEvent => item !== null);
}
