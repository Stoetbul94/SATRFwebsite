import {
  buildGoogleCalendarUrl,
  buildIcsFileContent,
  buildOutlookWebUrl,
} from '@/lib/eventCalendarLinks';
import { transformApiEventToHub } from '@/lib/eventHub/transformEvent';
import { deriveEventHubStatus } from '@/lib/eventHub/status';
import { parseEventDocuments } from '@/lib/eventHub/documents';

describe('event calendar links', () => {
  const base = {
    title: 'SATRF Prone Event #5',
    description: 'Club championship',
    location: 'Modderbee Shooting Range',
    eventUrl: 'https://www.rifleshooting.co.za/events/abc123',
    start: '2026-11-14T00:00:00.000Z',
  };

  it('builds Google all-day URL using Johannesburg civil date', () => {
    const url = buildGoogleCalendarUrl(base);
    expect(url).toContain('calendar.google.com');
    expect(url).toContain('dates=20261114%2F20261115');
    expect(url).toContain('text=SATRF+Prone+Event+%235');
  });

  it('builds ICS with VALUE=DATE (no UTC time shift)', () => {
    const ics = buildIcsFileContent(base, 'test@rifleshooting.co.za');
    expect(ics).toContain('DTSTART;VALUE=DATE:20261114');
    expect(ics).toContain('DTEND;VALUE=DATE:20261115');
    expect(ics).toContain('SUMMARY:SATRF Prone Event #5');
  });

  it('builds Outlook web deeplink', () => {
    const url = buildOutlookWebUrl(base);
    expect(url).toContain('outlook.live.com');
    expect(url).toContain('subject=');
  });
});

describe('event hub transform', () => {
  it('maps serialized event fields without inventing optional rows', () => {
    const hub = transformApiEventToHub({
      id: 'evt1',
      title: 'SATRF Prone Event #5',
      description: 'Annual prone match',
      date: '2026-11-14T00:00:00.000Z',
      location: 'Modderbee Shooting Range',
      disciplines: ['prone_50m'],
      status: 'open',
      maxParticipants: 40,
      currentParticipants: 12,
      price: 150,
    });

    expect(hub.title).toBe('SATRF Prone Event #5');
    expect(hub.registrationDeadline).toBeNull();
    expect(hub.hubStatus).toBe('OPEN FOR ENTRIES');
    expect(hub.disciplineLabels).toContain('Prone');
  });

  it('hides documents when none exist on raw payload', () => {
    expect(parseEventDocuments('evt1', { documents: [] })).toEqual([]);
    expect(parseEventDocuments('evt1', {})).toEqual([]);
  });

  it('parses published documents when present on raw payload', () => {
    const docs = parseEventDocuments('evt1', {
      documents: [
        {
          id: 'cfe1',
          type: 'call-for-entries',
          title: 'Call for Entries',
          fileUrl: '/documents/events/evt1/cfe.pdf',
          publishedAt: '2026-11-07T00:00:00.000Z',
          status: 'published',
        },
      ],
    });
    expect(docs).toHaveLength(1);
    expect(docs[0].title).toBe('Call for Entries');
  });
});

describe('event hub status', () => {
  it('marks cancelled events', () => {
    expect(
      deriveEventHubStatus({
        status: 'cancelled',
        eventDate: new Date('2026-12-01'),
      }),
    ).toBe('CANCELLED');
  });

  it('marks full events from capacity', () => {
    expect(
      deriveEventHubStatus({
        status: 'open',
        eventDate: new Date('2099-01-01'),
        maxParticipants: 10,
        currentParticipants: 10,
      }),
    ).toBe('EVENT FULL');
  });
});
