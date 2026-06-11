import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdminFromToken } from '@/lib/admin';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { isUserAdmin } from '@/lib/userRole';

/**
 * PUT /api/admin/users/[id]/athlete
 * Toggle athlete dashboard access for admin users only.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const { isAdmin, userId: adminUid } = await verifyAdminFromToken(token);
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
    const { isAthlete } = req.body as { isAthlete?: unknown };
    if (typeof isAthlete !== 'boolean') {
      return res.status(400).json({ error: 'isAthlete must be a boolean' });
    }

    const db = getAdminDb();
    const userRef = db.collection('users').doc(id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const data = userDoc.data()!;
    if (!isUserAdmin(data)) {
      return res.status(400).json({
        error: 'Athlete dashboard flag applies only to admin accounts',
      });
    }

    const previous = data.isAthlete === true;

    await userRef.update({
      isAthlete,
      updatedAt: new Date().toISOString(),
    });

    await db.collection('adminActions').add({
      adminId: adminUid,
      action: 'change_user_athlete_flag',
      targetId: id,
      details: { isAthlete, previousIsAthlete: previous },
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      message: 'Athlete dashboard access updated',
      isAthlete,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating athlete flag:', error);
    return res.status(500).json({ error: 'Internal server error', details: message });
  }
}
