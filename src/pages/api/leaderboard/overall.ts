import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '@/lib/firebaseAdmin';
import type { Score } from '@/types/scores';

/**
 * GET /api/leaderboard/overall
 *
 * Public rankings. Aggregates official scores per shooter and ranks by the
 * AVERAGE of their decimal totals (per discipline). Higher average = better.
 *
 * Query: ?discipline=prone_50m|three_position_50m  (default prone_50m)
 *        &category=open|junior|veteran|ladies       (optional)
 */
interface RankRow {
  rank: number;
  userId: string | null;
  shooterName: string;
  club: string;
  category: string;
  discipline: string;
  average: number;
  best: number;
  eventCount: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const discipline = (req.query.discipline as string) || 'prone_50m';
  const category = req.query.category as string | undefined;

  try {
    const db = getAdminDb();
    let query: FirebaseFirestore.Query = db
      .collection('scores')
      .where('discipline', '==', discipline);

    // Only official results count toward rankings.
    query = query.where('status', '==', 'official');
    if (category && category !== 'all') {
      query = query.where('category', '==', category);
    }

    const snapshot = await query.get();
    const scores = snapshot.docs
      .map((d) => d.data() as Score & { deleted?: boolean; stage?: string })
      .filter((s) => !s.deleted)
      .filter((s) => !s.stage || s.stage === 'qualification');

    // Group by member (userId when present, else name|club).
    const groups = new Map<string, Score[]>();
    for (const s of scores) {
      const key = s.userId || `${s.shooterName.toLowerCase()}|${s.club.toLowerCase()}`;
      const list = groups.get(key) ?? [];
      list.push(s);
      groups.set(key, list);
    }

    const rows: RankRow[] = Array.from(groups.values()).map((list) => {
      const totals = list.map((s) => s.decimalTotal);
      const average = round1(totals.reduce((a, b) => a + b, 0) / totals.length);
      const best = Math.max(...totals);
      const latest = list[0];
      return {
        rank: 0,
        userId: latest.userId,
        shooterName: latest.shooterName,
        club: latest.club,
        category: latest.category,
        discipline,
        average,
        best: round1(best),
        eventCount: list.length,
      };
    });

    rows.sort((a, b) => b.average - a.average);
    rows.forEach((r, i) => (r.rank = i + 1));

    return res.status(200).json({
      data: rows,
      total: rows.length,
      filters: { discipline, category: category || 'all' },
    });
  } catch (error: any) {
    console.error('leaderboard error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
