import {
  normalizeEmail,
  validateRegistrationInput,
  resolvePaymentMethod,
  isEventRegistrationOpen,
} from '@/lib/registrations';

describe('registrations', () => {
  it('normalizes email', () => {
    expect(normalizeEmail('  User@Example.COM ')).toBe('user@example.com');
  });

  it('validates required registration fields', () => {
    const invalid = validateRegistrationInput({});
    expect(invalid.ok).toBe(false);
    expect(invalid.errors).toEqual(
      expect.arrayContaining(['Full name is required', 'Email is required', 'Club is required'])
    );

    const valid = validateRegistrationInput({
      name: 'Jane Doe',
      email: 'jane@example.com',
      club: 'SATRF Club',
    });
    expect(valid.ok).toBe(true);
    expect(valid.data?.email).toBe('jane@example.com');
  });

  it('rejects invalid email format', () => {
    const result = validateRegistrationInput({
      name: 'Jane',
      email: 'not-an-email',
      club: 'Club',
    });
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('Invalid email format');
  });

  it('resolves payment method from event config', () => {
    expect(resolvePaymentMethod({ price: 0 })).toBe('free');
    expect(resolvePaymentMethod({ price: 300, payfastUrl: 'https://payfast.co.za/x' })).toBe('payfast');
    expect(resolvePaymentMethod({ price: 300, eftInstructions: 'Bank XYZ' })).toBe('eft');
    expect(resolvePaymentMethod({ price: 300 })).toBe(null);
  });

  it('checks whether event registration is open', () => {
    expect(isEventRegistrationOpen({ status: 'closed' }).open).toBe(false);
    expect(
      isEventRegistrationOpen({ status: 'open', maxParticipants: 10, currentParticipants: 10 }).open
    ).toBe(false);
    expect(
      isEventRegistrationOpen({ status: 'open', maxParticipants: 10, currentParticipants: 3 }).open
    ).toBe(true);
    expect(isEventRegistrationOpen({ status: 'open', maxParticipants: 0 }).open).toBe(true);
  });
});
