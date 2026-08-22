import { TextDecoder, TextEncoder } from 'util';
import {
  filterPublishedDocuments,
  parseEventDocumentStatus,
  parseEventDocumentType,
  serializeEventDocument,
  sortPublicDocuments,
} from '@/lib/eventDocuments/serialize';
import { isDocumentStale, buildDownloadFileName } from '@/lib/eventDocuments/staleCheck';
import {
  parseOptionalTime,
  parseOptionalDateTime,
  applyOptionalEventFields,
} from '@/lib/eventDocuments/eventFields';
import {
  prefillCallForEntriesData,
  validateCallForEntriesData,
  buildCallForEntriesEventBlock,
} from '@/lib/eventDocuments/callForEntries/prefill';
import { generateCallForEntriesPdf, isPdfBuffer } from '@/lib/eventDocuments/callForEntries/pdf';
import type { CallForEntriesData } from '@/lib/eventDocuments/callForEntries/types';
import { mapPublicDocumentsToHub } from '@/lib/eventHub/documents';

describe('event document serialization', () => {
  it('parses document type and status safely', () => {
    expect(parseEventDocumentType('call-for-entries')).toBe('call-for-entries');
    expect(parseEventDocumentType('unknown')).toBe('other');
    expect(parseEventDocumentStatus('published')).toBe('published');
    expect(parseEventDocumentStatus('')).toBe('draft');
  });

  it('serializes linked event IDs from payload', () => {
    const doc = serializeEventDocument('doc1', {
      linkedEventIds: ['evt-a', 'evt-b'],
      type: 'call-for-entries',
      title: '2026 SATRF Event 4',
      status: 'published',
      version: 2,
      fileUrl: 'https://example.com/file.pdf',
      publishedAt: '2026-08-22T10:00:00.000Z',
    });

    expect(doc.linkedEventIds).toEqual(['evt-a', 'evt-b']);
    expect(doc.version).toBe(2);
  });

  it('filters published-only documents for public API', () => {
    const docs = [
      serializeEventDocument('d1', {
        linkedEventIds: ['evt1'],
        type: 'call-for-entries',
        title: 'Draft',
        status: 'draft',
        fileUrl: 'https://example.com/draft.pdf',
      }),
      serializeEventDocument('d2', {
        linkedEventIds: ['evt1'],
        type: 'call-for-entries',
        title: 'Published',
        status: 'published',
        fileUrl: 'https://example.com/live.pdf',
        publishedAt: '2026-08-22T10:00:00.000Z',
        downloadFileName: 'satrf-call-for-entries-v1.pdf',
      }),
      serializeEventDocument('d3', {
        linkedEventIds: ['evt1'],
        type: 'programme',
        title: 'Archived programme',
        status: 'archived',
        fileUrl: 'https://example.com/old.pdf',
        publishedAt: '2026-07-01T10:00:00.000Z',
      }),
    ];

    const published = filterPublishedDocuments(docs);
    expect(published).toHaveLength(1);
    expect(published[0].title).toBe('Published');
    expect(sortPublicDocuments(published)[0].type).toBe('call-for-entries');
  });
});

describe('multi-event call for entries prefill', () => {
  it('builds combined call for entries with two linked events', () => {
    const data = prefillCallForEntriesData({
      linkedEventIds: ['evt-3p', 'evt-prone'],
      eventsById: {
        'evt-3p': {
          title: 'SATRF 50 m Rifle 3 Positions',
          disciplines: ['3p_50m'],
          date: '2026-08-29T00:00:00.000Z',
          location: 'Modderbee Correctional Services Shooting Range',
          startTime: '09:00',
          equipmentInspectionTime: '08:00',
          registrationDeadline: '2026-08-27T00:00:00.000Z',
          price: 300,
        },
        'evt-prone': {
          title: 'SATRF 50 m Rifle Prone',
          disciplines: ['prone_50m'],
          date: '2026-09-05T00:00:00.000Z',
          location: 'Modderbee Correctional Services Shooting Range',
          startTime: '09:00',
          equipmentInspectionTime: '08:00',
          registrationDeadline: '2026-09-03T00:00:00.000Z',
          price: 300,
        },
      },
    });

    expect(data.linkedEventIds).toEqual(['evt-3p', 'evt-prone']);
    expect(data.events).toHaveLength(2);
    expect(data.entryFeeLabel).toBe('R300');
    expect(validateCallForEntriesData(data)).toEqual([]);
  });
});

