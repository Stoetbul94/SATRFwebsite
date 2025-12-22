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

  const { isAdmin } = await verifyAdminFromToken(token);
  if (!isAdmin) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  if (req.method === 'GET') {
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
      
      // Try to fetch users with orderBy, but fallback to simple query if index doesn't exist
      let snapshot;
      try {
        snapshot = await db.collection('users')
          .orderBy('createdAt', 'desc')
          .limit(1000)
          .get();
      } catch (orderByError: any) {
        // If orderBy fails (likely missing index), try without orderBy
        console.warn('orderBy failed, fetching without order:', orderByError.message);
        snapshot = await db.collection('users')
          .limit(1000)
          .get();
      }
      
      const users = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Ensure createdAt exists for display
          createdAt: data.createdAt || data.created_at || new Date().toISOString(),
        };
      });

      // Sort manually if orderBy didn't work
      if (users.length > 0 && !users[0].createdAt) {
        users.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA; // Descending
        });
      }

      console.log(`Fetched ${users.length} users from Firestore`);
      return res.status(200).json({ users });
    } catch (error: any) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}


