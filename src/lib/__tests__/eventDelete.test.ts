import {
  countLinkedActiveScores,
  eventDeleteBlockedMessage,
} from '@/lib/eventDelete';

describe('eventDelete', () => {
  describe('eventDeleteBlockedMessage', () => {
    it('returns null when no linked scores', () => {
      expect(eventDeleteBlockedMessage(0)).toBeNull();
    });

    it('returns singular message for one score', () => {
      expect(eventDeleteBlockedMessage(1)).toBe(
        'Cannot delete: 1 score linked to this event. Remove them from Admin → Scores first.'
      );
    });

    it('returns plural message for multiple scores', () => {
      expect(eventDeleteBlockedMessage(3)).toBe(
        'Cannot delete: 3 scores linked to this event. Remove them from Admin → Scores first.'
      );
    });
  });

  describe('countLinkedActiveScores', () => {
    it('counts only non-deleted score docs', () => {
      const docs = [
        { data: () => ({ deleted: false }) },
        { data: () => ({ deleted: true }) },
        { data: () => ({}) },
      ];
      expect(countLinkedActiveScores(docs)).toBe(2);
    });

    it('returns zero when all scores are soft-deleted', () => {
      const docs = [{ data: () => ({ deleted: true }) }, { data: () => ({ deleted: true }) }];
      expect(countLinkedActiveScores(docs)).toBe(0);
    });
  });
});
