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
    return res.status(400).json({ error: 'Invalid score ID' });
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
    const scoreRef = db.collection('scores').doc(id);
    const scoreDoc = await scoreRef.get();

    if (!scoreDoc.exists) {
      return res.status(404).json({ error: 'Score not found' });
    }

    if (req.method === 'PUT') {
      const updates = req.body;
      
      // Validate updates
      if (updates.score !== undefined && (updates.score < 0 || updates.score > 109)) {
        return res.status(400).json({ error: 'Invalid score value' });
      }

      // Update score
      await scoreRef.update({
        ...updates,
        updatedAt: new Date().toISOString(),
      });

      // Log admin action
      await db.collection('adminActions').add({
        adminId: userId,
        action: 'update_score',
        targetId: id,
        details: updates,
        timestamp: new Date().toISOString(),
      });

      return res.status(200).json({ success: true, message: 'Score updated successfully' });
    }

    if (req.method === 'DELETE') {
      // Soft delete - mark as deleted instead of actually deleting
      await scoreRef.update({
        deleted: true,
        deletedAt: new Date().toISOString(),
        deletedBy: userId,
      });

      // Log admin action
      await db.collection('adminActions').add({
        adminId: userId,
        action: 'delete_score',
        targetId: id,
        timestamp: new Date().toISOString(),
      });

      return res.status(200).json({ success: true, message: 'Score deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error handling score:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}


