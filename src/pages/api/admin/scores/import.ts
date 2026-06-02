import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdminFromToken } from '@/lib/admin';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { buildScore, validateScoreInput } from '@/lib/issf';
import type { ScoreInput } from '@/types/scores';

function sanitizeForFirestore<T>(value: T): T {
  if (value === undefined) return value;
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForFirestore(item)) as T;
  }
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (val !== undefined) out[key] = sanitizeForFirestore(val);
  }
  return out as T;
}

async function findMemberUid(
  db: FirebaseFirestore.Firestore,
  shooterName: string,
  club: string,
  cache: Map<string, string | null>
): Promise<string | null> {
  const key = `${shooterName.toLowerCase()}|${club.toLowerCase()}`;
  if (cache.has(key)) return cache.get(key)!;

  try {
    const parts = shooterName.trim().split(/\s+/);
    let uid: string | null = null;
    if (parts.length >= 2) {
      const firstName = parts[0];
      const lastName = parts.slice(1).join(' ');
      const snap = await db
        .collection('users')
        .where('firstName', '==', firstName)
        .where('lastName', '==', lastName)
        .where('club', '==', club)
        .limit(1)
        .get();
      if (!snap.empty) uid = snap.docs[0].id;
    }
    cache.set(key, uid);
    return uid;
  } catch (err) {
    console.warn('findMemberUid failed:', err);
    cache.set(key, null);
    return null;
  }
}

/**
 * POST /api/admin/scores/import
 * Body: { scores: ScoreInput[] }
 * Same validation + Firestore write as POST /api/admin/scores.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const { isAdmin, userId: adminUid } = await verifyAdminFromToken(token);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const scores: ScoreInput[] = req.body?.scores;
    if (!Array.isArray(scores) || scores.length === 0) {
      return res.status(400).json({ error: 'No scores provided' });
    }
    if (scores.length > 1000) {
      return res.status(400).json({ error: 'Maximum 1000 scores per import' });
    }

    const errors: { index: number; issues: unknown[] }[] = [];
    scores.forEach((input, i) => {
      const withSource = { ...input, source: input.source ?? 'excel' };
      const strict = (withSource.status ?? 'official') === 'official';
      const result = validateScoreInput(withSource, { strict });
      if (!result.valid) errors.push({ index: i, issues: result.errors });
    });

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors,
        summary: { total: scores.length, valid: 0, invalid: scores.length },
      });
    }

    const db = getAdminDb();
    const cache = new Map<string, string | null>();
    const batch = db.batch();
    const created: string[] = [];

    for (const input of scores) {
      let userId = input.userId?.trim() ? input.userId : null;
      if (!userId && input.shooterName?.trim()) {
        userId = await findMemberUid(db, input.shooterName, input.club, cache);
      }
      const score = buildScore(
        { ...input, userId, source: input.source ?? 'excel' },
        { createdBy: adminUid || 'admin' }
      );
      const ref = db.collection('scores').doc();
      batch.set(ref, sanitizeForFirestore(score));
      created.push(ref.id);
    }

    await batch.commit();

    return res.status(200).json({
      success: true,
      message: `Successfully imported ${created.length} score(s)`,
      imported: created.length,
      ids: created,
      summary: { total: scores.length, valid: created.length, invalid: 0 },
    });
  } catch (error) {
    console.error('Score import error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
