import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdminFromToken } from '@/lib/admin';

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
    // Check admin authentication
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    // Verify admin role using multiple methods (with fallbacks)
    const { isAdmin, email: userEmail, method } = await verifyAdminFromToken(token);
    
    if (isAdmin && method) {
      console.log(`Admin verified via ${method}:`, userEmail);
    }

    // Final check: If still not admin, deny access
    if (!isAdmin) {
      return res.status(403).json({ 
        error: 'Forbidden: Admin access required',
        details: 'Your account does not have admin privileges. Please contact an administrator to request access.'
      });
    }

    const { scores }: ImportRequest = req.body;

    if (!scores || !Array.isArray(scores) || scores.length === 0) {
      return res.status(400).json({ error: 'No scores provided' });
    }

    // Enhanced validation with detailed error messages
    const validationErrors: Array<{ row: number; field: string; message: string }> = [];
    const validScores: ScoreData[] = [];
    const MAX_SCORE = 109;
    const MIN_SCORE = 0;
    const VALID_DIVISIONS = ['Open', 'Junior', 'Veteran', 'Master'];
    const MAX_BATCH_SIZE = 1000; // Prevent excessive imports

    // Check batch size
    if (scores.length > MAX_BATCH_SIZE) {
      return res.status(400).json({ 
        error: `Batch size too large. Maximum ${MAX_BATCH_SIZE} scores per import.`,
        received: scores.length
      });
    }

    scores.forEach((score, index) => {
      const rowNum = index + 1;
      const errors: Array<{ field: string; message: string }> = [];

      // Required fields with detailed validation
      if (!score.eventName || typeof score.eventName !== 'string' || score.eventName.trim().length === 0) {
        errors.push({ field: 'eventName', message: 'Event name is required and must be a non-empty string' });
      } else if (score.eventName.trim().length > 200) {
        errors.push({ field: 'eventName', message: 'Event name must be less than 200 characters' });
      }

      if (!score.matchNumber || typeof score.matchNumber !== 'string' || score.matchNumber.trim().length === 0) {
        errors.push({ field: 'matchNumber', message: 'Match number is required and must be a non-empty string' });
      } else if (score.matchNumber.trim().length > 50) {
        errors.push({ field: 'matchNumber', message: 'Match number must be less than 50 characters' });
      }

      if (!score.shooterName || typeof score.shooterName !== 'string' || score.shooterName.trim().length === 0) {
        errors.push({ field: 'shooterName', message: 'Shooter name is required and must be a non-empty string' });
      } else if (score.shooterName.trim().length > 100) {
        errors.push({ field: 'shooterName', message: 'Shooter name must be less than 100 characters' });
      }

      if (!score.club || typeof score.club !== 'string' || score.club.trim().length === 0) {
        errors.push({ field: 'club', message: 'Club is required and must be a non-empty string' });
      } else if (score.club.trim().length > 100) {
        errors.push({ field: 'club', message: 'Club name must be less than 100 characters' });
      }

      if (!score.division || typeof score.division !== 'string' || score.division.trim().length === 0) {
        errors.push({ field: 'division', message: 'Division is required and must be a non-empty string' });
      } else if (!VALID_DIVISIONS.includes(score.division)) {
        errors.push({ field: 'division', message: `Division must be one of: ${VALID_DIVISIONS.join(', ')}` });
      }

      // Validate veteran field
      if (typeof score.veteran !== 'boolean') {
        errors.push({ field: 'veteran', message: 'Veteran status must be a boolean (true or false)' });
      }

      // Validate series scores with detailed checks
      const series = [score.series1, score.series2, score.series3, score.series4, score.series5, score.series6];
      series.forEach((s, i) => {
        if (typeof s !== 'number') {
          errors.push({ field: `series${i + 1}`, message: `Series ${i + 1} must be a number` });
        } else if (!Number.isFinite(s)) {
          errors.push({ field: `series${i + 1}`, message: `Series ${i + 1} must be a finite number` });
        } else if (s < MIN_SCORE || s > MAX_SCORE) {
          errors.push({ field: `series${i + 1}`, message: `Series ${i + 1} score must be between ${MIN_SCORE} and ${MAX_SCORE}` });
        } else if (s % 0.1 !== 0 && s % 1 !== 0) {
          errors.push({ field: `series${i + 1}`, message: `Series ${i + 1} score must be rounded to 1 decimal place` });
        }
      });

      // Validate total
      if (typeof score.total !== 'number') {
        errors.push({ field: 'total', message: 'Total must be a number' });
      } else if (!Number.isFinite(score.total)) {
        errors.push({ field: 'total', message: 'Total must be a finite number' });
      } else {
        const calculatedTotal = series.reduce((sum, s) => sum + (Number.isFinite(s) ? s : 0), 0);
        const tolerance = 0.1; // Allow small floating point differences
        if (Math.abs(calculatedTotal - score.total) > tolerance) {
          errors.push({ 
            field: 'total', 
            message: `Total (${score.total}) doesn't match sum of series (${calculatedTotal.toFixed(1)})` 
          });
        }
      }

      // Validate place (optional)
      if (score.place !== undefined) {
        if (typeof score.place !== 'number' || !Number.isInteger(score.place) || score.place < 1) {
          errors.push({ field: 'place', message: 'Place must be a positive integer if provided' });
        }
      }

      if (errors.length > 0) {
        errors.forEach(err => {
          validationErrors.push({ row: rowNum, field: err.field, message: err.message });
        });
      } else {
        validScores.push(score);
      }
    });

    if (validScores.length === 0) {
      return res.status(400).json({ 
        error: 'No valid scores to import',
        details: validationErrors,
        summary: {
          total: scores.length,
          valid: 0,
          invalid: scores.length,
          errorCount: validationErrors.length
        }
      });
    }

    // Send to backend API with proper error handling
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';
    const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1';
    
    let backendResult;
    try {
      const backendResponse = await fetch(`${API_BASE_URL}/${API_VERSION}/admin/scores/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Use the same token that was verified
        },
        body: JSON.stringify({ scores: validScores }),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      if (!backendResponse.ok) {
        const errorData = await backendResponse.json().catch(() => ({ 
          error: `Backend returned status ${backendResponse.status}` 
        }));
        throw new Error(errorData.error || errorData.message || 'Backend import failed');
      }

      backendResult = await backendResponse.json();
    } catch (error: any) {
      // Handle network errors, timeouts, etc.
      if (error.name === 'AbortError') {
        throw new Error('Request timeout: Backend did not respond within 30 seconds');
      }
      if (error.message) {
        throw error;
      }
      throw new Error(`Backend communication error: ${error.message || 'Unknown error'}`);
    }

    return res.status(200).json({
      success: true,
      message: `Successfully imported ${validScores.length} of ${scores.length} scores`,
      imported: validScores.length,
      errors: validationErrors.length,
      errorDetails: validationErrors.length > 0 ? validationErrors : undefined,
      summary: {
        total: scores.length,
        valid: validScores.length,
        invalid: scores.length - validScores.length,
        errorCount: validationErrors.length
      },
      backendResult: backendResult,
    });

  } catch (error) {
    console.error('Score import error:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('timeout')) {
        return res.status(504).json({ 
          error: 'Request timeout',
          details: error.message,
          suggestion: 'Please try again with a smaller batch or check backend connectivity'
        });
      }
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return res.status(503).json({ 
          error: 'Backend service unavailable',
          details: error.message,
          suggestion: 'Please check backend service status and try again'
        });
      }
    }
    
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
} 