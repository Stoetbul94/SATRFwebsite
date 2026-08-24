import { isEventPast, startOfToday } from '@/lib/eventDisplay';
import { isEventRegistrationOpen } from '@/lib/registrations';

export type EventLike = {
  id: string;
  title: string;
  date?: string | null;
  location?: string | null;
  status?: string;
  maxParticipants?: number;
  currentParticipants?: number;
};

export type RegistrationLike = {
  id: string;
  eventId: string;
  eventTitle: string;
  status: string;
};

function eventDateValue(event: EventLike): Date | null {
  if (!event.date) return null;
  const d = new Date(event.date);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function isUpcomingEvent(event: EventLike, today: Date = startOfToday()): boolean {
  const d = eventDateValue(event);
  if (!d) return false;
  return !isEventPast(d) && d >= today;
}

/** Sort ascending by date; undated last. */
export function sortEventsByDateAsc(events: EventLike[]): EventLike[] {
  return [...events].sort((a, b) => {
    const da = eventDateValue(a)?.getTime() ?? Number.POSITIVE_INFINITY;
    const db = eventDateValue(b)?.getTime() ?? Number.POSITIVE_INFINITY;
    return da - db;
  });
}

/**
 * Prefer nearest future event the user is registered for;
 * otherwise nearest open/upcoming event.
 */
export function selectNextEvent(input: {
  eventsById: Record<string, EventLike>;
  registrations: RegistrationLike[];
  openEvents: EventLike[];
  today?: Date;
}): { event: EventLike; isRegistered: boolean } | null {
  const today = input.today ?? startOfToday();
  const activeRegs = input.registrations.filter(
    (r) => r.status === 'registered' && r.eventId,
  );

  const registeredUpcoming = sortEventsByDateAsc(
    activeRegs
      .map((r) => input.eventsById[r.eventId])
      .filter((e): e is EventLike => Boolean(e) && isUpcomingEvent(e, today)),
  );

  if (registeredUpcoming.length > 0) {
    return { event: registeredUpcoming[0], isRegistered: true };
  }

  const openUpcoming = sortEventsByDateAsc(
    input.openEvents.filter((e) => {
      if (!isUpcomingEvent(e, today)) return false;
      return isEventRegistrationOpen(e).open;
    }),
  );

  if (openUpcoming.length > 0) {
    return { event: openUpcoming[0], isRegistered: false };
  }

  return null;
}

export function selectUpcomingRegistrations(input: {
  registrations: RegistrationLike[];
  eventsById: Record<string, EventLike>;
  limit: number;
  today?: Date;
}): Array<RegistrationLike & { event: EventLike }> {
  const today = input.today ?? startOfToday();
  const rows = input.registrations
    .filter((r) => r.status === 'registered')
    .map((r) => {
      const event = input.eventsById[r.eventId];
      if (!event || !isUpcomingEvent(event, today)) return null;
      return { ...r, event };
    })
    .filter((row): row is RegistrationLike & { event: EventLike } => row !== null);

  return [...rows]
    .sort((a, b) => {
      const da = a.event.date ? new Date(a.event.date).getTime() : Number.POSITIVE_INFINITY;
      const db = b.event.date ? new Date(b.event.date).getTime() : Number.POSITIVE_INFINITY;
      return da - db;
    })
    .slice(0, input.limit);
}
