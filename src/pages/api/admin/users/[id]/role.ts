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
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { role } = req.body;
    if (!role || !['user', 'admin', 'event_scorer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
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
    const userRef = db.collection('users').doc(id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update role (set both flat and nested structure for compatibility)
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };
    
    if (role === 'admin') {
      updateData.role = 'admin';
      updateData['roles.admin'] = true;
    } else {
      updateData.role = role;
      // Clear nested admin if not admin
      updateData['roles.admin'] = false;
    }
    
    await userRef.update(updateData);

    // Log admin action
    await db.collection('adminActions').add({
      adminId: userId,
      action: 'change_user_role',
      targetId: id,
      details: { role, previousRole: userDoc.data()?.role },
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({ success: true, message: 'User role updated successfully' });
  } catch (error: any) {
    console.error('Error updating user role:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

