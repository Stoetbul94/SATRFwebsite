/**
 * Opaque pagination cursor for published notifications (publishedAt + id).
 * Never accept raw Firestore paths from the client.
 */

export type NotificationCursor = {
  publishedAt: string;
  id: string;
};

const SAFE_ID = /^[a-zA-Z0-9_-]{1,128}$/;

export function encodeNotificationCursor(cursor: NotificationCursor): string {
  const payload = `${cursor.publishedAt}\n${cursor.id}`;
  return Buffer.from(payload, 'utf8').toString('base64url');
}

export function decodeNotificationCursor(raw: unknown): NotificationCursor | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  try {
    const decoded = Buffer.from(raw, 'base64url').toString('utf8');
    const [publishedAt, id] = decoded.split('\n');
    if (!publishedAt || !id || !SAFE_ID.test(id)) return null;
    if (Number.isNaN(Date.parse(publishedAt))) return null;
    return { publishedAt, id };
  } catch {
    return null;
  }
}
