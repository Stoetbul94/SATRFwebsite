import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdminFromToken } from '@/lib/admin';
import { getAdminDb } from '@/lib/firebaseAdmin';
import {
  validateCallForEntriesData,
  prefillCallForEntriesData,
} from '@/lib/eventDocuments/callForEntries/prefill';
import type { CallForEntriesData } from '@/lib/eventDocuments/callForEntries/types';
import { renderCallForEntriesPreviewHtml } from '@/lib/eventDocuments/callForEntries/htmlPreview';
import { createCallForEntriesDraft } from '@/lib/eventDocuments/repository';
import { serializeEventDoc } from '@/lib/firestoreEvents';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
    return res.status(400).json({ error: 'Invalid event ID' });
  }

  try {
    const db = getAdminDb();
    const eventDoc = await db.collection('events').doc(id).get();
    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const body = (req.body ?? {}) as CallForEntriesData & { action?: string };

    if (req.method === 'POST' && body.action === 'preview') {
      const errors = validateCallForEntriesData(body);
      if (errors.length) return res.status(400).json({ error: errors.join('; ') });
      return res.status(200).json({ html: renderCallForEntriesPreviewHtml(body) });
    }

    if (req.method === 'POST') {
      const linkedEventIds = Array.isArray(body.linkedEventIds)
        ? body.linkedEventIds.filter((item): item is string => typeof item === 'string' && item.length > 0)
        : [id];

      if (!linkedEventIds.includes(id)) linkedEventIds.unshift(id);

      const eventsById: Record<string, Record<string, unknown>> = {};
      const linkedEventUpdatedAt: Record<string, string | null | undefined> = {};

      for (const eventId of linkedEventIds) {
        const doc = await db.collection('events').doc(eventId).get();
        if (!doc.exists) {
          return res.status(400).json({ error: `Event not found: ${eventId}` });
        }
        const data = doc.data() as Record<string, unknown>;
        eventsById[eventId] = data;
        linkedEventUpdatedAt[eventId] = serializeEventDoc(eventId, data).updatedAt;
      }

      const data = prefillCallForEntriesData({
        linkedEventIds,
        eventsById,
        overrides: body,
      });

      const errors = validateCallForEntriesData(data);
      if (errors.length) return res.status(400).json({ error: errors.join('; ') });

      const document = await createCallForEntriesDraft({
        db,
        data,
        createdBy: userId,
        linkedEventUpdatedAt,
      });

      if (userId) {
        await db.collection('adminActions').add({
          adminId: userId,
          action: 'create_call_for_entries_draft',
          targetId: document.id,
          details: { eventId: id, linkedEventIds },
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(201).json({ document });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Call for entries generate error:', error);
    return res.status(500).json({ error: 'Internal server error', details: message });
  }
}
