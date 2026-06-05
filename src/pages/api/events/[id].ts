import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { serializeEventDoc } from '@/lib/firestoreEvents';

/**
 * Public, read-only single event from Firestore.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    const doc = await getAdminDb().collection('events').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Event not found', id });
    }

    return res.status(200).json(serializeEventDoc(doc.id, doc.data() as Record<string, unknown>));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Event API route error:', error);
    return res.status(500).json({ error: 'Internal server error', details: message });
  }
}
