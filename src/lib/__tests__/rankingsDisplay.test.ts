import type { Score } from '@/types/scores';
import { provinceAbbrev } from '@/lib/memberFields';
import {
  aggregateShooterRings,
  formatEventsCell,
  formatScoreTotalDisplay,
  hasRecordedRings,
  rankingValueForScore,
  ringTotalForScore,
  sortRankRows,
  sortRankRowsForDiscipline,
  formatScorePair,
  formatSeriesScoreDisplay,
  qualScoreVariant,
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

    it('bestRings is the highest ring score across events', () => {
      const scores = [
        qualScore({ decimalTotal: 580, integerTotal: 540 }),
        qualScore({ decimalTotal: 578.6, integerTotal: 550 }),
      ];
      const { bestRings } = aggregateShooterRings(scores);
      expect(bestRings).toBe(550);
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

  describe('sortRankRowsForDiscipline', () => {
    it('3P sorts by ring average when both have rings', () => {
      const rows = sortRankRowsForDiscipline(
        [
          { average: 560, averageRings: 520, rank: 0 },
          { average: 550, averageRings: 530, rank: 0 },
        ],
        'three_position_50m'
      );
      expect(rows[0].averageRings).toBe(530);
      expect(rows[0].rank).toBe(1);
    });

    it('3P tiebreaks ring ties by decimal average', () => {
      const rows = sortRankRowsForDiscipline(
        [
          { average: 551.7, averageRings: 524, rank: 0 },
          { average: 558.8, averageRings: 524, rank: 0 },
        ],
        'three_position_50m'
      );
      expect(rows[0].average).toBe(558.8);
    });

    it('F-Class sorts by ring average when both have rings', () => {
      const rows = sortRankRowsForDiscipline(
        [
          { average: 0, averageRings: 580, rank: 0 },
          { average: 0, averageRings: 589, rank: 0 },
        ],
        'fclass_tr'
      );
      expect(rows[0].averageRings).toBe(589);
      expect(rows[0].rank).toBe(1);
    });
  });

  describe('rankingValueForScore', () => {
    it('returns ring total for F-Class when rings recorded', () => {
      expect(
        rankingValueForScore({
          discipline: 'fclass_tr',
          decimalTotal: 0,
          integerTotal: 589,
          positions: [],
        })
      ).toBe(589);
    });

    it('returns decimal total for non-F-Class', () => {
      expect(
        rankingValueForScore({
          discipline: 'prone_50m',
          decimalTotal: 621.5,
          integerTotal: 0,
          positions: [],
        })
      ).toBe(621.5);
    });
  });

  describe('formatScoreTotalDisplay', () => {
    it('shows ring-only F-Class total without (0.0)', () => {
      expect(
        formatScoreTotalDisplay({
          discipline: 'fclass_tr',
          stage: 'qualification',
          decimalTotal: 0,
          integerTotal: 589,
          positions: [],
        })
      ).toBe('589');
    });

    it('shows both ring and decimal when both recorded', () => {
      expect(
        formatScoreTotalDisplay({
          discipline: 'fclass_open',
          stage: 'qualification',
          decimalTotal: 578.6,
          integerTotal: 589,
          positions: [],
        })
      ).toBe('589 (578.6)');
    });
  });

  describe('formatScorePair', () => {
    it('ringPrimary shows rings first', () => {
      expect(formatScorePair(551.7, 524, 'ringPrimary')).toEqual({
        primary: '524',
        secondary: '551.7',
      });
    });

    it('ringPrimary omits secondary when decimal is zero', () => {
      expect(formatScorePair(0, 589, 'ringPrimary')).toEqual({
        primary: '589',
        secondary: null,
      });
    });

    it('decimalPrimary shows decimal first', () => {
      expect(formatScorePair(578.6, 550, 'decimalPrimary')).toEqual({
        primary: '578.6',
        secondary: '550',
      });
    });
  });

  describe('formatSeriesScoreDisplay', () => {
    it('shows F-Class ring-only series without decimal suffix', () => {
      expect(formatSeriesScoreDisplay({ decimal: 0, integer: 99 }, 'fclass_tr', 'qualification')).toBe(
        '99'
      );
    });

    it('shows F-Class series with both ring and decimal', () => {
      expect(formatSeriesScoreDisplay({ decimal: 98.5, integer: 99 }, 'fclass_open', 'qualification')).toBe(
        '99 (98.5)'
      );
    });

    it('shows prone decimal series unchanged', () => {
      expect(formatSeriesScoreDisplay({ decimal: 100.7, integer: 95 }, 'prone_50m', 'qualification')).toBe(
        '100.7'
      );
    });

    it('returns em dash for missing series', () => {
      expect(formatSeriesScoreDisplay(undefined, 'fclass_tr')).toBe('—');
      expect(formatSeriesScoreDisplay({ missing: true }, 'fclass_tr')).toBe('—');
    });
  });

  describe('qualScoreVariant', () => {
    it('uses ringPrimary for 3P and F-Class qualification', () => {
      expect(qualScoreVariant('three_position_50m', 'qualification')).toBe('ringPrimary');
      expect(qualScoreVariant('fclass_open', 'qualification')).toBe('ringPrimary');
      expect(qualScoreVariant('fclass_tr', 'qualification')).toBe('ringPrimary');
    });

    it('uses decimalPrimary for finals and prone qual', () => {
      expect(qualScoreVariant('three_position_50m', '3p_final')).toBe('decimalPrimary');
      expect(qualScoreVariant('prone_50m', 'qualification')).toBe('decimalPrimary');
      expect(qualScoreVariant('prone_50m', 'prone_final')).toBe('decimalPrimary');
    });

    it('uses ringPrimary for F-Class at all stages', () => {
      expect(qualScoreVariant('fclass_tr', 'prone_final')).toBe('ringPrimary');
      expect(qualScoreVariant('fclass_open', 'prone_final')).toBe('ringPrimary');
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
