import type { ChatMessage } from './types';

export const MAX_USER_MESSAGE_LENGTH = 2000;
export const MAX_HISTORY_MESSAGES = 20;

export function validateUserMessage(content: string): string | null {
  const trimmed = content.trim();
  if (!trimmed) return 'Message cannot be empty';
  if (trimmed.length > MAX_USER_MESSAGE_LENGTH) {
    return `Message must be ${MAX_USER_MESSAGE_LENGTH} characters or fewer`;
  }
  return null;
}

export function trimMessageHistory(messages: ChatMessage[], maxMessages = MAX_HISTORY_MESSAGES): ChatMessage[] {
  if (messages.length <= maxMessages) return messages;
  return messages.slice(messages.length - maxMessages);
}

export function normalizeMessages(messages: unknown): ChatMessage[] | null {
  if (!Array.isArray(messages)) return null;
  const normalized: ChatMessage[] = [];
  for (const item of messages) {
    if (
      item &&
      typeof item === 'object' &&
      (item.role === 'user' || item.role === 'assistant') &&
      typeof item.content === 'string'
    ) {
      normalized.push({ role: item.role, content: item.content });
    } else {
      return null;
    }
  }
  return normalized;
}
