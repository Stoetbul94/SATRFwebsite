export const BANNER_DISMISS_KEY = 'satrf-pwa-install-dismissed';
export const POST_LOGIN_DISMISS_KEY = 'satrf-pwa-post-login-dismissed';
export const POST_LOGIN_SESSION_KEY = 'satrf-pwa-post-login-nudge';
export const BANNER_DISMISS_DAYS = 7;

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
}

export function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export function isBannerDismissedRecently(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = localStorage.getItem(BANNER_DISMISS_KEY);
    if (!raw) return false;
    const dismissedAt = parseInt(raw, 10);
    if (!Number.isFinite(dismissedAt)) return false;
    return Date.now() - dismissedAt < BANNER_DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function isPostLoginNudgeDismissed(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem(POST_LOGIN_DISMISS_KEY) === '1';
  } catch {
    return true;
  }
}

export function consumePostLoginSessionFlag(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const pending = sessionStorage.getItem(POST_LOGIN_SESSION_KEY) === '1';
    if (pending) {
      sessionStorage.removeItem(POST_LOGIN_SESSION_KEY);
    }
    return pending;
  } catch {
    return false;
  }
}

export function markPostLoginSessionFlag(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(POST_LOGIN_SESSION_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function isHiddenInstallPath(pathname: string): boolean {
  return (
    pathname.startsWith('/admin') ||
    pathname === '/login' ||
    pathname === '/register'
  );
}
