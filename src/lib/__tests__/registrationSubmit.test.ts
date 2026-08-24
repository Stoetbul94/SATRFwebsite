import {
  evaluateGuestRegistrationLink,
  resolveRegistrationEmail,
} from '@/lib/registrationSubmit';

describe('registrationSubmit identity', () => {
  it('uses authenticated account email over body email', () => {
    expect(
      resolveRegistrationEmail('other@example.com', {
        uid: 'user-a',
        email: 'account@example.com',
      }),
    ).toBe('account@example.com');
  });

  it('uses normalized guest email when unauthenticated', () => {
    expect(resolveRegistrationEmail('  Guest@Example.COM ', null)).toBe('guest@example.com');
  });

  it('allows linking guest registration when memberId is null and email matches', () => {
    expect(
      evaluateGuestRegistrationLink(
        {
          id: 'r1',
          eventId: 'ev1',
          eventTitle: 'Event',
          name: 'Jane',
          email: 'jane@example.com',
          club: 'Club',
          memberId: null,
          isMember: false,
          paid: false,
          paymentMethod: 'free',
          status: 'registered',
          createdAt: '2026-01-01',
        },
        'uid-a',
        'jane@example.com',
      ),
    ).toBe('link');
  });

  it('returns already_owned when memberId matches authenticated uid', () => {
    expect(
      evaluateGuestRegistrationLink(
        {
          id: 'r1',
          eventId: 'ev1',
          eventTitle: 'Event',
          name: 'Jane',
          email: 'jane@example.com',
          club: 'Club',
          memberId: 'uid-a',
          isMember: true,
          paid: false,
          paymentMethod: 'free',
          status: 'registered',
          createdAt: '2026-01-01',
        },
        'uid-a',
        'jane@example.com',
      ),
    ).toBe('already_owned');
  });

  it('blocks cross-user claim when memberId belongs to another account', () => {
    expect(
      evaluateGuestRegistrationLink(
        {
          id: 'r1',
          eventId: 'ev1',
          eventTitle: 'Event',
          name: 'Jane',
          email: 'jane@example.com',
          club: 'Club',
          memberId: 'uid-b',
          isMember: true,
          paid: false,
          paymentMethod: 'free',
          status: 'registered',
          createdAt: '2026-01-01',
        },
        'uid-a',
        'jane@example.com',
      ),
    ).toBe('conflict');
  });

  it('blocks linking when guest email does not match authenticated account email', () => {
    expect(
      evaluateGuestRegistrationLink(
        {
          id: 'r1',
          eventId: 'ev1',
          eventTitle: 'Event',
          name: 'Jane',
          email: 'other@example.com',
          club: 'Club',
          memberId: null,
          isMember: false,
          paid: false,
          paymentMethod: 'free',
          status: 'registered',
          createdAt: '2026-01-01',
        },
        'uid-a',
        'jane@example.com',
      ),
    ).toBe('conflict');
  });
});
