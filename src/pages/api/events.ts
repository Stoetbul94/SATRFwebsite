import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { serializeEventDoc } from '@/lib/firestoreEvents';

/**
 * Public, read-only events feed from Firestore (no auth required).
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = getAdminDb();
    const snapshot = await db.collection('events').orderBy('date', 'desc').limit(500).get();

    const events = snapshot.docs.map((doc) => serializeEventDoc(doc.id, doc.data() as Record<string, unknown>));

    return res.status(200).json(events);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Events API route error:', error);
    return res.status(500).json({ error: 'Internal server error', details: message });
  }
}
