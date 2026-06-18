import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { getPublishedInsightBySlug } from '@/lib/insightsServer';
import { mapInsightDocToItem } from '@/lib/firingLineContent';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug } = req.query;
  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: 'Invalid slug' });
  }

  try {
    const db = getAdminDb();
    const doc = await getPublishedInsightBySlug(db, slug);
    if (!doc) {
      return res.status(404).json({ error: 'Insight not found' });
    }

    return res.status(200).json({ item: mapInsightDocToItem(doc), insight: doc });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('public insight GET error:', error);
    return res.status(500).json({ error: 'Failed to load insight', details: message });
  }
}
