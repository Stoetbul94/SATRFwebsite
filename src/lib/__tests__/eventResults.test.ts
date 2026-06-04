import {
  buildEventResultBoard,
  availableDisciplinesFromScores,
  defaultDisciplineFromAvailable,
} from '../issf';
import type { Score } from '@/types/scores';

function baseScore(overrides: Partial<Score> & { id: string }): Score {
  return {
    userId: null,
    shooterName: 'Test Shooter',
    club: 'Test Club',
    category: 'open',
    eventId: 'evt-1',
    eventName: 'Test Event',
    date: '2025-01-15',
    discipline: 'prone_50m',
    scoringType: 'decimal',
    stage: 'qualification',
    positions: [
      {
        position: 'prone',
        series: [1, 2, 3, 4, 5, 6].map((n) => ({
          seriesNumber: n,
          decimal: 100 + n,
          integer: 95,
        })),
        decimalTotal: 603,
        integerTotal: 570,
        innerTens: 0,
      },
    ],
    decimalTotal: 603,
    integerTotal: 570,
    innerTens: 0,
    totalShots: 60,
    status: 'official',
    source: 'excel',
    createdBy: 'admin',
    createdAt: '2025-01-15T00:00:00.000Z',
    updatedAt: '2025-01-15T00:00:00.000Z',
    ...overrides,
  };
}

describe('buildEventResultBoard', () => {
  it('ranks qualification-only prone by decimalTotal desc', () => {
    const docs = [
      baseScore({ id: 'a', shooterName: 'Alice', decimalTotal: 610, positions: [{ position: 'prone', series: [], decimalTotal: 610, integerTotal: 0 }] }),
      baseScore({ id: 'b', shooterName: 'Bob', decimalTotal: 620, positions: [{ position: 'prone', series: [], decimalTotal: 620, integerTotal: 0 }] }),
      baseScore({ id: 'c', shooterName: 'Carol', decimalTotal: 600, positions: [{ position: 'prone', series: [], decimalTotal: 600, integerTotal: 0 }] }),
    ];
    const board = buildEventResultBoard(docs, 'prone_50m');
    expect(board.hasFinal).toBe(false);
    expect(board.qualification.map((r) => r.shooterName)).toEqual(['Bob', 'Alice', 'Carol']);
    expect(board.qualification.map((r) => r.place)).toEqual([1, 2, 3]);
  });

  it('excludes provisional scores for public view', () => {
    const docs = [
      baseScore({ id: 'a', decimalTotal: 650 }),
      baseScore({ id: 'b', decimalTotal: 640, status: 'provisional' }),
    ];
    const board = buildEventResultBoard(docs, 'prone_50m', { includeProvisional: false });
    expect(board.qualification).toHaveLength(1);
    expect(board.qualification[0].shooterName).toBe('Test Shooter');
  });

  it('includes provisional when includeProvisional is true', () => {
    const docs = [
      baseScore({ id: 'a', decimalTotal: 650 }),
      baseScore({ id: 'b', shooterName: 'Provisional', decimalTotal: 640, status: 'provisional' }),
    ];
    const board = buildEventResultBoard(docs, 'prone_50m', { includeProvisional: true });
    expect(board.qualification).toHaveLength(2);
    expect(board.qualification.find((r) => r.isProvisional)?.shooterName).toBe('Provisional');
  });

  it('filters by category', () => {
    const docs = [
      baseScore({ id: 'a', category: 'open', decimalTotal: 600 }),
      baseScore({ id: 'b', category: 'junior', decimalTotal: 610, shooterName: 'Junior' }),
    ];
    const board = buildEventResultBoard(docs, 'prone_50m', { category: 'junior' });
    expect(board.qualification).toHaveLength(1);
    expect(board.qualification[0].shooterName).toBe('Junior');
  });

  it('orders prone_final by finalRank and keeps qualification separate', () => {
    const docs = [
      baseScore({ id: 'q1', shooterName: 'Qual First', decimalTotal: 630 }),
      baseScore({
        id: 'f2',
        shooterName: 'Final Silver',
        stage: 'prone_final',
        decimalTotal: 620,
        finalRank: 2,
        positions: [{ position: 'prone', series: [], decimalTotal: 620, integerTotal: 0 }],
      }),
      baseScore({
        id: 'f1',
        shooterName: 'Final Gold',
        stage: 'prone_final',
        decimalTotal: 640,
        finalRank: 1,
        positions: [{ position: 'prone', series: [], decimalTotal: 640, integerTotal: 0 }],
      }),
    ];
    const board = buildEventResultBoard(docs, 'prone_50m');
    expect(board.hasFinal).toBe(true);
    expect(board.qualification[0].shooterName).toBe('Qual First');
    expect(board.final?.map((r) => r.shooterName)).toEqual(['Final Gold', 'Final Silver']);
    expect(board.final?.map((r) => r.place)).toEqual([1, 2]);
  });

  it('ranks 3p_final by elimination (null eliminatedAtShot wins)', () => {
    const docs = [
      baseScore({
        id: 'q1',
        discipline: 'three_position_50m',
        stage: 'qualification',
        decimalTotal: 600,
        positions: [],
      }),
      baseScore({
        id: 'f1',
        discipline: 'three_position_50m',
        stage: '3p_final',
        shooterName: 'Winner',
        decimalTotal: 400,
        finalShots: Array(35).fill(10),
        eliminatedAtShot: null,
        finalRank: 1,
        positions: [],
      }),
      baseScore({
        id: 'f2',
        discipline: 'three_position_50m',
        stage: '3p_final',
        shooterName: 'Bronze',
        decimalTotal: 380,
        finalShots: Array(34).fill(10),
        eliminatedAtShot: 34,
        finalRank: 3,
        positions: [],
      }),
      baseScore({
        id: 'f3',
        discipline: 'three_position_50m',
        stage: '3p_final',
        shooterName: 'Silver',
        decimalTotal: 390,
        finalShots: Array(34).fill(10),
        eliminatedAtShot: 35,
        finalRank: 2,
        positions: [],
      }),
    ];
    const board = buildEventResultBoard(docs, 'three_position_50m');
    expect(board.hasFinal).toBe(true);
    expect(board.final?.map((r) => r.shooterName)).toEqual(['Winner', 'Silver', 'Bronze']);
  });

  it('recomputes finalRank when missing on prone_final', () => {
    const docs = [
      baseScore({
        id: 'f-low',
        stage: 'prone_final',
        shooterName: 'Low',
        decimalTotal: 600,
        positions: [{ position: 'prone', series: [], decimalTotal: 600, integerTotal: 0 }],
      }),
      baseScore({
        id: 'f-high',
        stage: 'prone_final',
        shooterName: 'High',
        decimalTotal: 650,
        positions: [{ position: 'prone', series: [], decimalTotal: 650, integerTotal: 0 }],
      }),
    ];
    const board = buildEventResultBoard(docs, 'prone_50m');
    expect(board.final?.[0].shooterName).toBe('High');
    expect(board.final?.[0].place).toBe(1);
  });
});

describe('availableDisciplinesFromScores', () => {
  it('returns disciplines in preferred order', () => {
    const docs = [
      baseScore({ id: '1', discipline: 'three_position_50m' }),
      baseScore({ id: '2', discipline: 'prone_50m' }),
    ];
    expect(availableDisciplinesFromScores(docs)).toEqual(['prone_50m', 'three_position_50m']);
  });

  it('picks default from available list', () => {
    expect(defaultDisciplineFromAvailable(['three_position_50m'])).toBe('three_position_50m');
    expect(defaultDisciplineFromAvailable([])).toBe('prone_50m');
  });
});
