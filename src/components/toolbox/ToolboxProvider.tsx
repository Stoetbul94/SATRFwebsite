'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/router';
import { TOOLBOX_TOOLS, getToolById } from '@/lib/toolbox/registry';
import { resolveDefaultToolId } from '@/lib/toolbox/resolveContextTool';
import type { ChatMessage } from '@/lib/toolbox/types';

type PanelView = 'picker' | 'tool';

interface ToolboxContextValue {
  isOpen: boolean;
  activeToolId: string | undefined;
  panelView: PanelView;
  open: (toolId?: string) => void;
  close: () => void;
  selectTool: (toolId: string) => void;
  backToPicker: () => void;
  getMessages: (toolId: string) => ChatMessage[];
  setMessages: (toolId: string, messages: ChatMessage[]) => void;
  registerLauncherRef: (node: HTMLButtonElement | null) => void;
  launcherRef: React.RefObject<HTMLButtonElement | null>;
}

const ToolboxContext = createContext<ToolboxContextValue | null>(null);

export function ToolboxProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [activeToolId, setActiveToolId] = useState<string | undefined>();
  const [panelView, setPanelView] = useState<PanelView>('picker');
  const [histories, setHistories] = useState<Record<string, ChatMessage[]>>({});
  const launcherRef = useRef<HTMLButtonElement | null>(null);

  const registerLauncherRef = useCallback((node: HTMLButtonElement | null) => {
    launcherRef.current = node;
  }, []);

  const selectTool = useCallback((toolId: string) => {
    if (!getToolById(toolId)) return;
    setActiveToolId(toolId);
    setPanelView('tool');
  }, []);

  const open = useCallback(
    (toolId?: string) => {
      if (toolId) {
        selectTool(toolId);
        setIsOpen(true);
        return;
      }

      const contextual = resolveDefaultToolId(router.pathname);
      if (contextual) {
        selectTool(contextual);
      } else {
        setActiveToolId(undefined);
        setPanelView('picker');
      }
      setIsOpen(true);
    },
    [router.pathname, selectTool]
  );

  const close = useCallback(() => {
    setIsOpen(false);
    requestAnimationFrame(() => {
      launcherRef.current?.focus();
    });
  }, []);

  const backToPicker = useCallback(() => {
    setPanelView('picker');
    setActiveToolId(undefined);
  }, []);

  const getMessages = useCallback(
    (toolId: string) => histories[toolId] ?? [],
    [histories]
  );

  const setMessages = useCallback((toolId: string, messages: ChatMessage[]) => {
    setHistories((prev) => ({ ...prev, [toolId]: messages }));
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        close();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [close, isOpen]);

  const value = useMemo(
    () => ({
      isOpen,
      activeToolId,
      panelView,
      open,
      close,
      selectTool,
      backToPicker,
      getMessages,
      setMessages,
      registerLauncherRef,
      launcherRef,
    }),
    [
      isOpen,
      activeToolId,
      panelView,
      open,
      close,
      selectTool,
      backToPicker,
      getMessages,
      setMessages,
      registerLauncherRef,
    ]
  );

  return <ToolboxContext.Provider value={value}>{children}</ToolboxContext.Provider>;
}

export function useToolbox() {
  const ctx = useContext(ToolboxContext);
  if (!ctx) {
    throw new Error('useToolbox must be used within ToolboxProvider');
  }
  return ctx;
}

export function useToolboxTools() {
  return TOOLBOX_TOOLS;
}
