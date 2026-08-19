import { RULE_ALIASES, type RuleDiscipline, type RuleTopic } from '@/data/rulesTaxonomy';

export type RuleSearchEntry = {
  id: string;
  documentId: string;
  documentTitle: string;
  documentEdition?: string;
  documentPrint?: string | null;
  effectiveDate?: string;
  status?: 'current' | 'superseded' | 'reference';
  section?: string;
  ruleNumber?: string;
  heading?: string;
  text: string;
  page?: number;
  disciplineTags: RuleDiscipline[] | string[];
  topicTags: RuleTopic[] | string[];
  pdfUrl: string;
  officialUrl?: string;
  officialPdfUrl?: string;
};

export type RulesIndexPayload = {
  meta: {
    lastCheckedAgainstIssf: string;
    generatedAt: string;
    officialPortal: string;
    currentRulebook: {
      title: string;
      edition: string;
      print: string;
      effectiveDate: string;
    };
  };
  entries: RuleSearchEntry[];
};

export type SearchOptions = {
  q?: string;
  topic?: string;
  discipline?: string;
  documentId?: string;
  includeHistorical?: boolean;
  limit?: number;
};

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9.+]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function unique(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

export function expandQuery(q: string): string[] {
  const n = normalize(q);
  if (!n) return [];
  const extras: string[] = [];
  for (const [key, values] of Object.entries(RULE_ALIASES)) {
    const nk = normalize(key);
    if (n === nk || n.includes(nk) || n.split(' ').includes(nk)) {
      extras.push(...values.map(normalize));
    }
  }
  return unique([n, ...extras]);
}

function countOccurrences(hay: string, needle: string) {
  if (!needle) return 0;
  let c = 0;
  let i = hay.indexOf(needle);
  while (i !== -1) {
    c += 1;
    i = hay.indexOf(needle, i + needle.length);
  }
  return c;
}

export function scoreEntry(entry: RuleSearchEntry, query: string): number {
  const variants = expandQuery(query);
  if (!variants.length) return 0;
  const rule = normalize(entry.ruleNumber || '');
  const heading = normalize(entry.heading || '');
  const text = normalize(entry.text || '');
  const title = normalize(entry.documentTitle || '');
  const tags = normalize([...(entry.disciplineTags || []), ...(entry.topicTags || [])].join(' '));
  const rawQ = normalize(query);

  let score = 0;

  if (/^\d+(\.\d+)+$/.test(rawQ) && rule) {
    if (rule === rawQ) score += 500;
    else if (rule.startsWith(`${rawQ}.`) || rawQ.startsWith(`${rule}.`)) score += 220;
  }

  const tokens = rawQ.split(' ').filter(Boolean);
  if (tokens.length > 1) {
    const blob = `${heading} ${text} ${title}`;
    if (tokens.every((t) => blob.includes(t))) score += 50;
    else if (tokens.filter((t) => t.length > 2 && blob.includes(t)).length >= 2) score += 28;
  }

  for (const v of variants) {
    if (heading === v) score += 90;
    else if (heading.includes(v)) score += 55;
    if (tags.includes(v.replace(/ /g, '-'))) score += 35;
    if (title.includes(v)) score += 12;
    const textHits = countOccurrences(text, v);
    score += Math.min(24, textHits * 8);
  }

  if (/\b3p\b|3-position|3 position|three position/.test(rawQ) || variants.some((v) => v.includes('3 position'))) {
    if ((entry.disciplineTags || []).includes('50m-rifle-3p')) score += 40;
    if (/50m rifle 3|50 m rifle 3/.test(`${heading} ${text.slice(0, 120)}`)) score += 70;
    if (rule.startsWith('7.7')) score += 80;
    if (/pistol|shotgun/.test(text) && !/rifle/.test(heading + text.slice(0, 80))) score -= 15;
    if (/typ |elimination series|hit penalty/.test(text) && !rule.startsWith('7.')) score -= 50;
  }
  if (/position change/.test(rawQ)) {
    if (rule.startsWith('7.7.3')) score += 200;
    else score -= 25;
  }
  if (/\b3p\b|3 position|3-position/.test(rawQ) && /timing|time/.test(rawQ) && rule.startsWith('7.7.4')) {
    score += 160;
  }
  if (/\bglove\b/.test(rawQ)) {
    if (rule.startsWith('7.5.6')) score += 140;
    if (/shooting glove/.test(`${heading} ${text}`)) score += 50;
  }
  if (/rifle weight|maximum weight/.test(rawQ) && rule.startsWith('7.7.5')) score += 140;
  if (/\bfinals\b/.test(rawQ)) {
    if (/general finals/.test(heading)) score += 120;
    if (/finals officials|pistol/.test(`${heading} ${text.slice(0, 80)}`)) score -= 40;
  }
  if (/penalt/.test(rawQ)) {
    if (/penalt/.test(heading)) score += 120;
    if (!rule) score -= 50;
    if (/pistol/.test(text.slice(0, 100))) score -= 40;
  }
  if (/\bprone\b/.test(rawQ)) {
    if ((entry.disciplineTags || []).includes('50m-rifle-prone')) score += 25;
  }
  if (/timing|minutes|time/.test(rawQ) && (entry.topicTags || []).includes('timing')) score += 30;
  if (/jacket|trouser|glove|shoe|cloth/.test(rawQ) && (entry.topicTags || []).includes('clothing')) score += 30;

  if (entry.status === 'superseded') score -= 200;
  return score;
}

export function searchRules(entries: RuleSearchEntry[], options: SearchOptions = {}) {
  const { q = '', topic, discipline, documentId, includeHistorical = false, limit = 40 } = options;
  let pool = entries;
  if (!includeHistorical) {
    pool = pool.filter((e) => e.status !== 'superseded');
  }
  if (discipline && discipline !== 'all') {
    pool = pool.filter((e) => (e.disciplineTags || []).includes(discipline as RuleDiscipline));
  }
  if (topic && topic !== 'all') {
    pool = pool.filter((e) => (e.topicTags || []).includes(topic as RuleTopic));
  }
  if (documentId && documentId !== 'all') {
    pool = pool.filter((e) => e.documentId === documentId);
  }

  const query = q.trim();
  if (!query) {
    return pool
      .slice()
      .sort((a, b) => (a.ruleNumber || '').localeCompare(b.ruleNumber || '', undefined, { numeric: true }))
      .slice(0, limit);
  }

  return pool
    .map((entry) => ({ entry, score: scoreEntry(entry, query) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || (a.entry.page || 0) - (b.entry.page || 0))
    .slice(0, limit)
    .map((row) => row.entry);
}

export function excerptAround(text: string, query: string, max = 280) {
  const nText = text;
  const needles = expandQuery(query);
  let idx = 0;
  for (const n of needles) {
    const i = nText.toLowerCase().indexOf(n.toLowerCase());
    if (i >= 0) {
      idx = i;
      break;
    }
  }
  const start = Math.max(0, idx - 60);
  const slice = nText.slice(start, start + max);
  return `${start > 0 ? '…' : ''}${slice}${start + max < nText.length ? '…' : ''}`;
}

export function highlightParts(text: string, query: string): { t: string; hit: boolean }[] {
  const terms = unique(
    expandQuery(query)
      .flatMap((v) => v.split(' '))
      .filter((t) => t.length > 2),
  );
  if (!terms.length) return [{ t: text, hit: false }];
  const re = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'ig');
  const parts: { t: string; hit: boolean }[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  const copy = text;
  while ((m = re.exec(copy))) {
    if (m.index > last) parts.push({ t: copy.slice(last, m.index), hit: false });
    parts.push({ t: m[0], hit: true });
    last = m.index + m[0].length;
  }
  if (last < copy.length) parts.push({ t: copy.slice(last), hit: false });
  return parts.length ? parts : [{ t: text, hit: false }];
}

export function pdfPageHref(entry: RuleSearchEntry) {
  const base = entry.pdfUrl;
  return entry.page ? `${base}#page=${entry.page}` : base;
}
