import type { Score } from '@/types/scores';
import { provinceAbbrev } from '@/lib/memberFields';
import {
  aggregateShooterRings,
  formatEventsCell,
  hasRecordedRings,
  ringTotalForScore,
  sortRankRows,
} from '@/lib/rankingsDisplay';

function qualScore(
  overrides: Partial<Score> & Pick<Score, 'decimalTotal'>
): Pick<Score, 'decimalTotal' | 'integerTotal' | 'positions'> {
  return {
    integerTotal: 0,
    positions: [],
    ...overrides,
  };
}

describe('rankingsDisplay', () => {
  describe('hasRecordedRings', () => {
    it('returns true when integerTotal > 0', () => {
      expect(hasRecordedRings(qualScore({ decimalTotal: 578.6, integerTotal: 550 }))).toBe(true);
    });

    it('returns false when integerTotal is 0 and no series rings', () => {
      expect(hasRecordedRings(qualScore({ decimalTotal: 578.6, integerTotal: 0 }))).toBe(false);
    });
  });

  describe('ringTotalForScore', () => {
    it('returns integerTotal when rings recorded', () => {
      expect(ringTotalForScore(qualScore({ decimalTotal: 578.6, integerTotal: 550 }))).toBe(550);
    });

    it('returns null when no rings', () => {
      expect(ringTotalForScore(qualScore({ decimalTotal: 578.6, integerTotal: 0 }))).toBeNull();
    });
  });

  describe('aggregateShooterRings', () => {
    it('Arnold Bailie: average and best pair 578.6 with 550 rings', () => {
      const scores = [qualScore({ decimalTotal: 578.6, integerTotal: 550 })];
      const { averageRings, bestRings } = aggregateShooterRings(scores);
      expect(averageRings).toBe(550);
      expect(bestRings).toBe(550);
    });

    it('returns null rings when no scores have rings', () => {
      const scores = [qualScore({ decimalTotal: 578.6, integerTotal: 0 })];
      const { averageRings, bestRings } = aggregateShooterRings(scores);
      expect(averageRings).toBeNull();
      expect(bestRings).toBeNull();
    });

    it('bestRings comes from the score with highest decimal, not highest rings', () => {
      const scores = [
        qualScore({ decimalTotal: 580, integerTotal: 540 }),
        qualScore({ decimalTotal: 578.6, integerTotal: 550 }),
      ];
      const { bestRings } = aggregateShooterRings(scores);
      expect(bestRings).toBe(540);
    });
  });

  describe('formatEventsCell', () => {
    it('shows competed / total when season total available', () => {
      expect(formatEventsCell(1, 4)).toBe('1 / 4');
    });

    it('shows competed only when no season total', () => {
      expect(formatEventsCell(1, null)).toBe('1');
      expect(formatEventsCell(3, 0)).toBe('3');
    });
  });

  describe('sortRankRows', () => {
    it('sorts by decimal average descending', () => {
      const rows = sortRankRows([
        { average: 570, averageRings: 500, rank: 0 },
        { average: 580, averageRings: 520, rank: 0 },
      ]);
      expect(rows[0].average).toBe(580);
      expect(rows[0].rank).toBe(1);
    });

    it('tiebreaker: higher ring average ranks higher when decimal ties', () => {
      const rows = sortRankRows([
        { average: 580, averageRings: 520, rank: 0 },
        { average: 580, averageRings: 545, rank: 0 },
      ]);
      expect(rows[0].averageRings).toBe(545);
      expect(rows[1].averageRings).toBe(520);
    });
  });

  describe('provinceAbbrev', () => {
    it('abbreviates North West to NW', () => {
      expect(provinceAbbrev('North West')).toBe('NW');
    });

    it('returns null for unknown province', () => {
      expect(provinceAbbrev('Unknown')).toBeNull();
      expect(provinceAbbrev(null)).toBeNull();
    });
  });
});
