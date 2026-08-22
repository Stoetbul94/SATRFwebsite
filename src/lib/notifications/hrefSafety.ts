/**
 * Notification link safety — prefer internal SATRF routes.
 */

const INTERNAL_PATH = /^\/[a-zA-Z0-9/_\-?#=&%.]*$/;

export function sanitizeNotificationHref(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('/')) {
    if (trimmed.startsWith('//')) return null;
    if (!INTERNAL_PATH.test(trimmed)) return null;
    if (/javascript:|data:|file:/i.test(trimmed)) return null;
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    const host = parsed.hostname.toLowerCase();
    const allowed = ['www.rifleshooting.co.za', 'rifleshooting.co.za', 'localhost'];
    if (!allowed.includes(host) && !host.endsWith('.vercel.app')) {
      // Only allow known SATRF production hosts or preview hosts for admin HTTPS links.
      return null;
    }
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return null;
  }
}

export function buildEventHubHref(eventId: string, hash?: string): string {
  const safeId = encodeURIComponent(eventId);
  const base = `/events/${safeId}`;
  if (!hash) return base;
  const clean = hash.replace(/^#/, '');
  return `${base}#${clean}`;
}

export function buildCallForEntriesNotificationHref(eventId: string): string {
  return buildEventHubHref(eventId, 'documents');
}
