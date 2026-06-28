import type { EventResultRow } from '@/lib/issf';
import { buildResultsPdfFilename } from '@/lib/eventResultsPdf';
import { TextDecoder, TextEncoder } from 'util';

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder as typeof global.TextEncoder;
  global.TextDecoder = TextDecoder as typeof global.TextDecoder;
}

function qualRow(overrides: Partial<EventResultRow> = {}): EventResultRow {
  return {
    place: 1,
    shooterName: 'Test Shooter',
    club: 'Test Club',
    category: 'open',
    stage: 'qualification',
    decimalTotal: 620.5,
    integerTotal: 0,
    series: [
      { seriesNumber: 1, decimal: 103.2 },
      { seriesNumber: 2, decimal: 104.1 },
      { seriesNumber: 3, decimal: 103.8 },
      { seriesNumber: 4, decimal: 103.5 },
      { seriesNumber: 5, decimal: 102.9 },
      { seriesNumber: 6, decimal: 103.0 },
    ],
    ...overrides,
  };
}

describe('eventResultsPdf', () => {
  describe('buildResultsPdfFilename', () => {
    it('sanitizes event name and includes discipline', () => {
      expect(buildResultsPdfFilename('SATRF Prone #3', 'prone_50m')).toBe(
        'SATRF-SATRF-Prone-3-prone_50m-results.pdf'
      );
    });

    it('handles empty name', () => {
      expect(buildResultsPdfFilename('!!!', 'fclass_tr')).toBe(
        'SATRF-event-fclass_tr-results.pdf'
      );
    });
  });

  describe('generateEventResultsPdf', () => {
    it('returns a valid PDF buffer for prone qualification rows', async () => {
      const { generateEventResultsPdf } = await import('@/lib/eventResultsPdf');
      const buf = await generateEventResultsPdf({
        eventName: 'Test Match',
        date: '2025-06-15',
        discipline: 'prone_50m',
        category: 'all',
        hasFinal: false,
        qualification: [
          qualRow({ place: 1, shooterName: 'Alice' }),
          qualRow({ place: 2, shooterName: 'Bob', decimalTotal: 615.0 }),
        ],
      });

      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(buf.subarray(0, 4).toString('utf8')).toBe('%PDF');
      expect(buf.length).toBeGreaterThan(500);
    });

    it('generates PDF when no results published', async () => {
      const { generateEventResultsPdf } = await import('@/lib/eventResultsPdf');
      const buf = await generateEventResultsPdf({
        eventName: 'Empty Event',
        discipline: 'prone_50m',
        category: 'all',
        hasFinal: false,
        qualification: [],
      });

      expect(buf.subarray(0, 4).toString('utf8')).toBe('%PDF');
    });
  });
});
