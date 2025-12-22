import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdminFromToken } from '@/lib/admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const { isAdmin, userId } = await verifyAdminFromToken(token);
  if (!isAdmin) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid event ID' });
  }

  try {
    // Initialize Firebase Admin SDK
    const { initializeApp, getApps, cert, applicationDefault } = await import('firebase-admin/app');
    const { getFirestore } = await import('firebase-admin/firestore');

    if (!getApps().length) {
      try {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
          ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
          : null;

        if (serviceAccount) {
          initializeApp({
            credential: cert(serviceAccount),
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'satrf-website',
          });
        } else {
          try {
            initializeApp({
              credential: applicationDefault(),
              projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'satrf-website',
            });
          } catch {
            initializeApp({
              projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'satrf-website',
            });
          }
        }
      } catch (initError) {
        console.error('Firebase Admin initialization error:', initError);
      }
    }

    const db = getFirestore();
    const eventRef = db.collection('events').doc(id);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (req.method === 'PUT') {
      const updates = {
        ...req.body,
        updatedAt: new Date().toISOString(),
      };

      await eventRef.update(updates);

      // Log admin action
      await db.collection('adminActions').add({
        adminId: userId,
        action: 'update_event',
        targetId: id,
        details: updates,
        timestamp: new Date().toISOString(),
      });

      return res.status(200).json({ success: true, message: 'Event updated successfully' });
    }

    if (req.method === 'DELETE') {
      // Soft delete - mark as archived
      await eventRef.update({
        status: 'closed',
        archived: true,
        archivedAt: new Date().toISOString(),
        archivedBy: userId,
      });

      // Log admin action
      await db.collection('adminActions').add({
        adminId: userId,
        action: 'archive_event',
        targetId: id,
        timestamp: new Date().toISOString(),
      });

      return res.status(200).json({ success: true, message: 'Event archived successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error handling event:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

