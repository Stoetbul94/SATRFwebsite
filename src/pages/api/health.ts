import type { NextApiRequest, NextApiResponse } from 'next';
import { pingFirestore } from '@/lib/firebaseAdmin';

type ServiceState = 'healthy' | 'unhealthy';

interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  services: {
    application: ServiceState;
    database: ServiceState;
  };
  timestamp: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<HealthResponse>) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }

  res.setHeader('Cache-Control', 'no-store');

  const timestamp = new Date().toISOString();

  try {
    await pingFirestore();
    return res.status(200).json({
      status: 'healthy',
      services: {
        application: 'healthy',
        database: 'healthy',
      },
      timestamp,
    });
  } catch {
    return res.status(503).json({
      status: 'unhealthy',
      services: {
        application: 'healthy',
        database: 'unhealthy',
      },
      timestamp,
    });
  }
}
