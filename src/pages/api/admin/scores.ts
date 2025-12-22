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
      let query: FirebaseFirestore.Query = db.collection('scores');

      // Apply filters
      const { status, search } = req.query;
      if (status && status !== 'all') {
        query = query.where('status', '==', status);
      }

      const snapshot = await query.orderBy('createdAt', 'desc').limit(1000).get();
      let scores = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as any[];

      // Apply search filter if provided
      if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        scores = scores.filter((score: any) => 
          score.userName?.toLowerCase().includes(searchLower) ||
          score.club?.toLowerCase().includes(searchLower) ||
          score.discipline?.toLowerCase().includes(searchLower)
        );
      }

      return res.status(200).json({ scores });
    } catch (error: any) {
      console.error('Error fetching scores:', error);
      return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}


