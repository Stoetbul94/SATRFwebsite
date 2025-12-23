import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Next.js API Route: /api/events/[id]
 *
 * Fetch a single event directly from Firestore (no backend proxy).
 * Public, read-only.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    const { initializeApp, getApps, cert, applicationDefault } = await import('firebase-admin/app');
    const { getFirestore } = await import('firebase-admin/firestore');

    if (!getApps().length) {
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        : null;

      if (serviceAccount) {
        initializeApp({
          credential: cert(serviceAccount),
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'satrf-website',
        });
      } else {
        initializeApp({
          credential: applicationDefault(),
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'satrf-website',
        });
      }
    }

    const db = getFirestore();
    const docRef = db.collection('events').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Event not found', id });
    }

    const data = doc.data() || {};
    const toIso = (d: any) => {
      if (!d) return null;
      if (d.toDate) return d.toDate().toISOString();
      if (typeof d === 'string') return d;
      return null;
    };

    const event = {
      id: doc.id,
      title: data.title || '',
      description: data.description || '',
      date: toIso(data.date),
      location: data.location || '',
      type: data.type || data.category || 'Target Rifle',
      status: data.status || 'upcoming',
      maxParticipants: data.maxParticipants || 0,
      currentParticipants: data.currentParticipants || 0,
      imageUrl: data.imageUrl || data.imageURL || data.image || null,
      payfastUrl: data.payfastUrl || null,
      eftInstructions: data.eftInstructions || null,
      isTestEvent: data.isTestEvent || false,
      createdAt: toIso(data.createdAt),
      updatedAt: toIso(data.updatedAt),
    };

    return res.status(200).json(event);
  } catch (error) {
    console.error('Event API route error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