describe('optional event fields', () => {
  it('parses HH:mm times and optional deadline', () => {
    expect(parseOptionalTime('9:00')).toBe('09:00');
    expect(parseOptionalTime('25:00')).toBeNull();

    const deadline = parseOptionalDateTime('2026-08-27T17:00:00.000Z');
    expect(deadline?.toDate().toISOString()).toContain('2026-08-27');
  });

  it('applies optional fields without requiring all of them', () => {
    const target: Record<string, unknown> = {};
    applyOptionalEventFields(
      {
        startTime: '09:00',
        equipmentInspectionTime: '08:00',
        registrationDeadline: '2026-08-27T17:00:00.000Z',
        mapUrl: 'https://maps.example.com/venue',
      },
      target,
    );

    expect(target.startTime).toBe('09:00');
    expect(target.equipmentInspectionTime).toBe('08:00');
    expect(target.mapUrl).toBe('https://maps.example.com/venue');
    expect(target.registrationDeadline).toBeDefined();
  });
});

describe('stale document detection', () => {
  it('flags documents when linked event updatedAt is newer', () => {
    const doc = serializeEventDocument('doc1', {
      linkedEventIds: ['evt1'],
      type: 'call-for-entries',
      title: 'Call for Entries',
      status: 'draft',
      generatedFromEventUpdatedAt: '2026-08-20T10:00:00.000Z',
    });

    expect(
      isDocumentStale(doc, {
        evt1: '2026-08-21T10:00:00.000Z',
      }),
    ).toBe(true);

    expect(
      isDocumentStale(doc, {
        evt1: '2026-08-19T10:00:00.000Z',
      }),
    ).toBe(false);
  });
});

describe('call for entries PDF', () => {
  beforeAll(() => {
    global.TextEncoder = TextEncoder as typeof global.TextEncoder;
    global.TextDecoder = TextDecoder as typeof global.TextDecoder;
  });

  it('generates a non-empty PDF buffer with valid signature', async () => {
    const data: CallForEntriesData = {
      documentTitle: '2026 SATRF Event 4',
      linkedEventIds: ['evt-3p', 'evt-prone'],
      events: [
        buildCallForEntriesEventBlock('evt-3p', {
          title: 'SATRF 50 m Rifle 3 Positions',
          disciplines: ['3p_50m'],
          date: '2026-08-29T00:00:00.000Z',
          location: 'Modderbee Correctional Services Shooting Range',
          startTime: '09:00',
          equipmentInspectionTime: '08:00',
          registrationDeadline: '2026-08-27T00:00:00.000Z',
        }),
        buildCallForEntriesEventBlock('evt-prone', {
          title: 'SATRF 50 m Rifle Prone',
          disciplines: ['prone_50m'],
          date: '2026-09-05T00:00:00.000Z',
          location: 'Modderbee Correctional Services Shooting Range',
          startTime: '09:00',
          equipmentInspectionTime: '08:00',
          registrationDeadline: '2026-09-03T00:00:00.000Z',
        }),
      ],
      entryFeeLabel: 'R300',
      paymentInfo: 'Bank: Example Bank\nAccount number: 123456789',
      contactName: 'SATRF Admin',
      contactEmail: 'support@satrf.org.za',
      registrationInfo: 'Register online at rifleshooting.co.za',
    };

    const buffer = await generateCallForEntriesPdf(data);
    expect(buffer.length).toBeGreaterThan(500);
    expect(isPdfBuffer(buffer)).toBe(true);
    expect(buildDownloadFileName(data, 1)).toContain('satrf-');
  });
});

describe('public hub document mapping', () => {
  it('maps published API documents into hub view model documents', () => {
    const mapped = mapPublicDocumentsToHub('evt1', [
      {
        id: 'doc1',
        type: 'call-for-entries',
        title: '2026 SATRF Event 4',
        fileUrl: 'https://example.com/cfe.pdf',
        publishedAt: '2026-08-22T10:00:00.000Z',
        downloadFileName: 'satrf-2026-event-4-call-for-entries-v1.pdf',
        version: 1,
      },
    ]);

    expect(mapped[0].downloadFileName).toContain('satrf-');
    expect(mapped[0].status).toBe('published');
  });
});
