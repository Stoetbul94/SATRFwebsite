import { TOOLBOX_TOOLS, getToolById, isValidToolId, getAvailableTools } from '@/lib/toolbox/registry';
import { resolveContextTool, resolveDefaultToolId } from '@/lib/toolbox/resolveContextTool';
import { getSystemPrompt } from '@/lib/toolbox/prompts';

describe('toolbox registry', () => {
  it('exports Range Officer tool', () => {
    const tool = getToolById('range-officer');
    expect(tool).toBeDefined();
    expect(tool?.name).toBe('Range Officer');
    expect(tool?.status).toBe('available');
    expect(tool?.promptKey).toBe('range-officer');
  });

  it('rejects unknown tool ids', () => {
    expect(isValidToolId('unknown-tool')).toBe(false);
    expect(getToolById('unknown-tool')).toBeUndefined();
  });

  it('includes match analyst placeholder for extensibility', () => {
    expect(TOOLBOX_TOOLS.some((t) => t.id === 'match-analyst')).toBe(true);
    expect(getToolById('match-analyst')?.status).toBe('coming_soon');
  });

  it('resolves Range Officer on /rules', () => {
    expect(resolveContextTool('/rules')?.id).toBe('range-officer');
    expect(resolveDefaultToolId('/rules')).toBe('range-officer');
  });

  it('defaults to the only available tool elsewhere', () => {
    expect(resolveDefaultToolId('/')).toBe('range-officer');
    expect(getAvailableTools()).toHaveLength(1);
  });

  it('exposes the Range Officer system prompt server-side', () => {
    const prompt = getSystemPrompt('range-officer');
    expect(prompt).toContain('Range Officer');
    expect(prompt).toContain('Global DRO');
    expect(prompt).toContain('beta blockers');
  });
});
