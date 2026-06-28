import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdminFromToken } from '@/lib/admin';
import { getAdminDb } from '@/lib/firebaseAdmin';
import {
  findLinkedRegistrationsForMember,
  findLinkedScoresForMember,
  findUnlinkedRegistrationsForMember,
  findUnlinkedScoresForMember,
  linkRegistrationsByEmail,
  linkScoresToMember,
  memberProfileFromUserDoc,
} from '@/lib/memberLink';

/**
 * GET  /api/admin/users/[id]/link-history — preview linkable scores & registrations
 * POST /api/admin/users/[id]/link-history — apply links to member profile
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

  try {
    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(id).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const userData = userDoc.data() as Record<string, unknown>;
    const status = String(userData.status || (userData.isActive === false ? 'suspended' : 'active'));
    if (status !== 'active') {
      return res.status(400).json({ error: 'Only active members can be linked to historical data' });
    }

    const member = memberProfileFromUserDoc(id, userData);

    if (req.method === 'GET') {
      const [scores, registrations, linkedScores, linkedRegistrations] = await Promise.all([
        findUnlinkedScoresForMember(db, member),
        findUnlinkedRegistrationsForMember(db, member),
        findLinkedScoresForMember(db, id),
        findLinkedRegistrationsForMember(db, id),
      ]);

      return res.status(200).json({
        memberId: id,
        memberName: `${member.firstName} ${member.lastName}`.trim(),
        scoreCount: scores.length,
        registrationCount: registrations.length,
        scores,
        registrations,
        linkedScoreCount: linkedScores.length,
        linkedRegistrationCount: linkedRegistrations.length,
        linkedScores,
        linkedRegistrations,
      });
    }

    if (req.method === 'POST') {
      const [scores, registrations] = await Promise.all([
        findUnlinkedScoresForMember(db, member),
        findUnlinkedRegistrationsForMember(db, member),
      ]);

      const scoresLinked = await linkScoresToMember(
        db,
        id,
        scores.map((s) => s.id)
      );
      const registrationsLinked = member.email
        ? await linkRegistrationsByEmail(db, id, member.email)
        : 0;

      if (adminUid) {
        await db.collection('adminActions').add({
          adminId: adminUid,
          action: 'link_member_history',
          targetId: id,
          details: {
            scoresLinked,
            registrationsLinked,
            scoreIds: scores.map((s) => s.id),
            registrationIds: registrations.map((r) => r.id),
          },
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(200).json({
        success: true,
        scoresLinked,
        registrationsLinked,
        message: `Linked ${scoresLinked} score(s) and ${registrationsLinked} registration(s).`,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('link-history error:', error);
    return res.status(500).json({ error: 'Internal server error', details: message });
  }
}
