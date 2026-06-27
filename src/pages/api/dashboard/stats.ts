import type { NextApiRequest, NextApiResponse } from 'next';
import type { DashboardStats } from '@/lib/api';
import { FALLBACK_HOME_STATS, fetchDashboardStatsServer } from '@/lib/server/homepageData';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');

  const stats: DashboardStats = await fetchDashboardStatsServer();
  return res.status(200).json(stats ?? FALLBACK_HOME_STATS);
}
