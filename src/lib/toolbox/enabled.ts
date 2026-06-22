import type { ToolboxToolDefinition } from './types';

/** Toolbox chat is live when NEXT_PUBLIC_SATRF_TOOLBOX_ENABLED is set, or ANTHROPIC_API_KEY on server. */
export function isToolboxEnabled(): boolean {
  const flag = process.env.NEXT_PUBLIC_SATRF_TOOLBOX_ENABLED?.trim().toLowerCase();
  if (flag === 'true' || flag === '1') return true;
  if (flag === 'false' || flag === '0') return false;
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

export function isToolInteractive(
  toolboxEnabled: boolean,
  tool: Pick<ToolboxToolDefinition, 'status' | 'promptKey'>
): boolean {
  return toolboxEnabled && tool.status === 'available' && Boolean(tool.promptKey);
}
