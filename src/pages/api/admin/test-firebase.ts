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

  try {
    const { initializeApp, getApps, cert, applicationDefault } = await import('firebase-admin/app');
    const { getFirestore } = await import('firebase-admin/firestore');

    const results: any = {
      timestamp: new Date().toISOString(),
      checks: {},
    };

    // Check initialization
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
          results.checks.initialization = 'success (service account)';
        } else {
          try {
            initializeApp({
              credential: applicationDefault(),
              projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'satrf-website',
            });
            results.checks.initialization = 'success (application default)';
          } catch {
            initializeApp({
              projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'satrf-website',
            });
            results.checks.initialization = 'success (no credentials - may fail writes)';
          }
        }
      } catch (error: any) {
        results.checks.initialization = `failed: ${error.message}`;
        return res.status(500).json(results);
      }
    } else {
      results.checks.initialization = 'already initialized';
    }

    // Test Firestore connection
    try {
      const db = getFirestore();
      results.checks.firestore = 'connected';
      
      // Test read
      const testRead = await db.collection('events').limit(1).get();
      results.checks.read = `success (${testRead.size} docs)`;
      
      // Test write (create a test document then delete it)
      const testDoc = await db.collection('events').add({
        _test: true,
        timestamp: new Date().toISOString(),
      });
      results.checks.write = `success (created doc ${testDoc.id})`;
      
      // Clean up test document
      await db.collection('events').doc(testDoc.id).delete();
      results.checks.cleanup = 'success';
      
      results.status = 'all checks passed';
      return res.status(200).json(results);
    } catch (firestoreError: any) {
      results.checks.firestore = `error: ${firestoreError.message}`;
      results.checks.firestoreCode = firestoreError.code;
      return res.status(500).json(results);
    }
  } catch (error: any) {
    return res.status(500).json({
      error: 'Test failed',
      details: error.message,
      stack: error.stack,
    });
  }
}








