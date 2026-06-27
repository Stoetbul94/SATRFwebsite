import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdminFromToken } from '@/lib/admin';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { buildScore, validateScoreInput } from '@/lib/issf';
import {
  finalGroupsToRecomputeAfterUpdate,
  recomputeFinalRanksForEvent,
} from '@/lib/recomputeFinalRanks';
import { enrichScoreInput } from '@/lib/scoreMemberEnrich';
import type { Score, ScoreInput } from '@/types/scores';

function sanitizeForFirestore<T>(value: T): T {
  if (value === undefined) return value;
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForFirestore(item)) as T;
  }
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (val !== undefined) out[key] = sanitizeForFirestore(val);
  }
  return out as T;
}

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
    return res.status(400).json({ error: 'Invalid score ID' });
  }

  try {
    const db = getAdminDb();
    const scoreRef = db.collection('scores').doc(id);
    const scoreDoc = await scoreRef.get();

    if (!scoreDoc.exists) {
      return res.status(404).json({ error: 'Score not found' });
    }

    const existing = scoreDoc.data() as Score & { deleted?: boolean };

    if (req.method === 'PUT') {
      const body = req.body ?? {};

      // Status-only quick update (legacy)
      if (body.status && Object.keys(body).length === 1) {
        await scoreRef.update({
          status: body.status,
          updatedAt: new Date().toISOString(),
        });
        return res.status(200).json({ success: true, message: 'Score updated successfully' });
      }

      const input = body as ScoreInput;
      if (!input.shooterName || !input.positions?.length) {
        return res.status(400).json({ error: 'Invalid score payload' });
      }

      const strict = (input.status ?? existing.status) === 'official';
      const validation = validateScoreInput(input, { strict });
      if (!validation.valid) {
        return res.status(400).json({ error: 'Validation failed', details: validation.errors });
      }

      const cache = new Map<string, string | null>();
      const memberCache = new Map();
      const enriched = await enrichScoreInput(db, input, cache, memberCache);
      const rebuilt = buildScore(enriched, {
        createdBy: existing.createdBy || userId || 'admin',
        now: existing.createdAt || new Date().toISOString(),
      });

      const updated: Omit<Score, 'id'> = {
        ...rebuilt,
        source: input.source ?? existing.source ?? 'manual',
        createdAt: existing.createdAt,
        createdBy: existing.createdBy,
        updatedAt: new Date().toISOString(),
      };

      await scoreRef.set(sanitizeForFirestore(updated));

      const rankGroups = finalGroupsToRecomputeAfterUpdate(existing, updated);
      for (const group of rankGroups) {
        await recomputeFinalRanksForEvent(db, group).catch((err) =>
          console.warn('finalRank recompute after update failed:', err),
        );
      }

      await db.collection('adminActions').add({
        adminId: userId,
        action: 'update_score',
        targetId: id,
        details: { shooterName: input.shooterName, decimalTotal: rebuilt.decimalTotal },
        timestamp: new Date().toISOString(),
      });

      return res.status(200).json({
        success: true,
        message: 'Score updated successfully',
        score: { id, ...updated },
      });
    }

    if (req.method === 'DELETE') {
      await scoreRef.update({
        deleted: true,
        deletedAt: new Date().toISOString(),
        deletedBy: userId,
      });

      await db.collection('adminActions').add({
        adminId: userId,
        action: 'delete_score',
        targetId: id,
        timestamp: new Date().toISOString(),
      });

      return res.status(200).json({ success: true, message: 'Score deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error handling score:', error);
    return res.status(500).json({ error: 'Internal server error', details: message });
  }
}
