import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdminFromToken } from '@/lib/admin';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { resolveMemberByEmail, serializeRegistrationDoc } from '@/lib/registrations';

/**
 * GET /api/admin/events/[id]/registrations
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const { isAdmin } = await verifyAdminFromToken(token);
  if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid event ID' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = getAdminDb();
    const eventDoc = await db.collection('events').doc(id).get();
    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const snap = await db
      .collection('registrations')
      .where('eventId', '==', id)
      .where('status', '==', 'registered')
      .get();

    const registrations = snap.docs
      .map((doc) => serializeRegistrationDoc(doc.id, doc.data() as Record<string, unknown>))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Re-resolve member status live for display
    const enriched = await Promise.all(
      registrations.map(async (reg) => {
        if (reg.isMember && reg.memberId) return reg;
        const member = await resolveMemberByEmail(db, reg.email);
        return {
          ...reg,
          isMember: member.isMember || reg.isMember,
          memberId: reg.memberId || member.memberId,
        };
      })
    );

    const members = enriched.filter((r) => r.isMember).length;
    const guests = enriched.length - members;
    const eventData = eventDoc.data() as Record<string, unknown>;

    return res.status(200).json({
      eventId: id,
      eventTitle: String(eventData.title || ''),
      maxParticipants: Number(eventData.maxParticipants) || 0,
      registrations: enriched,
      summary: {
        total: enriched.length,
        members,
        guests,
        paid: enriched.filter((r) => r.paid).length,
        unpaid: enriched.filter((r) => !r.paid).length,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Admin registrations error:', error);
    return res.status(500).json({ error: 'Internal server error', details: message });
  }
}
