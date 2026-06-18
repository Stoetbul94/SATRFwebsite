import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { requireContentEditorFromRequest } from '@/lib/contentEditor';
import {
  deleteInsight,
  getInsightById,
  updateInsight,
  type InsightWriteInput,
} from '@/lib/insightsServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const editor = await requireContentEditorFromRequest(req.headers.authorization);
  if (editor.error) {
    return res.status(editor.error.status).json({ error: editor.error.message });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid insight ID' });
  }

  const db = getAdminDb();

  if (req.method === 'GET') {
    try {
      const insight = await getInsightById(db, id);
      if (!insight) return res.status(404).json({ error: 'Insight not found' });
      return res.status(200).json({ insight });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: 'Failed to load insight', details: message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const body = (req.body ?? {}) as InsightWriteInput;
      const insight = await updateInsight(db, id, body);
      if (!insight) return res.status(404).json({ error: 'Insight not found' });
      return res.status(200).json({ insight });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const status = message.includes('Slug is already') ? 409 : 500;
      return res.status(status).json({ error: message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const deleted = await deleteInsight(db, id);
      if (!deleted) return res.status(404).json({ error: 'Insight not found' });
      return res.status(200).json({ success: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: 'Failed to delete insight', details: message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
