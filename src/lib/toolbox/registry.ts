import type { ToolboxToolDefinition, ToolboxToolId } from './types';

export const TOOLBOX_TOOLS: ToolboxToolDefinition[] = [
  {
    id: 'range-officer',
    name: 'Range Officer',
    tagline: 'ISSF rules & anti-doping answers',
    description:
      'Ask about ISSF rifle rules, WADA prohibited substances, SAIDS requirements, medication checks, and Therapeutic Use Exemptions. Built for South African target shooters, coaches, and officials.',
    icon: 'FiShield',
    promptKey: 'range-officer',
    suggestedQuestions: [
      'Can I take Panado at a competition?',
      'What flu medicine is allowed when travelling to a match?',
      'Are beta blockers banned in shooting?',
      'How do I apply for a TUE?',
      'Max trigger weight for 50m prone?',
    ],
    pinnedDisclaimer:
      'Guidance only — verify medications on Global DRO and with SAIDS. Athletes are strictly liable for substances in their body.',
    footerLinks: [
      { label: 'Global DRO', href: 'https://www.globaldro.com' },
      { label: 'SAIDS', href: 'https://www.drugfreesport.org.za' },
      { label: 'ISSF Rules', href: 'https://www.issf-sports.org/rules' },
    ],
    contextRoutes: ['/rules'],
    requiresAuth: false,
    status: 'available',
    componentKey: 'RangeOfficerTool',
  },
  {
    id: 'match-analyst',
    name: 'Match Analyst',
    tagline: 'Score trends and performance insights',
    description:
      'Analyse match results, compare series performance, and spot trends across events. Coming soon to the SATRF Toolbox.',
    icon: 'FiTrendingUp',
    suggestedQuestions: [],
    pinnedDisclaimer: 'This tool is not yet available.',
    footerLinks: [],
    contextRoutes: [],
    requiresAuth: false,
    status: 'coming_soon',
    componentKey: 'ComingSoonTool',
  },
];

export function getToolById(toolId: string): ToolboxToolDefinition | undefined {
  return TOOLBOX_TOOLS.find((t) => t.id === toolId);
}

export function isValidToolId(toolId: string): toolId is ToolboxToolId {
  return TOOLBOX_TOOLS.some((t) => t.id === toolId);
}

export function getAvailableTools(): ToolboxToolDefinition[] {
  return TOOLBOX_TOOLS.filter((t) => t.status === 'available');
}

export function getChatEnabledTools(): ToolboxToolDefinition[] {
  return TOOLBOX_TOOLS.filter((t) => t.status === 'available' && t.promptKey);
}
