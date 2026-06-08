import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { rank3pFinalists, rankProneFinalists } from '@/lib/issf';
import type { Discipline, Score } from '@/types/scores';

/**
 * GET /api/leaderboard/finals
 *
 * Finals-only public rankings per discipline and category.
 * Prone board: stage=prone_final. 3P board: stage=3p_final.
 * F-Class has no finals board (returns empty).
 */
interface FinalsRankRow {
  rank: number;
  userId: string | null;
  shooterName: string;
  club: string;
  category: string;
  discipline: string;
  decimalTotal: number;
  finalRank: number | null;
  eventName: string;
  date: string;
}

const FINALS_DISCIPLINES: Discipline[] = ['prone_50m', 'three_position_50m'];

function expectedFinalStage(discipline: Discipline): 'prone_final' | '3p_final' | null {
  if (discipline === 'three_position_50m') return '3p_final';
  if (discipline === 'prone_50m') return 'prone_final';
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const discipline = (req.query.discipline as Discipline) || 'prone_50m';
  const category = req.query.category as string | undefined;
  const stage = expectedFinalStage(discipline);

  if (!stage || !FINALS_DISCIPLINES.includes(discipline)) {
    return res.status(200).json({
      data: [],
      total: 0,
      filters: { discipline, category: category || 'all', stage: null },
      message: 'No finals board for this discipline',
    });
  }

  try {
    const db = getAdminDb();
    let query: FirebaseFirestore.Query = db
      .collection('scores')
      .where('discipline', '==', discipline)
      .where('stage', '==', stage)
      .where('status', '==', 'official');

    if (category && category !== 'all') {
      query = query.where('category', '==', category);
    }

    const snapshot = await query.get();
    const scores = snapshot.docs
      .map((d) => ({ ...(d.data() as Score), id: d.id }))
      .filter((s) => !(s as Score & { deleted?: boolean }).deleted);

    if (scores.length === 0) {
      return res.status(200).json({
        data: [],
        total: 0,
        filters: { discipline, category: category || 'all', stage },
      });
    }

    let rankMap: Map<string, number>;
    if (stage === '3p_final') {
      rankMap = rank3pFinalists(
        scores.map((s) => ({
          id: s.id,
          eliminatedAtShot: s.eliminatedAtShot,
          decimalTotal: s.decimalTotal,
        }))
      );
    } else {
      rankMap = rankProneFinalists(scores.map((s) => ({ id: s.id, decimalTotal: s.decimalTotal })));
    }

    const rows: FinalsRankRow[] = scores.map((s) => ({
      rank: 0,
      userId: s.userId,
      shooterName: s.shooterName,
      club: s.club,
      category: s.category,
      discipline,
      decimalTotal: s.decimalTotal,
      finalRank: s.finalRank ?? rankMap.get(s.id) ?? null,
      eventName: s.eventName,
      date: s.date,
    }));

    rows.sort((a, b) => {
      const ra = a.finalRank ?? 999;
      const rb = b.finalRank ?? 999;
      if (ra !== rb) return ra - rb;
      return b.decimalTotal - a.decimalTotal;
    });
    rows.forEach((r, i) => (r.rank = i + 1));

    return res.status(200).json({
      data: rows,
      total: rows.length,
      filters: { discipline, category: category || 'all', stage },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('finals leaderboard error:', error);
    return res.status(500).json({ error: 'Internal server error', details: message });
  }
}
