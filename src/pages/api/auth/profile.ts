import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb, verifyRequestUser } from '@/lib/firebaseAdmin';
import { mapUserDoc } from '@/lib/auth';

/**
 * GET /api/auth/profile
 * Returns the signed-in user's Firestore profile using the Admin SDK.
 * Avoids client-side Firestore permission/timing issues after login.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const verified = await verifyRequestUser(req.headers.authorization);
  if (!verified) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const doc = await getAdminDb().collection('users').doc(verified.uid).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    let profile = mapUserDoc(verified.uid, doc.data()!);

    // Env allowlist is a fallback if Firestore was edited incorrectly in the console.
    const allowlist =
      process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim().toLowerCase()) || [];
    if (verified.email && allowlist.includes(verified.email) && profile.role !== 'admin') {
      profile = { ...profile, role: 'admin', status: 'active', isActive: true };
    }

    return res.status(200).json({ profile });
  } catch (error: any) {
    console.error('profile API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
