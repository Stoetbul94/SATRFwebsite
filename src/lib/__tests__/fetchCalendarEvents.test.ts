import fs from 'fs';
import path from 'path';
import { eventsAPI } from '@/lib/api';
import { fetchCalendarEvents } from '@/lib/events/fetchCalendarEvents';
import { MOCK_EVENTS } from '@/lib/events';

jest.mock('@/lib/api', () => ({
  eventsAPI: {
    getAll: jest.fn(),
  },
}));

const mockGetAll = eventsAPI.getAll as jest.MockedFunction<typeof eventsAPI.getAll>;

describe('fetchCalendarEvents', () => {
  beforeEach(() => {
    mockGetAll.mockReset();
  });

  it('normalises a successful /api/events payload', async () => {
    mockGetAll.mockResolvedValue([
      {
        id: 'evt-1',
        title: 'League 1',
        date: '2026-09-05T00:00:00.000Z',
        location: 'Pretoria',
        status: 'upcoming',
        disciplines: ['prone_50m'],
      },
    ]);

    const events = await fetchCalendarEvents();
    expect(mockGetAll).toHaveBeenCalledTimes(1);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      id: 'evt-1',
      title: 'League 1',
      location: 'Pretoria',
      start: '2026-09-05',
      status: 'OPEN',
    });
  });

  it('returns an empty array when /api/events has no events', async () => {
    mockGetAll.mockResolvedValue([]);
    await expect(fetchCalendarEvents()).resolves.toEqual([]);
  });

  it('propagates /api/events failures and does not return MOCK_EVENTS', async () => {
    mockGetAll.mockRejectedValue(new Error('HTTP error! status: 500'));

    await expect(fetchCalendarEvents()).rejects.toThrow('HTTP error! status: 500');
    expect(MOCK_EVENTS.length).toBeGreaterThan(0);
  });
});

describe('production mock guard', () => {
  it('never uses MOCK_EVENTS from the calendar fetch module', () => {
    const src = fs.readFileSync(path.join(__dirname, '../events/fetchCalendarEvents.ts'), 'utf8');
    const page = fs.readFileSync(path.join(__dirname, '../../pages/events/calendar.tsx'), 'utf8');
    expect(src).not.toMatch(/MOCK_EVENTS/);
    expect(page).not.toMatch(/MOCK_EVENTS/);
    expect(page).not.toMatch(/getLegacyApiBaseUrl|NEXT_PUBLIC_API_BASE_URL|localhost:8000/);
  });
});
