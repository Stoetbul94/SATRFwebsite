import { isToolboxEnabled, isToolInteractive } from '@/lib/toolbox/enabled';
import { getToolById } from '@/lib/toolbox/registry';

jest.mock('@/lib/toolbox/rateLimit', () => ({
  checkToolboxRateLimit: jest.fn(),
  getClientIp: jest.fn(() => '127.0.0.1'),
}));

describe('toolbox enabled flag', () => {
  const originalKey = process.env.ANTHROPIC_API_KEY;

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.ANTHROPIC_API_KEY;
    } else {
      process.env.ANTHROPIC_API_KEY = originalKey;
    }
    jest.resetModules();
  });

  it('returns false when ANTHROPIC_API_KEY is unset', () => {
    delete process.env.ANTHROPIC_API_KEY;
    jest.resetModules();
    const { isToolboxEnabled: enabled } = require('@/lib/toolbox/enabled');
    expect(enabled()).toBe(false);
  });

  it('returns false when ANTHROPIC_API_KEY is blank', () => {
    process.env.ANTHROPIC_API_KEY = '   ';
    jest.resetModules();
    const { isToolboxEnabled: enabled } = require('@/lib/toolbox/enabled');
    expect(enabled()).toBe(false);
  });

  it('returns true when ANTHROPIC_API_KEY is set', () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test-key';
    jest.resetModules();
    const { isToolboxEnabled: enabled, isToolInteractive: interactive } = require('@/lib/toolbox/enabled');
    expect(enabled()).toBe(true);
    const rangeOfficer = getToolById('range-officer')!;
    expect(interactive(true, rangeOfficer)).toBe(true);
    expect(interactive(false, rangeOfficer)).toBe(false);
  });

  it('treats coming-soon tools as non-interactive even when enabled', () => {
    const matchAnalyst = getToolById('match-analyst')!;
    expect(isToolInteractive(true, matchAnalyst)).toBe(false);
  });
});

describe('toolbox chat API when disabled', () => {
  const originalKey = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    jest.resetModules();
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.ANTHROPIC_API_KEY;
    } else {
      process.env.ANTHROPIC_API_KEY = originalKey;
    }
    jest.resetModules();
  });

  it('returns 503 when the API key is not configured', async () => {
    const handler = (await import('@/pages/api/toolbox/chat')).default;
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));

    await handler(
      {
        method: 'POST',
        headers: {},
        body: {
          toolId: 'range-officer',
          messages: [{ role: 'user', content: 'Can I take Panado?' }],
        },
      } as never,
      { status } as never
    );

    expect(status).toHaveBeenCalledWith(503);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('not configured'),
        retryable: true,
      })
    );
  });
});
