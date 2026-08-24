import type { NextApiRequest, NextApiResponse } from 'next';

jest.mock('@/lib/firebaseAdmin', () => ({
  verifyRequestUser: jest.fn(),
  getAdminDb: jest.fn(),
}));

import handler from '@/pages/api/scores/my-scores';
import { verifyRequestUser, getAdminDb } from '@/lib/firebaseAdmin';

const mockVerify = verifyRequestUser as jest.Mock;

function mockRes() {
  const res: Partial<NextApiResponse> & { headers: Record<string, string> } = {
    headers: {},
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn(function (this: typeof res, key: string, value: string) {
      this.headers[key] = value;
      return this;
    }),
  };
  return res as NextApiResponse & { headers: Record<string, string> };
}

describe('/api/scores/my-scores security', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAdminDb as jest.Mock).mockReturnValue({
      collection: () => ({
        where: () => ({
          where: () => ({
            orderBy: () => ({
              limit: () => ({
                get: async () => ({ docs: [] }),
              }),
            }),
          }),
          orderBy: () => ({
            limit: () => ({
              get: async () => ({ docs: [] }),
            }),
          }),
        }),
      }),
    });
  });

  it('returns 401 when unauthenticated', async () => {
    mockVerify.mockResolvedValue(null);
    const req = { method: 'GET', query: {}, headers: {} } as NextApiRequest;
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('uses verified uid and ignores userId override', async () => {
    mockVerify.mockResolvedValue({ uid: 'user-a', email: 'a@test.com' });
    const req = {
      method: 'GET',
      query: { userId: 'user-b', uid: 'user-b' },
      headers: { authorization: 'Bearer token' },
    } as unknown as NextApiRequest;
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.headers['Cache-Control']).toBe('private, no-store');
  });
});
