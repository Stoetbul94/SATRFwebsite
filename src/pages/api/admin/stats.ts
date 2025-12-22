import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdminFromToken } from '@/lib/admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify admin access
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const { isAdmin } = await verifyAdminFromToken(token);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

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

    // Fetch stats from Firestore
    const [usersSnapshot, scoresSnapshot, eventsSnapshot, pendingScoresSnapshot] = await Promise.all([
      db.collection('users').get(),
      db.collection('scores').get(),
      db.collection('events').get(),
      db.collection('scores').where('status', '==', 'pending').get(),
    ]);

    const stats = {
      totalUsers: usersSnapshot.size,
      totalScores: scoresSnapshot.size,
      totalEvents: eventsSnapshot.size,
      pendingScores: pendingScoresSnapshot.size,
      recentActivity: 0, // Can be enhanced later
    };

    return res.status(200).json(stats);
  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}


