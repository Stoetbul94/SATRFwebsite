import {
  deriveAgeCategory,
  isValidProvince,
  normalizeDisciplines,
  validateDateOfBirth,
  validatePhone,
} from '@/lib/memberFields';

describe('memberFields', () => {
  it('validates SA provinces', () => {
    expect(isValidProvince('Gauteng')).toBe(true);
    expect(isValidProvince('Invalid')).toBe(false);
  });

  it('validates phone numbers', () => {
    expect(validatePhone('+27 12 345 6789')).toBe(true);
    expect(validatePhone('123')).toBe(false);
  });

  it('validates date of birth', () => {
    expect(validateDateOfBirth('')).toMatch(/required/i);
    expect(validateDateOfBirth('2030-01-01')).toMatch(/future/i);
    expect(validateDateOfBirth('1990-06-15')).toBeNull();
  });

  it('derives age category from DOB', () => {
    const young = new Date();
    young.setFullYear(young.getFullYear() - 18);
    expect(deriveAgeCategory(young.toISOString().split('T')[0])).toBe('junior');

    const senior = new Date();
    senior.setFullYear(senior.getFullYear() - 40);
    expect(deriveAgeCategory(senior.toISOString().split('T')[0])).toBe('senior');

    const veteran = new Date();
    veteran.setFullYear(veteran.getFullYear() - 65);
    expect(deriveAgeCategory(veteran.toISOString().split('T')[0])).toBe('veteran');
  });

  it('normalizes discipline ids', () => {
    expect(normalizeDisciplines(['prone', 'bad', '3-position'])).toEqual(['prone', '3-position']);
  });
});
