import { getAvailableTools } from './registry';
import type { ToolboxToolDefinition } from './types';

export function resolveContextTool(pathname: string): ToolboxToolDefinition | undefined {
  const available = getAvailableTools();
  return available.find((tool) => tool.contextRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`)));
}

export function resolveDefaultToolId(pathname: string): string | undefined {
  const contextual = resolveContextTool(pathname);
  if (contextual) return contextual.id;

  const available = getAvailableTools();
  if (available.length === 1) return available[0].id;
  return undefined;
}
