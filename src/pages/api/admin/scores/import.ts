import { NextApiRequest, NextApiResponse } from 'next';

interface ScoreData {
  eventName: string;
  matchNumber: string;
  shooterName: string;
  club: string;
  division: string;
  veteran: boolean;
  series1: number;
  series2: number;
  series3: number;
  series4: number;
  series5: number;
  series6: number;
  total: number;
  place?: number;
}

interface ImportRequest {
  scores: ScoreData[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // TODO: Add admin authentication check here
    // const token = req.headers.authorization?.replace('Bearer ', '');
    // if (!token || !isAdmin(token)) {
    //   return res.status(401).json({ error: 'Unauthorized' });
    // }

    const { scores }: ImportRequest = req.body;

    if (!scores || !Array.isArray(scores) || scores.length === 0) {
      return res.status(400).json({ error: 'No scores provided' });
    }

    // Validate all scores
    const validationErrors: string[] = [];
    const validScores: ScoreData[] = [];

    scores.forEach((score, index) => {
      const errors: string[] = [];

      // Required fields
      if (!score.eventName) errors.push('Missing event name');
      if (!score.matchNumber) errors.push('Missing match number');
      if (!score.shooterName) errors.push('Missing shooter name');
      if (!score.club) errors.push('Missing club');
      if (!score.division) errors.push('Missing division');

      // Validate series scores
      const series = [score.series1, score.series2, score.series3, score.series4, score.series5, score.series6];
      series.forEach((s, i) => {
        if (s < 0 || s > 109 || !Number.isFinite(s)) {
          errors.push(`Series ${i + 1} score must be between 0 and 109`);
        }
      });

      // Validate total
      const calculatedTotal = series.reduce((sum, s) => sum + s, 0);
      if (Math.abs(calculatedTotal - score.total) > 0.1) {
        errors.push('Total score doesn\'t match sum of series');
      }

      if (errors.length > 0) {
        validationErrors.push(`Row ${index + 1}: ${errors.join(', ')}`);
      } else {
        validScores.push(score);
      }
    });

    if (validScores.length === 0) {
      return res.status(400).json({ 
        error: 'No valid scores to import',
        details: validationErrors 
      });
    }

    // TODO: Send to backend API
    // This would typically call your backend API to save the scores
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'}/v1/admin/scores/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ADMIN_API_TOKEN || ''}`,
      },
      body: JSON.stringify({ scores: validScores }),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      throw new Error(errorData.error || 'Backend import failed');
    }

    const result = await backendResponse.json();

    return res.status(200).json({
      success: true,
      message: `Successfully imported ${validScores.length} scores`,
      imported: validScores.length,
      errors: validationErrors.length,
      errorDetails: validationErrors,
      backendResult: result,
    });

  } catch (error) {
    console.error('Score import error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 