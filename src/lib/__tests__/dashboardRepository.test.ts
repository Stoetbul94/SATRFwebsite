import {
  eventLikeFromFirestore,
  loadEventsByIds,
  DASHBOARD_CANDIDATE_EVENT_LIMIT,
} from '@/lib/dashboard/repository';
import { isUpcomingEvent } from '@/lib/dashboard/nextEvent';

describe('dashboard repository event serialization', () => {
  it('converts Firestore Timestamp to ISO via canonical serializeEventDoc', () => {
    const eventDate = new Date('2026-10-10T00:00:00.000Z');
    const event = eventLikeFromFirestore('ev-ts', {
      title: 'Championship',
      date: { toDate: () => eventDate },
      location: 'Modderbee',
      status: 'open',
    });

    expect(event.date).toBe(eventDate.toISOString());
    expect(event.title).toBe('Championship');
  });

  it('treats future Timestamp events as upcoming', () => {
    const future = eventLikeFromFirestore('ev-f', {
      title: 'Future',
      date: { toDate: () => new Date('2027-06-01T00:00:00.000Z') },
      status: 'open',
    });
    const today = new Date('2026-08-24T12:00:00.000Z');
    expect(isUpcomingEvent(future, today)).toBe(true);
  });

  it('excludes past Timestamp events', () => {
    const past = eventLikeFromFirestore('ev-p', {
      title: 'Past',
      date: { toDate: () => new Date('2024-01-01T00:00:00.000Z') },
      status: 'open',
    });
    const today = new Date('2026-08-24T12:00:00.000Z');
    expect(isUpcomingEvent(past, today)).toBe(false);
  });

  it('preserves ISO string dates from canonical serializer', () => {
    const event = eventLikeFromFirestore('ev-s', {
      title: 'String date',
      date: '2026-09-15T00:00:00.000Z',
      status: 'open',
    });
    expect(event.date).toBe('2026-09-15T00:00:00.000Z');
  });
});

describe('loadEventsByIds duplicate prevention', () => {
  it('does not re-fetch events already in the existing map', async () => {
    const existing = eventLikeFromFirestore('ev-1', {
      title: 'Cached',
      date: '2026-10-10T00:00:00.000Z',
      status: 'open',
    });

    const get = jest.fn();
    const db = {
      collection: () => ({
        doc: () => ({ get }),
      }),
    } as unknown as Parameters<typeof loadEventsByIds>[0];

    const result = await loadEventsByIds(db, ['ev-1'], { 'ev-1': existing });

    expect(get).not.toHaveBeenCalled();
    expect(result['ev-1']).toEqual(existing);
  });

  it('fetches only ids missing from the existing map', async () => {
    const get = jest
      .fn()
      .mockResolvedValueOnce({
        exists: true,
        id: 'ev-2',
        data: () => ({ title: 'Fetched', date: '2026-11-01T00:00:00.000Z', status: 'open' }),
      });
    const db = {
      collection: () => ({
        doc: (id: string) => ({ get: () => get(id) }),
      }),
    } as unknown as Parameters<typeof loadEventsByIds>[0];

    const cached = eventLikeFromFirestore('ev-1', {
      title: 'Cached',
      date: '2026-10-10T00:00:00.000Z',
      status: 'open',
    });

    await loadEventsByIds(db, ['ev-1', 'ev-2'], { 'ev-1': cached });

    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith('ev-2');
  });
});

describe('dashboard candidate event limit', () => {
  it('uses a bounded fallback window', () => {
    expect(DASHBOARD_CANDIDATE_EVENT_LIMIT).toBeLessThanOrEqual(20);
  });
});
