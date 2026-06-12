export type ToolboxToolId = 'range-officer' | 'match-analyst' | string;

export type ToolboxPromptKey = 'range-officer';

export type ToolboxToolStatus = 'available' | 'coming_soon';

export type ToolboxComponentKey = 'RangeOfficerTool' | 'ComingSoonTool';

export interface ToolboxFooterLink {
  label: string;
  href: string;
}

export interface ToolboxToolDefinition {
  id: ToolboxToolId;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  promptKey?: ToolboxPromptKey;
  suggestedQuestions: string[];
  pinnedDisclaimer: string;
  footerLinks: ToolboxFooterLink[];
  contextRoutes: string[];
  requiresAuth: boolean;
  status: ToolboxToolStatus;
  componentKey: ToolboxComponentKey;
}

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ToolboxChatRequest {
  toolId: string;
  messages: ChatMessage[];
}

export interface ToolboxChatErrorResponse {
  error: string;
  retryable: boolean;
}
