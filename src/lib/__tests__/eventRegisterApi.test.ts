import type { NextApiRequest, NextApiResponse } from 'next';

const mockVerifyOptional = jest.fn();
const mockGetAdminDb = jest.fn();
const mockSyncCount = jest.fn();
const mockSubmit = jest.fn();
const mockResolveEmail = jest.fn();

jest.mock('@/lib/firebaseAdmin', () => ({
  verifyOptionalRequestUser: (...args: unknown[]) => mockVerifyOptional(...args),
  getAdminDb: () => mockGetAdminDb(),
}));

jest.mock('@/lib/registrations', () => ({
  validateRegistrationInput: jest.fn((body: Record<string, unknown>) => {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const club = typeof body.club === 'string' ? body.club.trim() : '';
    if (!name || !email || !club) {
      return { ok: false, errors: ['Missing fields'] };
    }
    return { ok: true, errors: [], data: { name, email, club } };
  }),
  isEventRegistrationOpen: jest.fn(() => ({ open: true })),
  syncEventRegistrationCount: (...args: unknown[]) => mockSyncCount(...args),
}));

jest.mock('@/lib/registrationSubmit', () => ({
  resolveAuthenticatedEmail: (...args: unknown[]) => mockResolveEmail(...args),
  submitEventRegistration: (...args: unknown[]) => mockSubmit(...args),
}));

jest.mock('@/lib/eventDisciplines', () => ({
  parseEntryFee: jest.fn(() => 0),
}));

import handler from '@/pages/api/events/[id]/register';

function mockRes() {
  const res: Partial<NextApiResponse> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as NextApiResponse;
}

const eventDoc = {
  exists: true,
  data: () => ({
    title: 'SATRF Championship',
    status: 'open',
    price: 0,
    maxParticipants: 100,
  }),
};

describe('POST /api/events/[id]/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAdminDb.mockReturnValue({
      collection: () => ({
        doc: () => ({
          get: jest.fn().mockResolvedValue(eventDoc),
        }),
      }),
    });
    mockSyncCount.mockResolvedValue(1);
  });

  it('allows guest registration without auth token', async () => {
    mockVerifyOptional.mockResolvedValue({ kind: 'absent' });
    mockSubmit.mockResolvedValue({
      kind: 'created',
      registration: { id: 'reg-1', memberId: null },
      paymentMethod: 'free',
      payfastUrl: null,
      eftInstructions: null,
    });

    const req = {
      method: 'POST',
      query: { id: 'event-1' },
      headers: {},
      body: { name: 'Guest User', email: 'guest@example.com', club: 'Club' },
    } as unknown as NextApiRequest;
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        authenticated: null,
        input: expect.objectContaining({ email: 'guest@example.com' }),
      }),
    );
  });

  it('stores authenticated uid and ignores client memberId override', async () => {
    mockVerifyOptional.mockResolvedValue({
      kind: 'authenticated',
      uid: 'user-a',
      email: 'member@example.com',
    });
    mockResolveEmail.mockResolvedValue('member@example.com');
    mockSubmit.mockResolvedValue({
      kind: 'created',
      registration: { id: 'reg-2', memberId: 'user-a' },
      paymentMethod: 'free',
      payfastUrl: null,
      eftInstructions: null,
    });

    const req = {
      method: 'POST',
      query: { id: 'event-1' },
      headers: { authorization: 'Bearer valid-token' },
      body: {
        name: 'Jane Doe',
        email: 'other@example.com',
        club: 'Club',
        memberId: 'attacker-uid',
        uid: 'attacker-uid',
      },
    } as unknown as NextApiRequest;
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        authenticated: { uid: 'user-a', email: 'member@example.com' },
      }),
    );
  });

  it('returns 401 for invalid bearer token', async () => {
    mockVerifyOptional.mockResolvedValue({ kind: 'invalid' });

    const req = {
      method: 'POST',
      query: { id: 'event-1' },
      headers: { authorization: 'Bearer bad-token' },
      body: { name: 'Jane', email: 'jane@example.com', club: 'Club' },
    } as unknown as NextApiRequest;
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('returns 409 when guest registration belongs to another account', async () => {
    mockVerifyOptional.mockResolvedValue({
      kind: 'authenticated',
      uid: 'user-a',
      email: 'member@example.com',
    });
    mockResolveEmail.mockResolvedValue('member@example.com');
    mockSubmit.mockResolvedValue({
      kind: 'conflict',
      message: 'This registration is linked to another account',
    });

    const req = {
      method: 'POST',
      query: { id: 'event-1' },
      headers: { authorization: 'Bearer valid-token' },
      body: { name: 'Jane', email: 'member@example.com', club: 'Club' },
    } as unknown as NextApiRequest;
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('links existing guest registration to authenticated account', async () => {
    mockVerifyOptional.mockResolvedValue({
      kind: 'authenticated',
      uid: 'user-a',
      email: 'member@example.com',
    });
    mockResolveEmail.mockResolvedValue('member@example.com');
    mockSubmit.mockResolvedValue({
      kind: 'already_registered',
      registration: { id: 'reg-old', memberId: 'user-a' },
      linkedAccount: true,
      paymentMethod: 'eft',
      payfastUrl: null,
      eftInstructions: 'Bank details',
    });

    const req = {
      method: 'POST',
      query: { id: 'event-1' },
      headers: { authorization: 'Bearer valid-token' },
      body: { name: 'Jane', email: 'member@example.com', club: 'Club' },
    } as unknown as NextApiRequest;
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.linkedAccount).toBe(true);
    expect(body.registration.memberId).toBe('user-a');
  });
});
