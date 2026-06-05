import type { NextApiRequest, NextApiResponse } from 'next';
import { Timestamp } from 'firebase-admin/firestore';
import { verifyAdminFromToken } from '@/lib/admin';
import { getAdminDb } from '@/lib/firebaseAdmin';
import {
  disciplinesToLegacyType,
  isValidEventDiscipline,
  parseEntryFee,
  parseEventDisciplines,
} from '@/lib/eventDisciplines';
import type { Discipline } from '@/types/scores';

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
    const eventRef = db.collection('events').doc(id);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (req.method === 'PUT') {
      const body = (req.body ?? {}) as Record<string, unknown>;
      const existing = eventDoc.data() as Record<string, unknown>;
      const errors: string[] = [];
      const updates: Record<string, unknown> = {
        updatedAt: Timestamp.now(),
      };

      if (body.title !== undefined) {
        const title = String(body.title).trim();
        if (!title) errors.push('Title is required');
        else updates.title = title;
      }

      if (body.location !== undefined) {
        const location = String(body.location).trim();
        if (!location) errors.push('Location is required');
        else updates.location = location;
      }

      if (body.date !== undefined) {
        let eventDate = body.date;
        if (typeof eventDate === 'string' && !eventDate.includes('T')) {
          eventDate = `${eventDate}T00:00:00Z`;
        }
        const dateObj = new Date(eventDate as string);
        if (isNaN(dateObj.getTime())) errors.push('Invalid date');
        else updates.date = Timestamp.fromDate(dateObj);
      }

      if (body.disciplines !== undefined || body.type !== undefined) {
        let disciplines: Discipline[] = [];
        if (Array.isArray(body.disciplines)) {
          disciplines = body.disciplines.filter(
            (d): d is Discipline => typeof d === 'string' && isValidEventDiscipline(d)
          );
        } else if (body.type !== undefined) {
          disciplines = parseEventDisciplines({ type: body.type });
        }
        if (disciplines.length === 0) errors.push('At least one discipline is required');
        else {
          updates.disciplines = disciplines;
          updates.type = disciplinesToLegacyType(disciplines);
        }
      }

      if (body.price !== undefined) {
        const price = parseEntryFee(body.price);
        if (price == null) errors.push('Entry fee is required (must be 0 or greater)');
        else updates.price = price;
      }

      const nextImageUrl =
        (typeof body.imageUrl === 'string' && body.imageUrl.trim()) ||
        (typeof existing.imageUrl === 'string' && existing.imageUrl) ||
        (typeof existing.imageURL === 'string' && existing.imageURL) ||
        null;

      if (body.imageUrl !== undefined) {
        if (!nextImageUrl) errors.push('Event image is required');
        else updates.imageUrl = nextImageUrl;
      }

      if (errors.length > 0) {
        return res.status(400).json({ error: errors.join('; ') });
      }

      if (body.description !== undefined) updates.description = body.description;
      if (body.status !== undefined) updates.status = body.status;
      if (body.maxParticipants !== undefined) {
        updates.maxParticipants = body.maxParticipants ? parseInt(String(body.maxParticipants), 10) : null;
      }
      if (body.payfastUrl !== undefined) updates.payfastUrl = body.payfastUrl || null;
      if (body.eftInstructions !== undefined) updates.eftInstructions = body.eftInstructions || null;

      await eventRef.update(updates);

      if (userId) {
        await db.collection('adminActions').add({
          adminId: userId,
          action: 'update_event',
          targetId: id,
          details: updates,
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(200).json({ success: true, message: 'Event updated successfully' });
    }

    if (req.method === 'DELETE') {
      await eventRef.update({
        status: 'closed',
        archived: true,
        archivedAt: new Date().toISOString(),
        archivedBy: userId,
      });

      if (userId) {
        await db.collection('adminActions').add({
          adminId: userId,
          action: 'archive_event',
          targetId: id,
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(200).json({ success: true, message: 'Event archived successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error handling event:', error);
    return res.status(500).json({ error: 'Internal server error', details: message });
  }
}
