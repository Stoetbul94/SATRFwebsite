import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { serializeEventDoc } from '@/lib/firestoreEvents';
import { syncEventRegistrationCount } from '@/lib/registrations';

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

    const db = getAdminDb();
    const doc = await db.collection('events').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Event not found', id });
    }

    const count = await syncEventRegistrationCount(db, id);
    const serialized = serializeEventDoc(doc.id, doc.data() as Record<string, unknown>);
    return res.status(200).json({ ...serialized, currentParticipants: count });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Event API route error:', error);
    return res.status(500).json({ error: 'Internal server error', details: message });
  }
}
