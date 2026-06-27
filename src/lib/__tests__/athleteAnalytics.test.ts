import {
  buildAthleteAnalytics,
  eventKey,
  getDisciplineAimMarks,
  isFinalStageForDiscipline,
  isQualificationStage,
  scoreToChartPoint,
} from '@/lib/athleteAnalytics';
import type { Score } from '@/types/scores';

function baseScore(overrides: Partial<Score> = {}): Score {
  return {
    id: 's1',
    userId: 'u1',
    shooterName: 'Test Shooter',
    club: 'Test Club',
    category: 'open',
    eventId: 'evt-1',
    eventName: 'Spring Champs',
    date: '2025-03-15',
    discipline: 'prone_50m',
    scoringType: 'decimal',
    stage: 'qualification',
    positions: [],
    decimalTotal: 620.5,
    integerTotal: 0,
    innerTens: 12,
    totalShots: 60,
    status: 'official',
    source: 'manual',
    createdAt: '2025-03-15',
    createdBy: 'admin',
    ...overrides,
  };
}

describe('athleteAnalytics', () => {
  it('groups qual and final separately per discipline', () => {
    const scores = [
      baseScore({ id: 'q1', stage: 'qualification', decimalTotal: 620 }),
      baseScore({
        id: 'f1',
        stage: 'prone_final',
        eventId: 'evt-1',
        decimalTotal: 105.2,
        date: '2025-03-16',
      }),
    ];

    const result = buildAthleteAnalytics(scores);
    const prone = result.disciplines[0];

    expect(prone.qualSeries).toHaveLength(1);
    expect(prone.finalSeries).toHaveLength(1);
    expect(prone.qualCompetitions).toBe(1);
    expect(prone.finalCompetitions).toBe(1);
  });

  it('counts unique competitions when qual and final share an event', () => {
    const scores = [
      baseScore({ id: 'q1', stage: 'qualification' }),
      baseScore({ id: 'f1', stage: 'prone_final', decimalTotal: 104 }),
    ];

    const result = buildAthleteAnalytics(scores);
    expect(result.totalQualCompetitions).toBe(1);
    expect(result.totalFinalCompetitions).toBe(1);
    expect(result.disciplines[0].qualCompetitions).toBe(1);
    expect(result.disciplines[0].finalCompetitions).toBe(1);
  });

  it('uses rings as primary y-value for 3P qualification', () => {
    const score = baseScore({
      id: '3p1',
      discipline: 'three_position_50m',
      stage: 'qualification',
      decimalTotal: 551.7,
      integerTotal: 524,
      positions: [
        {
          position: 'kneeling',
          series: [],
          decimalTotal: 183,
          integerTotal: 174,
        },
        {
          position: 'prone',
          series: [],
          decimalTotal: 185,
          integerTotal: 176,
        },
        {
          position: 'standing',
          series: [],
          decimalTotal: 183.7,
          integerTotal: 174,
        },
      ],
    });

    const point = scoreToChartPoint(score);
    expect(point.primaryValue).toBe(524);
    expect(point.label).toContain('524');
  });

  it('extracts 3P position series', () => {
    const scores = [
      baseScore({
        id: '3p1',
        discipline: 'three_position_50m',
        date: '2025-01-10',
        positions: [
          { position: 'kneeling', series: [], decimalTotal: 180, integerTotal: 170 },
          { position: 'prone', series: [], decimalTotal: 185, integerTotal: 176 },
          { position: 'standing', series: [], decimalTotal: 182, integerTotal: 172 },
        ],
        integerTotal: 518,
        decimalTotal: 547,
      }),
      baseScore({
        id: '3p2',
        discipline: 'three_position_50m',
        eventId: 'evt-2',
        eventName: 'Winter Match',
        date: '2025-06-20',
        positions: [
          { position: 'kneeling', series: [], decimalTotal: 181, integerTotal: 171 },
          { position: 'prone', series: [], decimalTotal: 186, integerTotal: 177 },
          { position: 'standing', series: [], decimalTotal: 183, integerTotal: 173 },
        ],
        integerTotal: 521,
        decimalTotal: 550,
      }),
    ];

    const result = buildAthleteAnalytics(scores);
    const threeP = result.disciplines.find((d) => d.discipline === 'three_position_50m');

    expect(threeP?.threePPositions?.kneeling).toHaveLength(2);
    expect(threeP?.threePPositions?.prone[0].primaryValue).toBe(176);
    expect(threeP?.threePPositions?.standing[1].primaryValue).toBe(173);
  });

  it('sorts chart points chronologically oldest to newest', () => {
    const scores = [
      baseScore({ id: 's2', date: '2025-06-01', eventId: 'e2', eventName: 'June' }),
      baseScore({ id: 's1', date: '2025-01-01', eventId: 'e1', eventName: 'January' }),
    ];

    const result = buildAthleteAnalytics(scores);
    const dates = result.disciplines[0].qualSeries.map((p) => p.date);
    expect(dates).toEqual(['2025-01-01', '2025-06-01']);
  });

  it('returns empty summary for no scores', () => {
    const result = buildAthleteAnalytics([]);
    expect(result.disciplines).toHaveLength(0);
    expect(result.totalQualCompetitions).toBe(0);
    expect(result.disciplinesActive).toBe(0);
  });

  it('dedupes event key from name and date when eventId missing', () => {
    const score = baseScore({ eventId: '', eventName: 'Cup', date: '2025-04-01' });
    expect(eventKey(score)).toBe('Cup|2025-04-01');
  });

  it('identifies final stages per discipline', () => {
    expect(isQualificationStage('qualification')).toBe(true);
    expect(isFinalStageForDiscipline('prone_final', 'prone_50m')).toBe(true);
    expect(isFinalStageForDiscipline('3p_final', 'three_position_50m')).toBe(true);
    expect(isFinalStageForDiscipline('prone_final', 'three_position_50m')).toBe(false);
  });

  it('computes personal bests and discipline aim marks', () => {
    const scores = [
      baseScore({ id: 'q1', decimalTotal: 610 }),
      baseScore({ id: 'q2', eventId: 'evt-2', date: '2025-06-01', decimalTotal: 620 }),
      baseScore({ id: 'f1', stage: 'prone_final', decimalTotal: 615 }),
    ];

    const prone = buildAthleteAnalytics(scores).disciplines[0];
    expect(prone.bestQual?.value).toBe(620);
    expect(prone.bestFinal?.value).toBe(615);
    expect(prone.aimMarks.qual.value).toBe(620);
    expect(prone.aimMarks.final?.value).toBe(620);
  });

  it('uses ring-based qual aim for 3P and decimal final aim', () => {
    const scores = [
      baseScore({
        id: '3p1',
        discipline: 'three_position_50m',
        integerTotal: 550,
        decimalTotal: 578.6,
        positions: [
          { position: 'kneeling', series: [], decimalTotal: 183, integerTotal: 174 },
          { position: 'prone', series: [], decimalTotal: 185, integerTotal: 176 },
          { position: 'standing', series: [], decimalTotal: 183.7, integerTotal: 174 },
        ],
      }),
      baseScore({
        id: '3pf1',
        discipline: 'three_position_50m',
        stage: '3p_final',
        decimalTotal: 320.7,
      }),
    ];

    const threeP = buildAthleteAnalytics(scores).disciplines[0];
    expect(threeP.bestQual?.value).toBe(550);
    expect(threeP.bestFinal?.value).toBe(320.7);
    expect(getDisciplineAimMarks('three_position_50m').qual.value).toBe(565);
    expect(getDisciplineAimMarks('three_position_50m').final?.value).toBe(318);
    expect(threeP.aimMarks.positionQual?.standing?.value).toBe(175);
  });
});
