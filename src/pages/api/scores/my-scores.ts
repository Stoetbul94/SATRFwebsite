import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb, verifyRequestUser } from '@/lib/firebaseAdmin';
import {
  filterScoresByYear,
  isFinalStageForDiscipline,
  isQualificationStage,
} from '@/lib/athleteAnalytics';
import type { Discipline, Score } from '@/types/scores';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

/**
 * GET /api/scores/my-scores
 *
 * Authenticated personal scores only — identity from Firebase token.
 * Optional: ?discipline= &year= &limit= &stage=qual|final|all
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await verifyRequestUser(req.headers.authorization);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Never honour client identity overrides.
  if (req.query.uid || req.query.userId) {
    // continue with verified uid only
  }

  try {
    const db = getAdminDb();
    const discipline =
      typeof req.query.discipline === 'string' ? req.query.discipline : undefined;
    const yearParam = typeof req.query.year === 'string' ? req.query.year : undefined;
    const stageFilter =
      typeof req.query.stage === 'string' ? req.query.stage.toLowerCase() : 'all';

    let limit = DEFAULT_LIMIT;
    if (typeof req.query.limit === 'string') {
      const parsed = parseInt(req.query.limit, 10);
      if (!Number.isNaN(parsed)) limit = Math.min(Math.max(parsed, 1), MAX_LIMIT);
    }

    let query: FirebaseFirestore.Query = db.collection('scores').where('userId', '==', user.uid);

    if (discipline) {
      query = query.where('discipline', '==', discipline);
    }

    query = query.orderBy('date', 'desc').limit(limit);

    const snapshot = await query.get();
    let scores = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as Score & { deleted?: boolean })
      .filter((s) => !s.deleted);

    if (yearParam && yearParam !== 'all') {
      const year = parseInt(yearParam, 10);
      if (!Number.isNaN(year)) {
        scores = filterScoresByYear(scores, year);
      }
    }

    if (stageFilter === 'qual') {
      scores = scores.filter((s) => isQualificationStage(s.stage));
    } else if (stageFilter === 'final') {
      scores = scores.filter((s) => isFinalStageForDiscipline(s.stage, s.discipline));
    }

    return res.status(200).json({
      data: scores,
      total: scores.length,
      limit,
      discipline: discipline ?? null,
      year: yearParam ?? null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('my-scores error:', message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
