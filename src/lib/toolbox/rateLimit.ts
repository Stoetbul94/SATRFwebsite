import { getAdminDb } from '@/lib/firebaseAdmin';

const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;

type MemoryEntry = { count: number; windowStart: number };

const memoryStore = new Map<string, MemoryEntry>();

function checkMemoryLimit(key: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    memoryStore.set(key, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, retryAfterMs: WINDOW_MS - (now - entry.windowStart) };
  }

  entry.count += 1;
  memoryStore.set(key, entry);
  return { allowed: true };
}

async function checkFirestoreLimit(key: string): Promise<{ allowed: boolean; retryAfterMs?: number } | null> {
  try {
    const db = getAdminDb();
    const ref = db.collection('toolbox_rate_limits').doc(key.replace(/[^a-zA-Z0-9._-]/g, '_'));
    const now = Date.now();

    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.data() as { count?: number; windowStart?: number } | undefined;
      const windowStart = data?.windowStart ?? 0;
      const count = data?.count ?? 0;

      if (!data || now - windowStart >= WINDOW_MS) {
        tx.set(ref, { count: 1, windowStart: now, updatedAt: new Date().toISOString() });
        return { allowed: true as const };
      }

      if (count >= MAX_REQUESTS_PER_WINDOW) {
        return { allowed: false as const, retryAfterMs: WINDOW_MS - (now - windowStart) };
      }

      tx.update(ref, { count: count + 1, updatedAt: new Date().toISOString() });
      return { allowed: true as const };
    });

    return result;
  } catch {
    return null;
  }
}

export async function checkToolboxRateLimit(clientKey: string): Promise<{ allowed: boolean; retryAfterMs?: number }> {
  const firestoreResult = await checkFirestoreLimit(clientKey);
  if (firestoreResult) return firestoreResult;
  return checkMemoryLimit(clientKey);
}

export function getClientIp(req: { headers: Record<string, string | string[] | undefined> }): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0].split(',')[0].trim();
  }
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string') return realIp;
  return 'unknown';
}
