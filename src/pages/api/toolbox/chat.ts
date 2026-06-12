import type { NextApiRequest, NextApiResponse } from 'next';
import { getToolById } from '@/lib/toolbox/registry';
import { getSystemPrompt } from '@/lib/toolbox/prompts';
import { checkToolboxRateLimit, getClientIp } from '@/lib/toolbox/rateLimit';
import { normalizeMessages, trimMessageHistory, validateUserMessage } from '@/lib/toolbox/chatValidation';
import { isToolboxEnabled } from '@/lib/toolbox/enabled';
import type { ChatMessage } from '@/lib/toolbox/types';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '64kb',
    },
  },
};

const MODEL = 'claude-sonnet-4-20250514';

function wantsStream(req: NextApiRequest): boolean {
  const accept = req.headers.accept ?? '';
  return typeof accept === 'string' && accept.includes('text/event-stream');
}

function sendSse(res: NextApiResponse, payload: Record<string, unknown>) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', retryable: false });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!isToolboxEnabled() || !apiKey) {
    return res.status(503).json({
      error: 'AI assistant is not configured. Please try again later.',
      retryable: true,
    });
  }

  const { toolId, messages: rawMessages, stream: streamRequested } = req.body ?? {};
  if (typeof toolId !== 'string' || !toolId.trim()) {
    return res.status(400).json({ error: 'toolId is required', retryable: false });
  }

  const tool = getToolById(toolId);
  if (!tool || tool.status !== 'available' || !tool.promptKey) {
    return res.status(400).json({ error: 'Unknown or unavailable tool', retryable: false });
  }

  const messages = normalizeMessages(rawMessages);
  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: 'messages are required', retryable: false });
  }

  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  if (!lastUser) {
    return res.status(400).json({ error: 'At least one user message is required', retryable: false });
  }

  const validationError = validateUserMessage(lastUser.content);
  if (validationError) {
    return res.status(400).json({ error: validationError, retryable: false });
  }

  const clientIp = getClientIp(req);
  const rate = await checkToolboxRateLimit(clientIp);
  if (!rate.allowed) {
    console.warn('[toolbox] rate limit', { clientIp, toolId });
    return res.status(429).json({
      error: 'Too many requests. Please wait a moment and try again.',
      retryable: true,
      retryAfterMs: rate.retryAfterMs,
    });
  }

  const history = trimMessageHistory(messages);
  const systemPrompt = getSystemPrompt(tool.promptKey);
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const anthropic = new Anthropic({ apiKey });
  const stream = streamRequested === true || wantsStream(req);

  try {
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');

      const messageStream = anthropic.messages.stream({
        model: MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }],
        messages: history.map((m: ChatMessage) => ({
          role: m.role,
          content: m.content,
        })),
      });

      messageStream.on('text', (text) => {
        sendSse(res, { text });
      });

      await messageStream.finalMessage();
      sendSse(res, { done: true });
      res.end();
      return;
    }

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }],
      messages: history.map((m: ChatMessage) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const content = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim();

    return res.status(200).json({ content });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.warn('[toolbox] chat error', { clientIp, toolId, message: message.slice(0, 200) });

    if (stream && !res.headersSent) {
      res.setHeader('Content-Type', 'text/event-stream');
    }
    if (res.headersSent) {
      sendSse(res, { error: 'Assistant request failed. Please try again.', retryable: true });
      res.end();
      return;
    }

    return res.status(500).json({
      error: 'Assistant request failed. Please try again.',
      retryable: true,
    });
  }
}
