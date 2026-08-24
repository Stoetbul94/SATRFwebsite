import {
  buildQualScoreDistribution,
  enrichQualSeriesWithRollingAverage,
  recentQualAverage,
  scoreToChartPoint,
  trailingAverage,
} from '@/lib/athleteAnalytics';
import type { Score } from '@/types/scores';

function qualScore(overrides: Partial<Score> = {}): Score {
  return {
    id: 's1',
    userId: 'u1',
    shooterName: 'Test',
    club: 'Club',
    category: 'open',
    eventId: 'e1',
    eventName: 'Event 1',
    date: '2026-01-10',
    discipline: 'prone_50m',
    scoringType: 'decimal',
    stage: 'qualification',
    positions: [],
    decimalTotal: 610,
    integerTotal: 610,
    innerTens: 10,
    totalShots: 60,
    status: 'official',
    source: 'manual',
    createdBy: 'admin',
    createdAt: '2026-01-10',
    updatedAt: '2026-01-10',
    ...overrides,
  };
}

describe('performance analytics helpers', () => {
  it('computes trailing 3-event rolling average', () => {
    expect(trailingAverage([610, 614, 616], 2, 3)).toBe(613.3);
    expect(trailingAverage([610, 614], 1, 3)).toBeNull();
  });

  it('enriches qual series with rolling average from event 3 onward', () => {
    const points = [
      qualScore({ id: 'a', date: '2026-01-01', decimalTotal: 610 }),
      qualScore({ id: 'b', date: '2026-02-01', decimalTotal: 614 }),
      qualScore({ id: 'c', date: '2026-03-01', decimalTotal: 616 }),
    ].map(scoreToChartPoint);

    const enriched = enrichQualSeriesWithRollingAverage(points);
    expect(enriched[0].rollingAvg).toBeNull();
    expect(enriched[1].rollingAvg).toBeNull();
    expect(enriched[2].rollingAvg).toBe(613.3);
  });

  it('recent qual average uses last 3 chronologically', () => {
    const points = [608, 610, 614, 616].map((v, i) =>
      scoreToChartPoint(
        qualScore({ id: `s${i}`, date: `2026-0${i + 1}-01`, decimalTotal: v }),
      ),
    );
    expect(recentQualAverage(points, 3)).toBe(613.3);
  });

  it('builds distribution only with 5+ qual results', () => {
    const few = [610, 612, 614].map((v, i) =>
      scoreToChartPoint(qualScore({ id: `s${i}`, decimalTotal: v })),
    );
    expect(buildQualScoreDistribution(few)).toEqual([]);

    const many = [600, 605, 610, 615, 620].map((v, i) =>
      scoreToChartPoint(qualScore({ id: `s${i}`, decimalTotal: v })),
    );
    expect(buildQualScoreDistribution(many).length).toBeGreaterThan(0);
  });

  it('keeps discipline isolation in rolling average input', () => {
    const prone = scoreToChartPoint(qualScore({ decimalTotal: 620 }));
    const threeP = scoreToChartPoint(
      qualScore({ discipline: 'three_position_50m', decimalTotal: 550, integerTotal: 520 }),
    );
    const proneOnly = enrichQualSeriesWithRollingAverage([prone]);
    expect(proneOnly[0].value).toBe(620);
    expect(threeP.primaryValue).not.toBe(proneOnly[0].primaryValue);
  });
});
