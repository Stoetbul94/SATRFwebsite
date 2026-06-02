import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdminFromToken } from '@/lib/admin';
import { parsePronePdfBuffer } from '@/lib/pdfImport/extractText';
import type { PdfReportType } from '@/lib/pdfImport/types';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '12mb',
    },
  },
};

const MAX_BYTES = 10 * 1024 * 1024;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { isAdmin } = await verifyAdminFromToken(token);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const reportType = req.body?.reportType as PdfReportType;
    if (reportType !== 'summary' && reportType !== 'target') {
      return res.status(400).json({ error: 'reportType must be "summary" or "target"' });
    }

    const pdfBase64 = req.body?.pdfBase64;
    if (!pdfBase64 || typeof pdfBase64 !== 'string') {
      return res.status(400).json({ error: 'pdfBase64 is required' });
    }

    const buffer = Buffer.from(pdfBase64, 'base64');
    if (buffer.length > MAX_BYTES) {
      return res.status(400).json({ error: 'PDF exceeds 10MB limit' });
    }
    if (buffer.length < 100) {
      return res.status(400).json({ error: 'Invalid PDF data' });
    }

    const parsed = await parsePronePdfBuffer(buffer, reportType);

    if (parsed.series.length === 0) {
      return res.status(422).json({
        error: 'Could not read series from PDF',
        warnings: parsed.warnings,
        reportType: parsed.reportType,
      });
    }

    return res.status(200).json({
      success: true,
      ...parsed,
      ready: parsed.series.length >= 6,
    });
  } catch (error) {
    console.error('parse-pdf error:', error);
    return res.status(500).json({
      error: 'Failed to parse PDF',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
