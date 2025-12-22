import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdminFromToken, isEmailAdmin } from '@/lib/admin';

/**
 * Auto-promote endpoint for whitelisted emails
 * This allows users with whitelisted emails to promote themselves to admin
 * without needing existing admin access
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    // Verify the token and get user info
    const { isAdmin, userId, email } = await verifyAdminFromToken(token);
    
    // Check if email is whitelisted (even if not admin yet)
    if (!email || !isEmailAdmin(email)) {
      return res.status(403).json({ 
        error: 'Forbidden: Your email is not in the admin whitelist' 
      });
    }

    // If already admin, just return success
    if (isAdmin) {
      return res.status(200).json({ 
        success: true, 
        message: 'You are already an admin',
        alreadyAdmin: true
      });
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
        return res.status(500).json({ error: 'Failed to initialize Firebase Admin' });
      }
    }

    const db = getFirestore();
    
    // Find user by email if userId not available
    let userRef;
    if (userId) {
      userRef = db.collection('users').doc(userId);
    } else {
      // Find by email
      const usersSnapshot = await db.collection('users')
        .where('email', '==', email.toLowerCase())
        .limit(1)
        .get();
      
      if (usersSnapshot.empty) {
        return res.status(404).json({ error: 'User not found in Firestore' });
      }
      
      userRef = db.collection('users').doc(usersSnapshot.docs[0].id);
    }

    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update role to admin (set both flat and nested structure for compatibility)
    await userRef.update({
      role: 'admin',
      'roles.admin': true,
      updatedAt: new Date().toISOString(),
    });

    // Log admin action (self-promotion)
    await db.collection('adminActions').add({
      adminId: userRef.id,
      action: 'self_promote_admin',
      targetId: userRef.id,
      details: { email, method: 'email-whitelist' },
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Admin role granted successfully',
      userId: userRef.id
    });
  } catch (error: any) {
    console.error('Error auto-promoting user:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}

