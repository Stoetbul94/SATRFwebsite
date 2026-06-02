import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdminFromToken } from '@/lib/admin';
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';

/**
 * PUT /api/admin/users/[id]/status
 * Body: { status: 'active' | 'rejected' | 'suspended' | 'pending' }
 *
 * Sets the member's approval status AND syncs the Firebase Auth account:
 * only 'active' members are enabled; everyone else is disabled and cannot
 * sign in. This is what makes the registration → approval gate work.
 */
const VALID = ['active', 'rejected', 'suspended', 'pending'] as const;
type Status = (typeof VALID)[number];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized: No token provided' });

  const { isAdmin, userId: adminId } = await verifyAdminFromToken(token);
  if (!isAdmin) return res.status(403).json({ error: 'Forbidden: Admin access required' });

  const { id } = req.query;
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Invalid user ID' });
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

  const status = req.body?.status as Status;
  if (!VALID.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${VALID.join(', ')}` });
  }

  try {
    const db = getAdminDb();
    const userRef = db.collection('users').doc(id);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });

    const enabled = status === 'active';

    // Sync the Firebase Auth account (enable only when active).
    try {
      await getAdminAuth().updateUser(id, { disabled: !enabled });
    } catch (authErr: any) {
      // Don't fail the whole request if the auth record is missing; log it.
      console.warn(`Could not update auth disabled flag for ${id}:`, authErr.message);
    }

    await userRef.update({
      status,
      isActive: enabled,
      ...(enabled ? { approvedBy: adminId, approvedAt: new Date().toISOString() } : {}),
      updatedAt: new Date().toISOString(),
    });

    await db.collection('adminActions').add({
      adminId,
      action: `set_status_${status}`,
      targetId: id,
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({ success: true, message: `Status set to ${status}` });
  } catch (error: any) {
    console.error('Error updating user status:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
