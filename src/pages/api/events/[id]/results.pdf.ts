import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdminFromToken } from '@/lib/admin';
import { buildResultsPdfFilename, generateEventResultsPdf } from '@/lib/eventResultsPdf';
import { getAdminDb } from '@/lib/firebaseAdmin';
import {
  DISCIPLINES,
  availableDisciplinesFromScores,
  buildEventResultBoard,
  defaultDisciplineFromAvailable,
} from '@/lib/issf';
import type { Category, Discipline, Score } from '@/types/scores';

type ScoreDoc = Score & { deleted?: boolean };

const VALID_CATEGORIES: Category[] = ['open', 'junior', 'veteran', 'ladies'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Event ID is required' });
  }

  const disciplineParam = req.query.discipline as string | undefined;
  const categoryParam = req.query.category as string | undefined;
  const category =
    categoryParam && categoryParam !== 'all' && VALID_CATEGORIES.includes(categoryParam as Category)
      ? (categoryParam as Category)
      : 'all';

  const token = req.headers.authorization?.replace('Bearer ', '') ?? '';
  let isAdmin = false;
  if (token) {
    try {
      const verified = await verifyAdminFromToken(token);
      isAdmin = verified.isAdmin;
    } catch {
      isAdmin = false;
    }
  }
  const includeProvisional = isAdmin && req.query.includeProvisional === 'true';

  try {
    const db = getAdminDb();

    const eventSnap = await db.collection('events').doc(id).get();
    if (!eventSnap.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }
    const eventData = eventSnap.data() as { title?: string; name?: string; date?: string };

    const allForEvent = await db.collection('scores').where('eventId', '==', id).get();
    const allDocs: ScoreDoc[] = allForEvent.docs.map((doc) => ({
      ...(doc.data() as Score),
      id: doc.id,
    }));

    const availableDisciplines = availableDisciplinesFromScores(allDocs, { includeProvisional });
    const defaultDiscipline = defaultDisciplineFromAvailable(availableDisciplines);

    let discipline: Discipline;
    if (disciplineParam && DISCIPLINES[disciplineParam as Discipline]) {
      discipline = disciplineParam as Discipline;
    } else if (disciplineParam) {
      return res.status(400).json({ error: `Unknown discipline: ${disciplineParam}` });
    } else {
      discipline = defaultDiscipline;
    }

    const docs: ScoreDoc[] = allDocs.filter((d) => d.discipline === discipline);

    const board = buildEventResultBoard(docs, discipline, {
      includeProvisional,
      category,
    });

    const sampleDate = docs.find((d) => d.date)?.date ?? allDocs.find((d) => d.date)?.date;
    const eventName = eventData.title || eventData.name || 'Event';

    const pdf = await generateEventResultsPdf({
      eventName,
      date: sampleDate,
      discipline,
      category,
      hasFinal: board.hasFinal,
      qualification: board.qualification,
      final: board.final,
    });

    const filename = buildResultsPdfFilename(eventName, discipline);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdf);
  } catch (error: unknown) {
    console.error('event results PDF error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: 'Internal server error', details: message });
  }
}
