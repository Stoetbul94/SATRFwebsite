import type { NextApiRequest, NextApiResponse } from 'next';
import { Timestamp } from 'firebase-admin/firestore';
import { verifyAdminFromToken } from '@/lib/admin';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { uploadEventCoverImage } from '@/lib/eventImageUpload';
import {
  buildFirestoreEventData,
  serializeEventDoc,
  validateEventPayload,
} from '@/lib/firestoreEvents';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '6mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const { isAdmin, userId } = await verifyAdminFromToken(token);
  if (!isAdmin) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  try {
    const db = getAdminDb();

    if (req.method === 'GET') {
      const snapshot = await db.collection('events').orderBy('date', 'desc').limit(1000).get();
      const events = snapshot.docs.map((doc) =>
        serializeEventDoc(doc.id, doc.data() as Record<string, unknown>)
      );
      return res.status(200).json({ events });
    }

    if (req.method === 'POST') {
      const body = (req.body ?? {}) as Record<string, unknown>;
      const validation = validateEventPayload(body, { isCreate: true });

      if (!validation.ok) {
        return res.status(400).json({ error: validation.errors.join('; ') });
      }

      let eventDate = body.date;
      if (typeof eventDate === 'string' && eventDate.includes('/')) {
        const [year, month, day] = eventDate.split('/');
        eventDate = new Date(`${year}-${month}-${day}`).toISOString();
      } else if (typeof eventDate === 'string' && !eventDate.includes('T')) {
        eventDate = new Date(`${eventDate}T00:00:00Z`).toISOString();
      }

      const dateObj = new Date(eventDate as string);
      if (isNaN(dateObj.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }

      const firestoreData = buildFirestoreEventData(body, validation);
      firestoreData.date = Timestamp.fromDate(dateObj);
      firestoreData.createdAt = Timestamp.now();
      firestoreData.updatedAt = Timestamp.now();

      const docRef = await db.collection('events').add(firestoreData);

      let imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl : null;
      if (typeof body.imageBase64 === 'string' && body.imageBase64) {
        imageUrl = await uploadEventCoverImage(
          docRef.id,
          body.imageBase64,
          typeof body.contentType === 'string' ? body.contentType : undefined
        );
      }

      if (!imageUrl) {
        await docRef.delete();
        return res.status(400).json({ error: 'Event image is required' });
      }

      const saved = serializeEventDoc(docRef.id, {
        ...firestoreData,
        date: dateObj.toISOString(),
        imageUrl,
      } as Record<string, unknown>);

      if (userId) {
        try {
          await db.collection('adminActions').add({
            adminId: userId,
            action: 'create_event',
            targetId: docRef.id,
            details: saved,
            timestamp: new Date().toISOString(),
          });
        } catch {
          /* non-blocking */
        }
      }

      return res.status(201).json({
        success: true,
        id: docRef.id,
        message: 'Event created successfully',
        event: saved,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error handling events:', error);
    return res.status(500).json({ error: 'Internal server error', details: message });
  }
}
