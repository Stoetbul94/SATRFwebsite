/** Shared member field constants and validation for registration + profile. */

export const SA_PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape',
  'Western Cape',
  'Other/National',
] as const;

export type SaProvince = (typeof SA_PROVINCES)[number];

export const PROVINCE_ABBREV: Record<SaProvince, string> = {
  'Eastern Cape': 'EC',
  'Free State': 'FS',
  Gauteng: 'GP',
  'KwaZulu-Natal': 'KZN',
  Limpopo: 'LP',
  Mpumalanga: 'MP',
  'North West': 'NW',
  'Northern Cape': 'NC',
  'Western Cape': 'WC',
  'Other/National': 'NAT',
};

export function provinceAbbrev(province?: string | null): string | null {
  if (!province?.trim()) return null;
  const trimmed = province.trim();
  if (isValidProvince(trimmed)) return PROVINCE_ABBREV[trimmed];
  return null;
}

export const SHOOTING_DISCIPLINES = [
  { id: 'prone', label: 'Prone' },
  { id: 'f-class', label: 'F-Class' },
  { id: '3-position', label: '3-Position' },
] as const;

export type ShootingDisciplineId = (typeof SHOOTING_DISCIPLINES)[number]['id'];

const PHONE_REGEX = /^[\+]?[\d\s\-\(\)]{8,24}$/;

export function isValidProvince(value: string): value is SaProvince {
  return (SA_PROVINCES as readonly string[]).includes(value);
}

export function isValidDisciplineId(value: string): value is ShootingDisciplineId {
  return SHOOTING_DISCIPLINES.some((d) => d.id === value);
}

export function normalizeDisciplines(raw: unknown): ShootingDisciplineId[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((d) => String(d).trim())
    .filter((d): d is ShootingDisciplineId => isValidDisciplineId(d));
}

export function validatePhone(phone: string): boolean {
  const trimmed = phone.trim();
  if (!trimmed) return false;
  const compact = trimmed.replace(/\s/g, '');
  if (!PHONE_REGEX.test(compact)) return false;
  const digits = compact.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15;
}

export function validateDateOfBirth(dob: string): string | null {
  if (!dob?.trim()) return 'Date of birth is required';
  const date = new Date(dob);
  if (Number.isNaN(date.getTime())) return 'Please enter a valid date of birth';
  const now = new Date();
  if (date > now) return 'Date of birth cannot be in the future';
  const minYear = now.getFullYear() - 120;
  if (date.getFullYear() < minYear) return 'Please enter a valid date of birth';
  return null;
}

/** Age-category hint from DOB (does not override user-selected membership type). */
export function deriveAgeCategory(dob: string): 'junior' | 'senior' | 'veteran' {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  if (age < 21) return 'junior';
  if (age >= 60) return 'veteran';
  return 'senior';
}
