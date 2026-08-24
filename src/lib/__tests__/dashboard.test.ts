import {
  selectNextEvent,
  selectUpcomingRegistrations,
  isUpcomingEvent,
} from '@/lib/dashboard/nextEvent';
import {
  hasLinkedResults,
  isProfileIncomplete,
  selectRecentResults,
} from '@/lib/dashboard/results';
import { buildDashboardDto } from '@/lib/dashboard/buildDashboard';
import type { Score } from '@/types/scores';

const today = new Date('2026-08-24T12:00:00.000Z');

function event(id: string, date: string, status = 'open') {
  return {
    id,
    title: `Event ${id}`,
    date,
    location: 'Range',
    status,
  };
}

describe('dashboard next event', () => {
  it('prefers nearest registered upcoming event', () => {
    const eventsById = {
      e1: event('e1', '2026-10-10'),
      e2: event('e2', '2026-09-15'),
      e3: event('e3', '2026-11-01'),
    };
    const result = selectNextEvent({
      eventsById,
      registrations: [
        { id: 'r1', eventId: 'e1', eventTitle: 'A', status: 'registered' },
        { id: 'r2', eventId: 'e2', eventTitle: 'B', status: 'registered' },
      ],
      openEvents: Object.values(eventsById),
      today,
    });
    expect(result?.event.id).toBe('e2');
    expect(result?.isRegistered).toBe(true);
  });

  it('falls back to nearest open upcoming event when not registered', () => {
    const open = [event('e1', '2026-10-10'), event('e2', '2026-09-20')];
    const result = selectNextEvent({
      eventsById: Object.fromEntries(open.map((e) => [e.id, e])),
      registrations: [],
      openEvents: open,
      today,
    });
    expect(result?.event.id).toBe('e2');
    expect(result?.isRegistered).toBe(false);
  });

  it('excludes past events', () => {
    expect(isUpcomingEvent(event('p', '2026-01-01'), today)).toBe(false);
    const result = selectNextEvent({
      eventsById: { p: event('p', '2026-01-01') },
      registrations: [{ id: 'r', eventId: 'p', eventTitle: 'Past', status: 'registered' }],
      openEvents: [],
      today,
    });
    expect(result).toBeNull();
  });
});

describe('dashboard registrations', () => {
  it('returns upcoming registrations sorted and capped', () => {
    const eventsById = {
      e1: event('e1', '2026-10-10'),
      e2: event('e2', '2026-09-01'),
      e3: event('e3', '2026-12-01'),
      past: event('past', '2026-01-01'),
    };
    const rows = selectUpcomingRegistrations({
      registrations: [
        { id: 'r1', eventId: 'e1', eventTitle: 'A', status: 'registered' },
        { id: 'r2', eventId: 'e2', eventTitle: 'B', status: 'registered' },
        { id: 'r3', eventId: 'e3', eventTitle: 'C', status: 'registered' },
        { id: 'r4', eventId: 'past', eventTitle: 'Old', status: 'registered' },
        { id: 'r5', eventId: 'e1', eventTitle: 'Dup', status: 'cancelled' },
      ],
      eventsById,
      limit: 2,
      today,
    });
    expect(rows.map((r) => r.eventId)).toEqual(['e2', 'e1']);
  });
});

describe('dashboard results', () => {
  const base = {
    id: 's1',
    userId: 'uid-1',
    eventId: 'ev1',
    eventName: 'SATRF Event',
    discipline: 'prone_50m' as const,
    date: '2026-06-27',
    decimalTotal: 587.2,
    integerTotal: 587,
    innerTens: 20,
    totalShots: 60,
    stage: 'qualification' as const,
    shooterName: 'Test',
    club: 'Club',
    category: 'open' as const,
    scoringType: 'decimal' as const,
    status: 'official' as const,
    source: 'manual' as const,
    positions: [],
    createdBy: 'admin',
    createdAt: '2026-06-27T00:00:00.000Z',
    updatedAt: '2026-06-27T00:00:00.000Z',
  } satisfies Score;

  it('hasLinkedResults is true when scores exist for uid query', () => {
    expect(hasLinkedResults([base])).toBe(true);
    expect(hasLinkedResults([])).toBe(false);
  });

  it('no scores is not the same as unlinked profile — empty means no results yet', () => {
    const dto = buildDashboardDto({
      user: { firstName: 'John' },
      next: null,
      upcomingRegs: [],
      scores: [],
      notifications: { unreadCount: 0, recent: [] },
      hasCallForEntries: false,
    });
    expect(dto.user.hasLinkedResults).toBe(false);
    expect(dto.results).toHaveLength(0);
  });

  it('keeps qualification and finals as separate rows', () => {
    const qual = { ...base, id: 'q', stage: 'qualification' as const, decimalTotal: 580 };
    const fin = { ...base, id: 'f', stage: 'prone_final' as const, decimalTotal: 40.5, date: '2026-06-27' };
    const rows = selectRecentResults([fin, qual], 5);
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.stage)).toEqual(expect.arrayContaining(['qualification', 'prone_final']));
  });

  it('does not use name matching — only userId-linked scores in caller query', () => {
    const unlinked = { ...base, userId: null, shooterName: 'Same Name' };
    expect(hasLinkedResults([unlinked])).toBe(true);
  });
});

describe('dashboard DTO', () => {
  it('strips sensitive fields and uses Registered status only', () => {
    const dto = buildDashboardDto({
      user: { firstName: 'Arnold', lastName: 'A', club: 'Club', province: 'GP' },
      next: { event: event('e1', '2026-10-10'), isRegistered: true },
      upcomingRegs: [
        {
          id: 'r1',
          eventId: 'e1',
          eventTitle: 'Champs',
          status: 'registered',
          event: event('e1', '2026-10-10'),
        },
      ],
      scores: [],
      notifications: { unreadCount: 2, recent: [] },
      hasCallForEntries: true,
    });

    expect(dto.user.firstName).toBe('Arnold');
    expect(dto.registrations[0].statusLabel).toBe('Registered');
    expect(dto.nextEvent?.isRegistered).toBe(true);
    expect(dto.user.hasLinkedResults).toBe(false);
    expect(JSON.stringify(dto)).not.toMatch(/memberId|authUid|paid|payment|competitionProfile/i);
  });

  it('flags incomplete profile when club or province missing', () => {
    expect(isProfileIncomplete({ firstName: 'A', club: '', province: 'GP' })).toBe(true);
    expect(isProfileIncomplete({ firstName: 'A', club: 'C', province: 'GP' })).toBe(false);
  });

  it('preserves partial errors without crashing DTO', () => {
    const dto = buildDashboardDto({
      user: { firstName: 'Jane' },
      next: null,
      upcomingRegs: [],
      scores: [],
      notifications: { unreadCount: 0, recent: [] },
      hasCallForEntries: false,
      errors: { registrations: 'Registrations could not be loaded' },
    });
    expect(dto.errors?.registrations).toBeTruthy();
    expect(dto.user.firstName).toBe('Jane');
  });
});
