import type { NextApiRequest, NextApiResponse } from 'next';
import { requireContentEditorFromRequest } from '@/lib/contentEditor';
import { uploadInsightInlineImage } from '@/lib/insightImageUpload';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '6mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const editor = await requireContentEditorFromRequest(req.headers.authorization);
  if (editor.error) {
    return res.status(editor.error.status).json({ error: editor.error.message });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid insight ID' });
  }

  const { imageBase64, contentType } = req.body ?? {};
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return res.status(400).json({ error: 'imageBase64 is required' });
  }

  try {
    const imageUrl = await uploadInsightInlineImage(id, imageBase64, contentType);
    return res.status(200).json({ success: true, imageUrl });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Insight inline upload error:', error);
    return res.status(500).json({ error: 'Failed to upload image', details: message });
  }
}
