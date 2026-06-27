'use client';

import { useCallback, useEffect, useState } from 'react';

const IDLE_FALLBACK_MS = 2500;

function shouldSkipHeavyLoad(): boolean {
  if (typeof navigator === 'undefined') return false;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
    .connection;
  if (conn?.saveData) return true;
  if (conn?.effectiveType === '2g' || conn?.effectiveType === 'slow-2g') return true;
  return false;
}

/**
 * Returns true when deferred work (e.g. Three.js hero) may start:
 * after idle, user interaction, or never on save-data / 2g connections.
 */
export function useIdleReady(enabled = true): { ready: boolean; activate: () => void } {
  const [ready, setReady] = useState(false);

  const activate = useCallback(() => {
    if (!enabled) return;
    setReady(true);
  }, [enabled]);

  useEffect(() => {
    if (!enabled || ready) return;
    if (shouldSkipHeavyLoad()) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let idleId: number | undefined;

    const onReady = () => {
      if (!cancelled) setReady(true);
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(onReady, { timeout: IDLE_FALLBACK_MS });
    } else {
      timeoutId = setTimeout(onReady, IDLE_FALLBACK_MS);
    }

    return () => {
      cancelled = true;
      if (idleId !== undefined && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, [enabled, ready]);

  return { ready, activate };
}
