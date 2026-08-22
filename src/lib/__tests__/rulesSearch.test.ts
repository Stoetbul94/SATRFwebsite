import fs from 'fs';
import path from 'path';
import { expandQuery, searchRules, type RuleSearchEntry } from '@/lib/rulesSearch';

function loadIndex(): RuleSearchEntry[] {
  const file = path.join(process.cwd(), 'public', 'data', 'rules-search-index.json');
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  return raw.entries as RuleSearchEntry[];
}

describe('ISSF rule search', () => {
  const entries = loadIndex();

  it('indexes a substantial current rulebook slice', () => {
    expect(entries.length).toBeGreaterThan(200);
    expect(entries.every((e) => e.status !== 'superseded')).toBe(true);
  });

  it.each([
    '3P',
    '3 position',
    'three position',
    '50m prone',
    'prone',
    'timing',
    '3P timing',
    'sighters',
    'sighting',
    'jacket',
    'shooting jacket',
    'trousers',
    'pants',
    'shoe',
    'boots',
    'equipment control',
    'rifle weight',
    'finals',
  ])('returns relevant results for %s', (q) => {
    const results = searchRules(entries, { q, limit: 10 });
    expect(results.length).toBeGreaterThan(0);
    const blob = `${results[0].heading || ''} ${results[0].text} ${results[0].ruleNumber || ''}`.toLowerCase();
    expect(blob.length).toBeGreaterThan(20);
  });

  it('overlaps 3P and three position results', () => {
    const a = new Set(searchRules(entries, { q: '3P', limit: 15 }).map((e) => e.id));
    const b = searchRules(entries, { q: 'three position', limit: 15 });
    expect(b.some((e) => a.has(e.id))).toBe(true);
  });

  it('ranks an exact current rule number first', () => {
    const known = entries.find((e) => e.ruleNumber === '7.7.4');
    expect(known).toBeTruthy();
    const results = searchRules(entries, { q: '7.7.4', limit: 5 });
    expect(results[0].ruleNumber).toBe('7.7.4');
  });

  it('expands jacket aliases', () => {
    expect(expandQuery('jacket').some((v) => v.includes('shooting jacket'))).toBe(true);
  });
});
