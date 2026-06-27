import {
  buildScoreInputFromForm,
  makePositionEntryMode,
  makePositionSeries,
  GUEST_MEMBER,
  CUSTOM_EVENT,
  validateScoreForm,
} from '@/lib/scoreFormState';
import { buildScore, validateScoreInput } from '@/lib/issf';
import {
  computeFinalRankMap,
  finalGroupsToRecomputeAfterUpdate,
} from '@/lib/recomputeFinalRanks';
import type { Discipline } from '@/types/scores';

function baseForm(overrides: Partial<Parameters<typeof buildScoreInputFromForm>[0]> = {}) {
  const discipline: Discipline = overrides.discipline ?? 'prone_50m';
  const seriesByPosition = overrides.seriesByPosition ?? makePositionSeries(discipline);
  if (!overrides.seriesByPosition) {
    seriesByPosition.prone[0] = { decimal: '100.5', integer: '95' };
  }

  return {
    discipline,
    stage: 'qualification' as const,
    selectedMemberId: GUEST_MEMBER,
    shooterName: 'Test Shooter',
    club: 'Test Club',
    category: 'open' as const,
    veteran: false,
    selectedEventId: CUSTOM_EVENT,
    eventName: 'Spring Match',
    date: '2026-06-27',
    seriesByPosition,
    positionEntryMode: overrides.positionEntryMode ?? makePositionEntryMode(discipline),
    finalRank: '',
    elimShots: ['', '', '', '', ''],
    status: 'official' as const,
    ...overrides,
  };
}

describe('buildScoreInputFromForm stage', () => {
  it('sets prone_final stage on output', () => {
    const input = buildScoreInputFromForm(baseForm({ stage: 'prone_final', finalRank: '2' }));
    expect(input.stage).toBe('prone_final');
    expect(input.finalRank).toBe(2);
    expect(input.finalShots).toBeUndefined();
    expect(input.eliminatedAtShot).toBeUndefined();
  });

  it('omits finals-only fields for qualification', () => {
    const input = buildScoreInputFromForm(baseForm({ stage: 'qualification', finalRank: '1' }));
    expect(input.stage).toBe('qualification');
    expect(input.finalRank).toBeUndefined();
    expect(input.finalShots).toBeUndefined();
    expect(input.eliminatedAtShot).toBeUndefined();
  });

  it('includes 3p_final shots when stage is 3p_final', () => {
    const input = buildScoreInputFromForm(
      baseForm({
        discipline: 'three_position_50m',
        stage: '3p_final',
        elimShots: ['10.5', '', '', '', ''],
      }),
    );
    expect(input.stage).toBe('3p_final');
    expect(input.finalShots).toEqual([10.5]);
  });
});

describe('F-Class ring-only qualification', () => {
  function fclassForm(rings: number[]) {
    const discipline = 'fclass_tr' as const;
    const seriesByPosition = makePositionSeries(discipline);
    rings.forEach((ring, i) => {
      seriesByPosition.fclass[i] = { decimal: '', integer: String(ring) };
    });
    return baseForm({ discipline, seriesByPosition });
  }

  it('accepts ring-only series in validateScoreForm', () => {
    expect(validateScoreForm(fclassForm([97, 98, 97, 99, 99, 99]))).toBeNull();
  });

  it('rejects empty F-Class form', () => {
    expect(validateScoreForm(fclassForm([0, 0, 0, 0, 0, 0]))).toBe('Enter at least one series score');
  });

  it('builds score input with integer series values', () => {
    const form = fclassForm([97, 98, 97, 99, 99, 99]);
    const input = buildScoreInputFromForm(form);
    const rings = input.positions![0].series.reduce((sum, s) => sum + s.integer, 0);
    expect(rings).toBe(589);
    expect(input.positions![0].series.every((s) => s.decimal === 0)).toBe(true);

    const built = buildScore(input, { createdBy: 'test' });
    expect(built.integerTotal).toBe(589);
    expect(validateScoreInput(input, { strict: true }).valid).toBe(true);
  });
});

describe('recomputeFinalRanks', () => {
  it('ranks prone finalists by decimal total descending', () => {
    const map = computeFinalRankMap('prone_final', [
      { id: 'a', decimalTotal: 620 },
      { id: 'b', decimalTotal: 625 },
      { id: 'c', decimalTotal: 618 },
    ]);
    expect(map.get('b')).toBe(1);
    expect(map.get('a')).toBe(2);
    expect(map.get('c')).toBe(3);
  });

  it('determines which final groups to recompute after stage change', () => {
    const groups = finalGroupsToRecomputeAfterUpdate(
      {
        eventId: 'evt-1',
        discipline: 'prone_50m',
        stage: 'qualification',
        decimalTotal: 587.4,
      },
      {
        eventId: 'evt-1',
        discipline: 'prone_50m',
        stage: 'prone_final',
        decimalTotal: 587.4,
      },
    );
    expect(groups).toEqual([
      { eventId: 'evt-1', discipline: 'prone_50m', stage: 'prone_final' },
    ]);
  });

  it('recomputes old final group when demoted to qualification', () => {
    const groups = finalGroupsToRecomputeAfterUpdate(
      {
        eventId: 'evt-1',
        discipline: 'prone_50m',
        stage: 'prone_final',
        decimalTotal: 620,
      },
      {
        eventId: 'evt-1',
        discipline: 'prone_50m',
        stage: 'qualification',
        decimalTotal: 620,
      },
    );
    expect(groups).toEqual([
      { eventId: 'evt-1', discipline: 'prone_50m', stage: 'prone_final' },
    ]);
  });

  it('recomputes both groups when a final moves events', () => {
    const groups = finalGroupsToRecomputeAfterUpdate(
      {
        eventId: 'evt-old',
        discipline: 'prone_50m',
        stage: 'prone_final',
        decimalTotal: 620,
      },
      {
        eventId: 'evt-new',
        discipline: 'prone_50m',
        stage: 'prone_final',
        decimalTotal: 620,
      },
    );
    expect(groups).toHaveLength(2);
    expect(groups).toContainEqual({
      eventId: 'evt-new',
      discipline: 'prone_50m',
      stage: 'prone_final',
    });
    expect(groups).toContainEqual({
      eventId: 'evt-old',
      discipline: 'prone_50m',
      stage: 'prone_final',
    });
  });
});
