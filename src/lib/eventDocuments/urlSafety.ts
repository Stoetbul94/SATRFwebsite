/**
 * Preview / PDF URL helpers.
 * Event registration links must never become javascript: or other unsafe schemes.
 */

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

export function sanitizeHttpUrl(url: string | undefined | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

/** Prefer trusted site + event id; fall back to sanitized absolute URL only. */
export function resolveTrustedEventUrl(input: {
  eventId: string;
  siteUrl: string;
  candidateUrl?: string | null;
}): string {
  const site = input.siteUrl.replace(/\/$/, '');
  const trusted = `${site}/events/${encodeURIComponent(input.eventId)}`;
  if (!input.candidateUrl) return trusted;
  const sanitized = sanitizeHttpUrl(input.candidateUrl);
  if (!sanitized) return trusted;
  try {
    const siteHost = new URL(site).host;
    const candidateHost = new URL(sanitized).host;
    if (candidateHost === siteHost) return sanitized;
  } catch {
    return trusted;
  }
  return trusted;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
