import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdminFromToken } from '@/lib/admin';
import { getAdminDb } from '@/lib/firebaseAdmin';
import {
  findLinkedRegistrationsForMember,
  findLinkedScoresForMember,
  memberProfileFromUserDoc,
} from '@/lib/memberLink';

/**
 * GET /api/admin/users/[id]/linked-scores — read-only list of scores & registrations linked to member
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const { isAdmin } = await verifyAdminFromToken(token);
  if (!isAdmin) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(id).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const userData = userDoc.data() as Record<string, unknown>;
    const member = memberProfileFromUserDoc(id, userData);

    const [scores, registrations] = await Promise.all([
      findLinkedScoresForMember(db, id),
      findLinkedRegistrationsForMember(db, id),
    ]);

    return res.status(200).json({
      memberId: id,
      memberName: `${member.firstName} ${member.lastName}`.trim(),
      scores,
      registrations,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('linked-scores error:', error);
    return res.status(500).json({ error: 'Internal server error', details: message });
  }
}
