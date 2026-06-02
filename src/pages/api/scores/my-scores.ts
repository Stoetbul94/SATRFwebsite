import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb, verifyRequestUser } from '@/lib/firebaseAdmin';
import type { Score } from '@/types/scores';

/**
 * GET /api/scores/my-scores
 *
 * Returns the authenticated member's own scores from Firestore, newest first.
 * Optional query: ?discipline=prone_50m | three_position_50m
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await verifyRequestUser(req.headers.authorization);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const db = getAdminDb();
    let query: FirebaseFirestore.Query = db
      .collection('scores')
      .where('userId', '==', user.uid);

    const { discipline } = req.query;
    if (discipline && typeof discipline === 'string') {
      query = query.where('discipline', '==', discipline);
    }

    const snapshot = await query.get();
    const scores = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as Score & { deleted?: boolean })
      .filter((s) => !s.deleted)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    return res.status(200).json({ data: scores, total: scores.length });
  } catch (error: any) {
    console.error('my-scores error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
