import type { Category } from '@/types/scores';

/** Parse Y/N, yes/no, veteran, etc. from import spreadsheets. */
export function parseIsVeteranFlag(raw: unknown): boolean {
  if (raw === true || raw === 1) return true;
  const s = String(raw ?? '')
    .trim()
    .toLowerCase();
  return s === 'y' || s === 'yes' || s === 'true' || s === '1' || s === 'veteran';
}

export function membershipIsVeteran(membershipType?: string | null): boolean {
  return membershipType === 'veteran';
}

/** Option B: veteran leaderboard uses isVeteran; open/junior/ladies use category. */
export function scoreMatchesCategoryFilter(
  score: { category: Category | string; isVeteran?: boolean },
  filter: Category | 'all'
): boolean {
  if (filter === 'all') return true;
  if (filter === 'veteran') {
    return score.isVeteran === true || score.category === 'veteran';
  }
  return score.category === filter;
}

/** Map legacy category=veteran + explicit flag into stored shape (category open + isVeteran). */
export function normalizeScoreCategoryFlags(input: {
  category: Category | string;
  isVeteran?: boolean;
}): { category: Category; isVeteran: boolean } {
  const isVeteran = input.isVeteran === true || input.category === 'veteran';
  const category = input.category === 'veteran' ? 'open' : (input.category as Category);
  return { category, isVeteran };
}
