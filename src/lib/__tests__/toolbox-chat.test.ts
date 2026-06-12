import {
  MAX_HISTORY_MESSAGES,
  MAX_USER_MESSAGE_LENGTH,
  normalizeMessages,
  trimMessageHistory,
  validateUserMessage,
} from '@/lib/toolbox/chatValidation';

describe('toolbox chat validation', () => {
  it('validates empty and oversized user messages', () => {
    expect(validateUserMessage('')).toBe('Message cannot be empty');
    expect(validateUserMessage('   ')).toBe('Message cannot be empty');
    expect(validateUserMessage('a'.repeat(MAX_USER_MESSAGE_LENGTH + 1))).toContain('2000');
    expect(validateUserMessage('Can I take Panado?')).toBeNull();
  });

  it('normalizes valid message arrays', () => {
    const messages = normalizeMessages([
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi' },
    ]);
    expect(messages).toHaveLength(2);
    expect(normalizeMessages([{ role: 'bad', content: 'x' }])).toBeNull();
    expect(normalizeMessages(null)).toBeNull();
  });

  it('truncates oldest messages beyond the history cap', () => {
    const messages = Array.from({ length: MAX_HISTORY_MESSAGES + 5 }, (_, i) => ({
      role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
      content: `message-${i}`,
    }));
    const trimmed = trimMessageHistory(messages);
    expect(trimmed).toHaveLength(MAX_HISTORY_MESSAGES);
    expect(trimmed[0].content).toBe('message-5');
    expect(trimmed[trimmed.length - 1].content).toBe(`message-${MAX_HISTORY_MESSAGES + 4}`);
  });
});
