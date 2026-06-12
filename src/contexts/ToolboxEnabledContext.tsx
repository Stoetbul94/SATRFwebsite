'use client';

import { createContext, useContext, type ReactNode } from 'react';

const ToolboxEnabledContext = createContext(false);

export function ToolboxEnabledProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  return (
    <ToolboxEnabledContext.Provider value={enabled}>{children}</ToolboxEnabledContext.Provider>
  );
}

export function useToolboxEnabled(): boolean {
  return useContext(ToolboxEnabledContext);
}
