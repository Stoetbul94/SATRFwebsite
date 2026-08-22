import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdminFromToken } from '@/lib/admin';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { prefillCallForEntriesData } from '@/lib/eventDocuments/callForEntries/prefill';
import type { CallForEntriesData } from '@/lib/eventDocuments/callForEntries/types';
import { readOptionalEventFields } from '@/lib/eventDocuments/eventFields';
import { listDocumentsForEvent } from '@/lib/eventDocuments/repository';
import { isDocumentStale } from '@/lib/eventDocuments/staleCheck';
import { serializeEventDoc } from '@/lib/firestoreEvents';

async function loadEventsById(db: ReturnType<typeof getAdminDb>, eventIds: string[]) {
  const eventsById: Record<string, Record<string, unknown>> = {};
  const updatedAtById: Record<string, string | null> = {};

  await Promise.all(
    eventIds.map(async (eventId) => {
      const doc = await db.collection('events').doc(eventId).get();
      if (!doc.exists) return;
      const data = doc.data() as Record<string, unknown>;
      eventsById[eventId] = data;
      updatedAtById[eventId] = serializeEventDoc(eventId, data).updatedAt;
    }),
  );

  return { eventsById, updatedAtById };
}

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
    return res.status(400).json({ error: 'Invalid event ID' });
  }

  try {
    const db = getAdminDb();
    const eventDoc = await db.collection('events').doc(id).get();
    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (req.method === 'GET') {
      const eventData = eventDoc.data() as Record<string, unknown>;
      const documents = await listDocumentsForEvent(db, id, { includeDrafts: true });
      const linkedIds = new Set<string>([id]);
      documents.forEach((doc) => doc.linkedEventIds.forEach((linkedId) => linkedIds.add(linkedId)));

      const { updatedAtById } = await loadEventsById(db, Array.from(linkedIds));
      const adminDocuments = documents.map((doc) => ({
        ...doc,
        stale: isDocumentStale(doc, updatedAtById),
      }));

      const selectableEventsSnap = await db
        .collection('events')
        .orderBy('date', 'desc')
        .limit(100)
        .get();

      const selectableEvents = selectableEventsSnap.docs.map((doc) => {
        const serialized = serializeEventDoc(doc.id, doc.data() as Record<string, unknown>);
        return {
          id: serialized.id,
          title: serialized.title,
          date: serialized.date,
          location: serialized.location,
        };
      });

      return res.status(200).json({
        eventId: id,
        eventTitle: String(eventData.title || ''),
        event: {
          ...serializeEventDoc(id, eventData),
          ...readOptionalEventFields(eventData),
        },
        documents: adminDocuments,
        selectableEvents,
      });
    }

    if (req.method === 'POST') {
      const body = (req.body ?? {}) as {
        action?: string;
        linkedEventIds?: string[];
        data?: CallForEntriesData;
      };

      if (body.action === 'prefill') {
        const linkedEventIds = Array.isArray(body.linkedEventIds)
          ? body.linkedEventIds.filter((item): item is string => typeof item === 'string' && item.length > 0)
          : [id];

        if (!linkedEventIds.includes(id)) linkedEventIds.unshift(id);

        const { eventsById } = await loadEventsById(db, linkedEventIds);
        const missing = linkedEventIds.filter((eventId) => !eventsById[eventId]);
        if (missing.length) {
          return res.status(400).json({ error: `Unknown event IDs: ${missing.join(', ')}` });
        }

        const prefill = prefillCallForEntriesData({ linkedEventIds, eventsById });
        return res.status(200).json({ prefill });
      }

      return res.status(400).json({ error: 'Unknown action' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Admin event documents error:', error);
    return res.status(500).json({ error: 'Internal server error', details: message });
  }
}
