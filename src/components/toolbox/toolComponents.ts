'use client';

import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { ToolboxComponentKey } from '@/lib/toolbox/types';

export const TOOL_COMPONENTS: Record<
  ToolboxComponentKey,
  LazyExoticComponent<ComponentType<{ toolId: string }>>
> = {
  RangeOfficerTool: lazy(() => import('./tools/RangeOfficerTool')),
  ComingSoonTool: lazy(() => import('./tools/ComingSoonTool')),
};
