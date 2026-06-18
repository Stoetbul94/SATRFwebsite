import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { requireContentEditorFromRequest } from '@/lib/contentEditor';
import {
  createInsightDraft,
  listInsightsForAdmin,
  type InsightWriteInput,
} from '@/lib/insightsServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const editor = await requireContentEditorFromRequest(req.headers.authorization);
  if (editor.error) {
    return res.status(editor.error.status).json({ error: editor.error.message });
  }

  const db = getAdminDb();

  if (req.method === 'GET') {
    try {
      const insights = await listInsightsForAdmin(db);
      return res.status(200).json({ insights });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('admin insights GET error:', error);
      return res.status(500).json({ error: 'Failed to list insights', details: message });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = (req.body ?? {}) as InsightWriteInput;
      const insight = await createInsightDraft(
        db,
        { userId: editor.userId!, email: editor.email! },
        body
      );
      return res.status(201).json({ insight });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('admin insights POST error:', error);
      return res.status(500).json({ error: 'Failed to create insight', details: message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
