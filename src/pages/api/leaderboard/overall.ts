import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { parseEventDisciplines } from '@/lib/eventDisciplines';
import { aggregateShooterRings, round1, sortRankRows } from '@/lib/rankingsDisplay';
import type { Discipline, Score } from '@/types/scores';

/**
 * GET /api/leaderboard/overall
 *
 * Public rankings. Aggregates official scores per shooter and ranks by the
 * AVERAGE of their decimal totals (per discipline). Higher average = better.
 * Tiebreaker: ring average descending (ISSF).
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
  averageRings?: number | null;
  bestRings?: number | null;
  seasonEventTotal?: number | null;
  province?: string | null;
}

function parseFirestoreDate(value: unknown): Date | null {
  if (!value) return null;
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const toDate = (value as { toDate?: () => Date }).toDate;
    if (typeof toDate === 'function') return toDate.call(value);
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function countSeasonEventsForDiscipline(
  eventDocs: FirebaseFirestore.QueryDocumentSnapshot[],
  discipline: Discipline,
  year: number
): number {
  let count = 0;
  for (const doc of eventDocs) {
    const data = doc.data() as Record<string, unknown>;
    if (data.isTestEvent === true) continue;
    const eventDate = parseFirestoreDate(data.date);
    if (!eventDate || eventDate.getFullYear() !== year) continue;
    const disciplines = parseEventDisciplines(data);
    if (disciplines.includes(discipline)) count += 1;
  }
  return count;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const discipline = (req.query.discipline as string) || 'prone_50m';
  const category = req.query.category as string | undefined;

  try {
    const db = getAdminDb();
    const currentYear = new Date().getFullYear();

    let query: FirebaseFirestore.Query = db
      .collection('scores')
      .where('discipline', '==', discipline);

    query = query.where('status', '==', 'official');
    if (category && category !== 'all') {
      query = query.where('category', '==', category);
    }

    const [snapshot, eventsSnapshot] = await Promise.all([
      query.get(),
      db.collection('events').get(),
    ]);

    const scores = snapshot.docs
      .map((d) => d.data() as Score & { deleted?: boolean; stage?: string })
      .filter((s) => !s.deleted)
      .filter((s) => !s.stage || s.stage === 'qualification');

    const seasonEventTotal = countSeasonEventsForDiscipline(
      eventsSnapshot.docs,
      discipline as Discipline,
      currentYear
    );
    const seasonTotal = seasonEventTotal > 0 ? seasonEventTotal : null;

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
      const { averageRings, bestRings } = aggregateShooterRings(list);
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
        averageRings,
        bestRings,
        seasonEventTotal: seasonTotal,
        province: null,
      };
    });

    sortRankRows(rows);

    const userIdSet = new Set(
      rows.map((r) => r.userId).filter((id): id is string => Boolean(id))
    );
    const userIds = Array.from(userIdSet);
    if (userIds.length > 0) {
      const provinceByUserId = new Map<string, string>();
      await Promise.all(
        userIds.map(async (uid) => {
          const snap = await db.collection('users').doc(uid).get();
          if (!snap.exists) return;
          const province = snap.data()?.province;
          if (typeof province === 'string' && province.trim()) {
            provinceByUserId.set(uid, province.trim());
          }
        })
      );
      for (const row of rows) {
        if (row.userId) {
          row.province = provinceByUserId.get(row.userId) ?? null;
        }
      }
    }

    return res.status(200).json({
      data: rows,
      total: rows.length,
      seasonEventTotal: seasonTotal,
      filters: { discipline, category: category || 'all' },
    });
  } catch (error: any) {
    console.error('leaderboard error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
