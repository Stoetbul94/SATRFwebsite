import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdminFromToken } from '@/lib/admin';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { buildScore, validateScoreInput } from '@/lib/issf';
import type { ScoreInput, Score } from '@/types/scores';

/**
 * /api/admin/scores
 *  GET  — list scores (admin), optional ?status & ?search & ?discipline
 *  POST — create one or more scores from ScoreInput[] (manual entry / import)
 *
 * Writes go through the ISSF validator + buildScore() so totals are always
 * derived server-side. Unmatched shooters are linked to a member by
 * name + club when possible.
 */

async function findMemberUid(
  db: FirebaseFirestore.Firestore,
  shooterName: string,
  club: string,
  cache: Map<string, string | null>
): Promise<string | null> {
  const key = `${shooterName.toLowerCase()}|${club.toLowerCase()}`;
  if (cache.has(key)) return cache.get(key)!;

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
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const { isAdmin, userId: adminUid } = await verifyAdminFromToken(token);
  if (!isAdmin) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  const db = getAdminDb();

  // --- LIST ---
  if (req.method === 'GET') {
    try {
      let query: FirebaseFirestore.Query = db.collection('scores');
      const { status, search, discipline } = req.query;
      if (status && status !== 'all') query = query.where('status', '==', status);
      if (discipline && discipline !== 'all') query = query.where('discipline', '==', discipline);

      const snapshot = await query.limit(1000).get();
      let scores = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Score);
      scores.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

      if (search && typeof search === 'string') {
        const q = search.toLowerCase();
        scores = scores.filter(
          (s) =>
            s.shooterName?.toLowerCase().includes(q) ||
            s.club?.toLowerCase().includes(q) ||
            s.eventName?.toLowerCase().includes(q)
        );
      }

      return res.status(200).json({ scores });
    } catch (error: any) {
      console.error('Error fetching scores:', error);
      return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  // --- CREATE ---
  if (req.method === 'POST') {
    try {
      const body = req.body ?? {};
      const inputs: ScoreInput[] = Array.isArray(body.scores) ? body.scores : [body];
      if (inputs.length === 0) {
        return res.status(400).json({ error: 'No scores provided' });
      }
      if (inputs.length > 1000) {
        return res.status(400).json({ error: 'Maximum 1000 scores per request' });
      }

      // Validate all first; only write if every row is acceptable.
      const errors: { index: number; issues: any[] }[] = [];
      inputs.forEach((input, i) => {
        const strict = (input.status ?? 'official') === 'official';
        const result = validateScoreInput(input, { strict });
        if (!result.valid) errors.push({ index: i, issues: result.errors });
      });
      if (errors.length > 0) {
        return res.status(400).json({ error: 'Validation failed', details: errors });
      }

      const cache = new Map<string, string | null>();
      const batch = db.batch();
      const created: string[] = [];

      for (const input of inputs) {
        let userId = input.userId ?? null;
        if (!userId) {
          userId = await findMemberUid(db, input.shooterName, input.club, cache);
        }
        const score = buildScore({ ...input, userId }, { createdBy: adminUid || 'admin' });
        const ref = db.collection('scores').doc();
        batch.set(ref, score);
        created.push(ref.id);
      }

      await batch.commit();
      return res.status(201).json({
        success: true,
        message: `Saved ${created.length} score(s)`,
        ids: created,
      });
    } catch (error: any) {
      console.error('Error saving scores:', error);
      return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
