import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdminFromToken } from '@/lib/admin';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { buildScore, rank3pFinalists, rankProneFinalists, validateScoreInput } from '@/lib/issf';
import { rankingValueForScore } from '@/lib/rankingsDisplay';
import type { ScoreInput, Score } from '@/types/scores';
import { enrichScoreInput, type MemberLookup } from '@/lib/scoreMemberEnrich';
import { findReplaceableScores, softDeleteScores } from '@/lib/scoreReplace';

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
    if (parts.length >= 2 && club.trim()) {
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

async function enrichInput(
  db: FirebaseFirestore.Firestore,
  input: ScoreInput,
  cache: Map<string, string | null>,
  nameCache: Map<string, MemberLookup | null>
): Promise<ScoreInput> {
  return enrichScoreInput(db, input, cache, nameCache);
}

async function assignFinalRanks(
  db: FirebaseFirestore.Firestore,
  created: { id: string; score: Omit<Score, 'id'> }[]
) {
  const byGroup = new Map<string, { id: string; score: Omit<Score, 'id'> }[]>();
  for (const item of created) {
    if (item.score.stage !== 'prone_final' && item.score.stage !== '3p_final') continue;
    const key = `${item.score.eventId}|${item.score.discipline}|${item.score.stage}`;
    const list = byGroup.get(key) ?? [];
    list.push(item);
    byGroup.set(key, list);
  }

  for (const group of Array.from(byGroup.values())) {
    const stage = group[0].score.stage;
    let rankMap: Map<string, number>;
    if (stage === '3p_final') {
      rankMap = rank3pFinalists(
        group.map((g) => ({
          id: g.id,
          eliminatedAtShot: g.score.eliminatedAtShot,
          decimalTotal: g.score.decimalTotal,
        }))
      );
    } else {
      rankMap = rankProneFinalists(
        group.map((g) => ({ id: g.id, decimalTotal: rankingValueForScore(g.score) })),
      );
    }

    const batch = db.batch();
    for (const g of group) {
      const rank = g.score.finalRank ?? rankMap.get(g.id);
      if (rank != null && g.score.finalRank == null) {
        batch.update(db.collection('scores').doc(g.id), { finalRank: rank, updatedAt: new Date().toISOString() });
      }
    }
    await batch.commit();
  }
}

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

    const db = getAdminDb();
    const cache = new Map<string, string | null>();
    const nameCache = new Map<string, MemberLookup | null>();

    const enriched: ScoreInput[] = [];
    for (const raw of scores) {
      enriched.push(await enrichInput(db, { ...raw, source: raw.source ?? 'excel' }, cache, nameCache));
    }

    const errors: { index: number; issues: unknown[] }[] = [];
    enriched.forEach((input, i) => {
      const strict = (input.status ?? 'official') === 'official';
      const result = validateScoreInput(input, { strict });
      if (!result.valid) errors.push({ index: i, issues: result.errors });
    });

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors,
        summary: { total: scores.length, valid: 0, invalid: scores.length },
      });
    }

    let totalReplaced = 0;
    for (const input of enriched) {
      const replaceIds = await findReplaceableScores(db, input);
      totalReplaced += await softDeleteScores(db, replaceIds, adminUid || 'admin');
    }

    const batch = db.batch();
    const created: { id: string; score: Omit<Score, 'id'> }[] = [];

    for (const input of enriched) {
      const score = buildScore(input, { createdBy: adminUid || 'admin' });
      const ref = db.collection('scores').doc();
      batch.set(ref, sanitizeForFirestore(score));
      created.push({ id: ref.id, score });
    }

    await batch.commit();
    await assignFinalRanks(db, created);

    return res.status(200).json({
      success: true,
      message:
        totalReplaced > 0
          ? `Replaced ${totalReplaced} existing score(s); imported ${created.length} new score(s)`
          : `Successfully imported ${created.length} score(s)`,
      replaced: totalReplaced,
      imported: created.length,
      ids: created.map((c) => c.id),
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
