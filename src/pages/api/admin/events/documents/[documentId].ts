import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdminFromToken } from '@/lib/admin';
import { getAdminDb } from '@/lib/firebaseAdmin';
import {
  archiveEventDocument,
  deleteDraftEventDocument,
  getEventDocument,
  publishEventDocument,
  regenerateCallForEntriesDraft,
} from '@/lib/eventDocuments/repository';
import {
  validateCallForEntriesData,
  prefillCallForEntriesData,
} from '@/lib/eventDocuments/callForEntries/prefill';
import type { CallForEntriesData } from '@/lib/eventDocuments/callForEntries/types';
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

  const { documentId } = req.query;
  if (!documentId || typeof documentId !== 'string') {
    return res.status(400).json({ error: 'Invalid document ID' });
  }

  try {
    const db = getAdminDb();
    const existing = await getEventDocument(db, documentId);
    if (!existing) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (req.method === 'POST') {
      const action = typeof req.body?.action === 'string' ? req.body.action : 'publish';

      if (action === 'publish') {
        const document = await publishEventDocument(db, documentId);
        if (userId) {
          await db.collection('adminActions').add({
            adminId: userId,
            action: 'publish_event_document',
            targetId: documentId,
            details: { version: document.version },
            timestamp: new Date().toISOString(),
          });
        }
        return res.status(200).json({ document });
      }

      if (action === 'archive') {
        const document = await archiveEventDocument(db, documentId);
        if (userId) {
          await db.collection('adminActions').add({
            adminId: userId,
            action: 'archive_event_document',
            targetId: documentId,
            details: { version: document.version },
            timestamp: new Date().toISOString(),
          });
        }
        return res.status(200).json({ document });
      }

      if (action === 'regenerate') {
        const body = (req.body ?? {}) as CallForEntriesData;
        const linkedEventIds = existing.linkedEventIds;
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

        const document = await regenerateCallForEntriesDraft({
          db,
          documentId,
          data,
          linkedEventUpdatedAt,
        });

        return res.status(200).json({ document });
      }

      return res.status(400).json({ error: 'Unknown action' });
    }

    if (req.method === 'DELETE') {
      await deleteDraftEventDocument(db, documentId);
      if (userId) {
        await db.collection('adminActions').add({
          adminId: userId,
          action: 'delete_event_document_draft',
          targetId: documentId,
          timestamp: new Date().toISOString(),
        });
      }
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Event document action error:', error);
    return res.status(500).json({ error: 'Internal server error', details: message });
  }
}
