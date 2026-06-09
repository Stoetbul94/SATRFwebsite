import { mergeMemberData } from '@/lib/memberLink';

describe('mergeMemberData', () => {
  const signup = {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    membershipType: 'senior' as const,
    club: 'New Club',
    province: 'Gauteng',
    dateOfBirth: '1990-01-15',
    phone: '+27 11 222 3333',
    disciplines: ['prone'],
  };

  it('preserves existing admin data and fills gaps from signup', () => {
    const existing = {
      firstName: 'Janet',
      lastName: 'Doe',
      club: 'Admin Club',
      email: 'jane@example.com',
      membershipType: 'veteran',
      category: 'veteran',
      status: 'active',
      role: 'user',
      createdAt: '2020-01-01T00:00:00.000Z',
    };

    const merged = mergeMemberData(existing, signup, 'auth-uid-1', '2026-06-02T00:00:00.000Z');

    expect(merged.firstName).toBe('Janet');
    expect(merged.lastName).toBe('Doe');
    expect(merged.club).toBe('Admin Club');
    expect(merged.membershipType).toBe('veteran');
    expect(merged.province).toBe('Gauteng');
    expect(merged.phone).toBe('+27 11 222 3333');
    expect(merged.id).toBe('auth-uid-1');
    expect(merged.authUid).toBe('auth-uid-1');
    expect(merged.status).toBe('active');
  });
});
