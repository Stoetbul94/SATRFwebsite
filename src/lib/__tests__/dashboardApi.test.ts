import type { NextApiRequest, NextApiResponse } from 'next';

jest.mock('@/lib/firebaseAdmin', () => ({
  verifyRequestUser: jest.fn(),
  getAdminDb: jest.fn(() => ({})),
}));

jest.mock('@/lib/dashboard/buildDashboard', () => ({
  getPersonalDashboard: jest.fn(),
}));

import handler from '@/pages/api/dashboard/index';
import { verifyRequestUser } from '@/lib/firebaseAdmin';
import { getPersonalDashboard } from '@/lib/dashboard/buildDashboard';

const mockVerify = verifyRequestUser as jest.Mock;
const mockGetDashboard = getPersonalDashboard as jest.Mock;

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

describe('/api/dashboard security', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    mockVerify.mockResolvedValue(null);
    const req = { method: 'GET', query: {}, headers: {} } as NextApiRequest;
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockGetDashboard).not.toHaveBeenCalled();
  });

  it('uses verified uid only and ignores client uid override', async () => {
    mockVerify.mockResolvedValue({ uid: 'user-a', email: 'a@test.com' });
    mockGetDashboard.mockResolvedValue({
      user: { firstName: 'A', hasLinkedResults: false, profileIncomplete: false },
      registrations: [],
      results: [],
      notifications: { unreadCount: 0, recent: [] },
      nextEvent: null,
    });

    const req = {
      method: 'GET',
      query: { uid: 'user-b', userId: 'user-b', athleteId: 'ath-9' },
      headers: { authorization: 'Bearer token' },
    } as unknown as NextApiRequest;
    const res = mockRes();

    await handler(req, res);

    expect(mockGetDashboard).toHaveBeenCalledWith(expect.anything(), 'user-a');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.headers['Cache-Control']).toBe('private, no-store');
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(JSON.stringify(body)).not.toMatch(/user-a|user-b|authUid|"uid"/);
  });

  it('rejects non-GET', async () => {
    mockVerify.mockResolvedValue({ uid: 'user-a', email: null });
    const req = { method: 'POST', query: {}, headers: {} } as NextApiRequest;
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
  });
});
