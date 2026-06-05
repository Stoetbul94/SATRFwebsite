import {
  parseEventDisciplines,
  formatEntryFee,
  disciplinesToLegacyType,
} from '@/lib/eventDisciplines';

describe('eventDisciplines', () => {
  it('parses discipline ID array', () => {
    expect(parseEventDisciplines({ disciplines: ['prone_50m', 'three_position_50m'] })).toEqual([
      'prone_50m',
      'three_position_50m',
    ]);
  });

  it('maps legacy free-text type strings', () => {
    expect(parseEventDisciplines({ type: 'Prone, F-Class' })).toEqual(['prone_50m', 'fclass_open']);
    expect(parseEventDisciplines({ type: '3P' })).toEqual(['three_position_50m']);
  });

  it('deduplicates when parsing legacy text', () => {
    const ids = parseEventDisciplines({ type: 'Prone, Prone Match' });
    expect(ids.filter((id) => id === 'prone_50m')).toHaveLength(1);
  });

  it('formats entry fee — never misleading R0', () => {
    expect(formatEntryFee(300)).toBe('Entry Fee: R300');
    expect(formatEntryFee(0)).toBe('Fee: TBC');
    expect(formatEntryFee(null)).toBe('Fee: TBC');
  });

  it('builds legacy type label from IDs', () => {
    expect(disciplinesToLegacyType(['prone_50m', 'fclass_open'])).toBe('Prone, F-Class Open');
  });
});
