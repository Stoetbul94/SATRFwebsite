import type { NextApiRequest, NextApiResponse } from 'next';
import handler from '@/pages/api/health';
import { pingFirestore } from '@/lib/firebaseAdmin';

jest.mock('@/lib/firebaseAdmin', () => ({
  pingFirestore: jest.fn(),
}));

const mockPing = pingFirestore as jest.MockedFunction<typeof pingFirestore>;

function mockRes() {
  const res = {
    statusCode: 200,
    body: null as unknown,
    headers: {} as Record<string, string>,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
    setHeader(name: string, value: string) {
      this.headers[name] = value;
      return this;
    },
    end() {
      return this;
    },
  };
  return res as typeof res & NextApiResponse;
}

describe('/api/health', () => {
  beforeEach(() => {
    mockPing.mockReset();
  });

  it('returns 200 when Firestore is reachable', async () => {
    mockPing.mockResolvedValueOnce(undefined);
    const req = { method: 'GET' } as NextApiRequest;
    const res = mockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.headers['Cache-Control']).toBe('no-store');
    expect(res.body).toMatchObject({
      status: 'healthy',
      services: { application: 'healthy', database: 'healthy' },
    });
  });

  it('returns 503 when Firestore is unreachable', async () => {
    mockPing.mockRejectedValueOnce(new Error('permission-denied'));
    const req = { method: 'GET' } as NextApiRequest;
    const res = mockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(503);
    expect(res.body).toMatchObject({
      status: 'unhealthy',
      services: { application: 'healthy', database: 'unhealthy' },
    });
    expect(JSON.stringify(res.body)).not.toMatch(/permission-denied/);
  });
});
