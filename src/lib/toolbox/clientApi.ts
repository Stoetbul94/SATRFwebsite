'use client';

import type { ChatMessage } from '@/lib/toolbox/types';

export async function streamToolboxChat(
  toolId: string,
  messages: ChatMessage[],
  onChunk: (text: string) => void
): Promise<void> {
  const response = await fetch('/api/toolbox/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({ toolId, messages, stream: true }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error ?? 'Assistant request failed');
  }

  if (!response.body) {
    throw new Error('Assistant request failed');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        const parsed = JSON.parse(payload) as { text?: string; error?: string; done?: boolean };
        if (parsed.error) throw new Error(parsed.error);
        if (parsed.text) onChunk(parsed.text);
      } catch (err) {
        if (err instanceof SyntaxError) continue;
        throw err;
      }
    }
  }
}

export async function sendToolboxChat(toolId: string, messages: ChatMessage[]): Promise<string> {
  const response = await fetch('/api/toolbox/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ toolId, messages }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error ?? 'Assistant request failed');
  }
  return String(data.content ?? '');
}
