import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { getPublishedInsights } from '@/lib/insightsServer';
import { mapInsightDocToItem } from '@/lib/firingLineContent';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = getAdminDb();
    const featured = req.query.featured === 'true';
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;

    const docs = await getPublishedInsights(db, {
      featured: featured || undefined,
      limit: Number.isFinite(limit) ? limit : undefined,
    });

    const items = docs.map(mapInsightDocToItem);
    return res.status(200).json({ items });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('public insights GET error:', error);
    return res.status(500).json({ error: 'Failed to load insights', details: message });
  }
}
