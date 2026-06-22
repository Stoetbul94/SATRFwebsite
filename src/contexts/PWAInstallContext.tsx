'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  BANNER_DISMISS_KEY,
  POST_LOGIN_DISMISS_KEY,
  type BeforeInstallPromptEvent,
  consumePostLoginSessionFlag,
  isBannerDismissedRecently,
  isIOSDevice,
  isPostLoginNudgeDismissed,
  isStandaloneMode,
} from '@/lib/pwa/installUtils';

interface PWAInstallContextValue {
  isInstalled: boolean;
  canNativeInstall: boolean;
  isIOS: boolean;
  showInstallEntry: boolean;
  bannerOpen: boolean;
  postLoginNudge: boolean;
  instructionsOpen: boolean;
  promptInstall: () => Promise<boolean>;
  dismissBanner: (opts?: { permanentPostLogin?: boolean }) => void;
  openInstructions: () => void;
  closeInstructions: () => void;
  openBanner: () => void;
}

const PWAInstallContext = createContext<PWAInstallContextValue | undefined>(undefined);

export function PWAInstallProvider({ children }: { children: ReactNode }) {
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [postLoginNudge, setPostLoginNudge] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsInstalled(isStandaloneMode());
    setIsIOS(isIOSDevice());

    if (consumePostLoginSessionFlag() && !isPostLoginNudgeDismissed() && !isStandaloneMode()) {
      setPostLoginNudge(true);
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setBannerOpen(false);
      setPostLoginNudge(false);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const canNativeInstall = deferredPrompt !== null;
  const showInstallEntry = !isInstalled;

  const openBanner = useCallback(() => {
    if (isStandaloneMode()) return;
    setBannerOpen(true);
  }, []);

  const dismissBanner = useCallback((opts?: { permanentPostLogin?: boolean }) => {
    try {
      if (opts?.permanentPostLogin || postLoginNudge) {
        localStorage.setItem(POST_LOGIN_DISMISS_KEY, '1');
      } else {
        localStorage.setItem(BANNER_DISMISS_KEY, String(Date.now()));
      }
    } catch {
      /* ignore */
    }
    setBannerOpen(false);
    setPostLoginNudge(false);
  }, [postLoginNudge]);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setBannerOpen(false);
      setPostLoginNudge(false);
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      return outcome === 'accepted';
    } catch {
      return false;
    }
  }, [deferredPrompt]);

  const openInstructions = useCallback(() => setInstructionsOpen(true), []);
  const closeInstructions = useCallback(() => setInstructionsOpen(false), []);

  const value = useMemo<PWAInstallContextValue>(
    () => ({
      isInstalled,
      canNativeInstall,
      isIOS,
      showInstallEntry,
      bannerOpen,
      postLoginNudge,
      instructionsOpen,
      promptInstall,
      dismissBanner,
      openInstructions,
      closeInstructions,
      openBanner,
    }),
    [
      isInstalled,
      canNativeInstall,
      isIOS,
      showInstallEntry,
      bannerOpen,
      postLoginNudge,
      instructionsOpen,
      promptInstall,
      dismissBanner,
      openInstructions,
      closeInstructions,
      openBanner,
    ],
  );

  return <PWAInstallContext.Provider value={value}>{children}</PWAInstallContext.Provider>;
}

export function usePWAInstall(): PWAInstallContextValue {
  const context = useContext(PWAInstallContext);
  if (!context) {
    throw new Error('usePWAInstall must be used within a PWAInstallProvider');
  }
  return context;
}
