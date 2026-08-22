import {
  civilDateInJohannesburg,
  mapEventStatusToCalendar,
  normalizeCalendarEvent,
  normalizeCalendarEvents,
} from '@/lib/events/normalizeCalendarEvent';

describe('civilDateInJohannesburg', () => {
  it('keeps a Johannesburg civil date for a UTC midnight ISO timestamp', () => {
    expect(civilDateInJohannesburg('2026-09-05T00:00:00.000Z')).toBe('2026-09-05');
  });

  it('does not shift a date-only string onto the previous day', () => {
    expect(civilDateInJohannesburg('2026-09-05')).toBe('2026-09-05');
    expect(civilDateInJohannesburg('2026-09-05')).not.toBe('2026-09-04');
  });

  it('uses Africa/Johannesburg when UTC instant is the previous evening', () => {
    expect(civilDateInJohannesburg('2026-09-04T22:00:00.000Z')).toBe('2026-09-05');
  });
});

describe('mapEventStatusToCalendar', () => {
  it('maps Firestore statuses onto calendar OPEN/FULL/CLOSED/CANCELLED', () => {
    expect(mapEventStatusToCalendar('upcoming', 0, 20)).toBe('OPEN');
    expect(mapEventStatusToCalendar('open', 20, 20)).toBe('FULL');
    expect(mapEventStatusToCalendar('completed', 5, 20)).toBe('CLOSED');
    expect(mapEventStatusToCalendar('cancelled', 0, 20)).toBe('CANCELLED');
    expect(mapEventStatusToCalendar('unknown-status', 0, 20)).toBe('OPEN');
  });

  it('treats maxParticipants = 0 as unlimited even with current entries', () => {
    expect(mapEventStatusToCalendar('open', 12, 0)).toBe('OPEN');
  });

  it('does not treat unlimited capacity (max 0) as FULL', () => {
    expect(mapEventStatusToCalendar('upcoming', 0, 0)).toBe('OPEN');
  });
});

describe('normalizeCalendarEvent', () => {
  it('maps a Firestore/API event onto the calendar Event shape', () => {
    const event = normalizeCalendarEvent({
      id: 'evt-1',
      title: 'Western Province Open',
      description: 'Provincial championship',
      date: '2026-09-05T00:00:00.000Z',
      location: 'Cape Town',
      type: 'Prone',
      disciplines: ['prone_50m'],
      status: 'upcoming',
      maxParticipants: 40,
      currentParticipants: 12,
      price: 250,
      payfastUrl: 'https://pay.example/evt-1',
      eftInstructions: 'Use reference WPOPEN',
    });

    expect(event).toMatchObject({
      id: 'evt-1',
      title: 'Western Province Open',
      location: 'Cape Town',
      discipline: 'Prone',
      status: 'OPEN',
      maxSpots: 40,
      currentSpots: 12,
      price: 250,
      allDay: true,
      start: '2026-09-05',
      end: '2026-09-05',
      payfastUrl: 'https://pay.example/evt-1',
    });
    expect(event?.disciplines).toEqual(['prone_50m']);
    expect(event?.source).toBeUndefined();
  });

  it('fills optional fields with safe defaults', () => {
    const event = normalizeCalendarEvent({
      id: 'evt-2',
      date: '2026-10-10T00:00:00.000Z',
    });

    expect(event).toMatchObject({
      id: 'evt-2',
      title: 'Untitled Event',
      description: '',
      location: '',
      allDay: true,
      start: '2026-10-10',
      price: 0,
      maxSpots: 0,
      currentSpots: 0,
      status: 'OPEN',
    });
    expect(event?.source).toBeUndefined();
  });

  it('treats Firestore date-only events as all-day on the Johannesburg civil date', () => {
    const event = normalizeCalendarEvent({
      id: 'all-day',
      title: 'League 1',
      date: '2026-09-05T00:00:00.000Z',
    });

    expect(event?.allDay).toBe(true);
    expect(event?.start).toBe('2026-09-05');
    expect(event?.end).toBe('2026-09-05');
  });

  it('keeps 10 October as 2026-10-10 in Johannesburg', () => {
    const event = normalizeCalendarEvent({
      id: 'champs',
      title: 'SATRF SA CHAMPIONSHIPS',
      date: '2026-10-10T00:00:00.000Z',
    });

    expect(event?.start).toBe('2026-10-10');
    expect(event?.start).not.toBe('2026-10-09');
  });

  it('combines civil date with startTime/endTime for timed events', () => {
    const event = normalizeCalendarEvent({
      id: 'timed',
      title: 'Evening practice',
      date: '2026-09-05T00:00:00.000Z',
      startTime: '18:30',
      endTime: '21:00',
    });

    expect(event?.allDay).toBe(false);
    expect(event?.start).toBe('2026-09-05T18:30:00+02:00');
    expect(event?.end).toBe('2026-09-05T21:00:00+02:00');
  });

  it('does not infer ISSF from title or description text', () => {
    const event = normalizeCalendarEvent({
      id: 'prone-4',
      title: 'SATRF PRONE EVENT #4',
      description: 'ISSF 50m Prone Event #4 World Cup',
      date: '2026-09-05T00:00:00.000Z',
    });
    expect(event?.source).toBeUndefined();
  });

  it('preserves an explicit source only when the API provides it', () => {
    const event = normalizeCalendarEvent({
      id: 'issf-1',
      title: 'International',
      date: '2026-09-05T00:00:00.000Z',
      source: 'ISSF',
    });
    expect(event?.source).toBe('ISSF');
    expect(event?.isLocal).toBe(false);
  });

  it('drops events with no parseable date', () => {
    expect(normalizeCalendarEvent({ id: 'no-date', title: 'Broken' })).toBeNull();
    expect(normalizeCalendarEvent({ id: 'bad-date', date: 'not-a-date' })).toBeNull();
    expect(normalizeCalendarEvent(null)).toBeNull();
  });
});

describe('normalizeCalendarEvents', () => {
  it('returns an empty list for non-arrays and skips undated rows', () => {
    expect(normalizeCalendarEvents(null)).toEqual([]);
    expect(normalizeCalendarEvents({ error: 'nope' })).toEqual([]);
    expect(
      normalizeCalendarEvents([
        { id: 'ok', title: 'Keep', date: '2026-09-05T00:00:00.000Z' },
        { id: 'skip', title: 'Drop' },
      ])
    ).toHaveLength(1);
  });
});
