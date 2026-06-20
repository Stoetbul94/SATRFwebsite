import { scoreMatchesReplaceKey } from '@/lib/scoreReplace';
import type { Score, ScoreInput } from '@/types/scores';

function baseScore(overrides: Partial<Score> = {}): Score {
  return {
    id: 's1',
    userId: 'user-1',
    shooterName: 'Arnold Admin',
    club: 'NG',
    category: 'open',
    eventId: 'evt-1',
    eventName: 'Test Match',
    date: '2026-04-25',
    discipline: 'three_position_50m',
    scoringType: 'decimal',
    stage: 'qualification',
    positions: [],
    decimalTotal: 551.7,
    integerTotal: 524,
    innerTens: 0,
    totalShots: 60,
    status: 'official',
    source: 'manual',
    createdBy: 'admin',
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

function baseInput(overrides: Partial<ScoreInput> = {}): ScoreInput {
  return {
    userId: 'user-1',
    shooterName: 'Arnold Admin',
    club: 'NG',
    category: 'open',
    eventId: 'evt-1',
    eventName: 'Test Match',
    date: '2026-04-25',
    discipline: 'three_position_50m',
    stage: 'qualification',
    positions: [{ position: 'prone', series: [{ decimal: 600, integer: 0 }] }],
    ...overrides,
  };
}

describe('scoreMatchesReplaceKey', () => {
  it('matches same user, event, discipline, and stage', () => {
    expect(scoreMatchesReplaceKey(baseScore(), baseInput())).toBe(true);
  });

  it('matches by name and club when old score is unlinked', () => {
    expect(
      scoreMatchesReplaceKey(baseScore({ userId: null }), baseInput({ userId: 'user-1' }))
    ).toBe(true);
  });

  it('does not match different event', () => {
    expect(scoreMatchesReplaceKey(baseScore(), baseInput({ eventId: 'other' }))).toBe(false);
  });

  it('does not match different discipline', () => {
    expect(
      scoreMatchesReplaceKey(baseScore(), baseInput({ discipline: 'prone_50m' }))
    ).toBe(false);
  });

  it('does not match soft-deleted scores', () => {
    expect(scoreMatchesReplaceKey({ ...baseScore(), deleted: true }, baseInput())).toBe(false);
  });

  it('matches by eventName and date when eventId empty', () => {
    expect(
      scoreMatchesReplaceKey(
        baseScore({ eventId: '' }),
        baseInput({ eventId: '', eventName: 'Test Match', date: '2026-04-25' })
      )
    ).toBe(true);
  });
});
