import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdminFromToken } from '@/lib/admin';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { buildScore, rank3pFinalists, rankProneFinalists, validateScoreInput } from '@/lib/issf';
import { rankingValueForScore } from '@/lib/rankingsDisplay';
import type { ScoreInput, Score } from '@/types/scores';
import { enrichScoreInput, type MemberLookup } from '@/lib/scoreMemberEnrich';
import { findReplaceableScores, softDeleteScores } from '@/lib/scoreReplace';

/**
 * /api/admin/scores
 *  GET  — list scores (admin), optional ?status & ?search & ?discipline
 *  POST — create one or more scores from ScoreInput[] (manual entry / import)
 *
 * Writes go through the ISSF validator + buildScore() so totals are always
 * derived server-side. Unmatched shooters are linked to a member by
 * name + club when possible.
 */

/** Remove undefined values so Firestore accepts nested score documents. */
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
      let scores = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }) as Score & { deleted?: boolean })
        .filter((s) => !s.deleted);
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
      const memberCache = new Map<string, MemberLookup | null>();

      const enrichedInputs: ScoreInput[] = [];
      for (const input of inputs) {
        enrichedInputs.push(await enrichScoreInput(db, input, cache, memberCache));
      }

      let totalReplaced = 0;
      for (const enriched of enrichedInputs) {
        const replaceIds = await findReplaceableScores(db, enriched);
        totalReplaced += await softDeleteScores(db, replaceIds, adminUid || 'admin');
      }

      const batch = db.batch();
      const created: { id: string; score: Omit<Score, 'id'> }[] = [];

      for (const enriched of enrichedInputs) {
        const score = buildScore(enriched, { createdBy: adminUid || 'admin' });
        const ref = db.collection('scores').doc();
        batch.set(ref, sanitizeForFirestore(score));
        created.push({ id: ref.id, score });
      }

      await batch.commit();

      const rankBatch = db.batch();
      const byGroup = new Map<string, { id: string; score: Omit<Score, 'id'> }[]>();
      for (const item of created) {
        if (item.score.stage !== 'prone_final' && item.score.stage !== '3p_final') continue;
        const key = `${item.score.eventId}|${item.score.discipline}|${item.score.stage}`;
        const list = byGroup.get(key) ?? [];
        list.push(item);
        byGroup.set(key, list);
      }
      for (const group of Array.from(byGroup.values())) {
        const st = group[0].score.stage;
        const rankMap =
          st === '3p_final'
            ? rank3pFinalists(
                group.map((g) => ({
                  id: g.id,
                  eliminatedAtShot: g.score.eliminatedAtShot,
                  decimalTotal: g.score.decimalTotal,
                }))
              )
            : rankProneFinalists(
                group.map((g) => ({
                  id: g.id,
                  decimalTotal: rankingValueForScore(g.score),
                })),
              );
        for (const g of group) {
          const rank = g.score.finalRank ?? rankMap.get(g.id);
          if (rank != null && g.score.finalRank == null) {
            rankBatch.update(db.collection('scores').doc(g.id), {
              finalRank: rank,
              updatedAt: new Date().toISOString(),
            });
          }
        }
      }
      if (byGroup.size > 0) {
        await rankBatch.commit().catch((err) => console.warn('finalRank update failed:', err));
      }
      return res.status(201).json({
        success: true,
        message:
          totalReplaced > 0
            ? `Replaced ${totalReplaced} existing score(s); saved ${created.length} new score(s)`
            : `Saved ${created.length} score(s)`,
        replaced: totalReplaced,
        ids: created.map((c) => c.id),
      });
    } catch (error: any) {
      console.error('Error saving scores:', error);
      return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
