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
      let query: FirebaseFirestore.Query = db.collection('adminActions');

      // Apply action filter if provided
      const { action } = req.query;
      if (action && action !== 'all') {
        query = query.where('action', '==', action);
      }

      const snapshot = await query
        .orderBy('timestamp', 'desc')
        .limit(500)
        .get();

      // Fetch admin emails for display
      const actions = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();
          let adminEmail = null;
          
          try {
            const adminDoc = await db.collection('users').doc(data.adminId).get();
            if (adminDoc.exists) {
              adminEmail = adminDoc.data()?.email;
            }
          } catch (error) {
            // Ignore errors fetching admin email
          }

          return {
            id: doc.id,
            ...data,
            adminEmail,
          };
        })
      );

      return res.status(200).json({ actions });
    } catch (error: any) {
      console.error('Error fetching audit log:', error);
      return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}









