import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb, verifyRequestUser } from '@/lib/firebaseAdmin';
import { getPersonalDashboard } from '@/lib/dashboard/buildDashboard';
import type { DashboardResponse } from '@/lib/dashboard/types';

/**
 * GET /api/dashboard
 *
 * Personal My SATRF aggregate. Identity from verified Firebase ID token only.
 * Never accepts uid / userId / athleteId from query or body.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DashboardResponse | { error: string }>,
) {
  res.setHeader('Cache-Control', 'private, no-store');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await verifyRequestUser(req.headers.authorization);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Ignore any client-supplied identity overrides.
  if (req.query.uid || req.query.userId || req.query.athleteId || req.body?.uid) {
    // Still serve authenticated caller only — do not honour overrides.
  }

  try {
    const db = getAdminDb();
    const data = await getPersonalDashboard(db, user.uid);
    return res.status(200).json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('dashboard API error:', message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
