import type { ToolboxToolDefinition } from './types';

/** Single source of truth: toolbox chat is live only when the server key is configured. */
export function isToolboxEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

export function isToolInteractive(
  toolboxEnabled: boolean,
  tool: Pick<ToolboxToolDefinition, 'status' | 'promptKey'>
): boolean {
  return toolboxEnabled && tool.status === 'available' && Boolean(tool.promptKey);
}
