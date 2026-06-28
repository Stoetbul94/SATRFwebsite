import {
  mergeMemberData,
  memberDisplayName,
  scoreClubDiffersFromMember,
  scoreMatchesMemberProfile,
  linkedScorePreviewFromData,
  filterScoresByLinkStatus,
} from '@/lib/memberLink';

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

describe('memberDisplayName', () => {
  it('joins first and last name', () => {
    expect(memberDisplayName({ firstName: 'Nico', lastName: 'Rautenbach' })).toBe('Nico Rautenbach');
  });
});

describe('scoreMatchesMemberProfile', () => {
  const member = { firstName: 'Nico', lastName: 'Rautenbach', club: 'PMSBSC' };

  it('matches unlinked score with same name and club', () => {
    expect(
      scoreMatchesMemberProfile(
        { shooterName: 'Nico Rautenbach', club: 'PMSBSC', userId: null },
        member
      )
    ).toBe(true);
  });

  it('matches unlinked score when club differs but name matches', () => {
    expect(
      scoreMatchesMemberProfile(
        { shooterName: 'Nico Rautenbach', club: 'Other Club', userId: null },
        member
      )
    ).toBe(true);
  });

  it('matches on name only when member club is empty', () => {
    expect(
      scoreMatchesMemberProfile(
        { shooterName: 'Nico Rautenbach', club: 'PMSBSC', userId: null },
        { firstName: 'Nico', lastName: 'Rautenbach', club: '' }
      )
    ).toBe(true);
  });

  it('rejects linked or deleted scores', () => {
    expect(
      scoreMatchesMemberProfile(
        { shooterName: 'Nico Rautenbach', club: 'PMSBSC', userId: 'uid-1' },
        member
      )
    ).toBe(false);
    expect(
      scoreMatchesMemberProfile(
        { shooterName: 'Nico Rautenbach', club: 'PMSBSC', userId: null, deleted: true },
        member
      )
    ).toBe(false);
  });
});

describe('scoreClubDiffersFromMember', () => {
  const member = { club: 'PMSBSC' };

  it('returns true when both clubs are set and differ', () => {
    expect(scoreClubDiffersFromMember({ club: 'Durban Deep' }, member)).toBe(true);
  });

  it('returns false when clubs match', () => {
    expect(scoreClubDiffersFromMember({ club: 'PMSBSC' }, member)).toBe(false);
  });

  it('returns false when either club is empty', () => {
    expect(scoreClubDiffersFromMember({ club: '' }, member)).toBe(false);
    expect(scoreClubDiffersFromMember({ club: 'Durban Deep' }, { club: '' })).toBe(false);
  });
});

describe('linkedScorePreviewFromData', () => {
  it('maps score fields and formats total display', () => {
    const preview = linkedScorePreviewFromData('score-1', {
      shooterName: 'Sherene Grundlingh',
      club: 'NG',
      eventName: 'SATRF PRONE EVENT #2',
      date: '2026-04-25',
      discipline: 'prone_50m',
      stage: 'qualification',
      decimalTotal: 584.4,
      integerTotal: 584,
    });

    expect(preview.id).toBe('score-1');
    expect(preview.shooterName).toBe('Sherene Grundlingh');
    expect(preview.stage).toBe('qualification');
    expect(preview.totalDisplay).toContain('584');
  });
});

describe('filterScoresByLinkStatus', () => {
  const rows = [
    { id: '1', userId: 'uid-a' },
    { id: '2', userId: null },
    { id: '3', userId: 'uid-b' },
  ];

  it('filters linked scores', () => {
    expect(filterScoresByLinkStatus(rows, 'linked')).toEqual([
      { id: '1', userId: 'uid-a' },
      { id: '3', userId: 'uid-b' },
    ]);
  });

  it('filters unlinked scores', () => {
    expect(filterScoresByLinkStatus(rows, 'unlinked')).toEqual([{ id: '2', userId: null }]);
  });

  it('returns all scores for all filter', () => {
    expect(filterScoresByLinkStatus(rows, 'all')).toEqual(rows);
  });
});
