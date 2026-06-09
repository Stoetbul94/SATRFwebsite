import type { NextApiRequest, NextApiResponse } from 'next';
import { Timestamp } from 'firebase-admin/firestore';
import { verifyAdminFromToken } from '@/lib/admin';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { resolveMemberByEmail, serializeRegistrationDoc, syncEventRegistrationCount } from '@/lib/registrations';

/**
 * PATCH /api/admin/registrations/[id]
 * Body: { paid?: boolean, memberId?: string | null, status?: 'registered' | 'cancelled' }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const { isAdmin, userId } = await verifyAdminFromToken(token);
  if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid registration ID' });
  }

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = getAdminDb();
    const ref = db.collection('registrations').doc(id);
    const doc = await ref.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const updates: Record<string, unknown> = { updatedAt: Timestamp.now() };

    if (typeof body.paid === 'boolean') {
      updates.paid = body.paid;
    }

    if (body.memberId !== undefined) {
      if (body.memberId === null || body.memberId === '') {
        updates.memberId = null;
        updates.isMember = false;
      } else if (typeof body.memberId === 'string') {
        const memberDoc = await db.collection('users').doc(body.memberId).get();
        if (!memberDoc.exists) {
          return res.status(400).json({ error: 'Member not found' });
        }
        updates.memberId = body.memberId;
        updates.isMember = true;
      }
    }

    if (body.status === 'cancelled' || body.status === 'registered') {
      updates.status = body.status;
    }

    await ref.update(updates);

    const eventId = String((doc.data() as Record<string, unknown>).eventId || '');
    if (eventId) {
      await syncEventRegistrationCount(db, eventId);
    }

    if (userId) {
      await db.collection('adminActions').add({
        adminId: userId,
        action: 'update_registration',
        targetId: id,
        details: updates,
        timestamp: new Date().toISOString(),
      });
    }

    const updated = await ref.get();
    return res.status(200).json({
      success: true,
      registration: serializeRegistrationDoc(updated.id, updated.data() as Record<string, unknown>),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Update registration error:', error);
    return res.status(500).json({ error: 'Internal server error', details: message });
  }
}
