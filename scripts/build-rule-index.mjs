/**
 * SATRF ISSF Rule Finder — offline index generator.
 *
 * Workflow (do NOT scrape ISSF during production builds):
 * 1. Check https://www.issf-sports.org/rules for the current Rule Book filename/print/effective date
 * 2. Download/update the local PDF under public/documents/issf/
 * 3. Update CURRENT_RULEBOOK + extraSources below if the current edition changed
 * 4. Run: npm run rules:index
 * 5. Review the console validation report
 * 6. Build + Preview
 *
 * Official ISSF publications remain authoritative.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse/lib/pdf-parse.js');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const issfDir = path.join(root, 'public', 'documents', 'issf');
const outFile = path.join(root, 'public', 'data', 'rules-search-index.json');
const metaFile = path.join(root, 'src', 'data', 'rulesIndexMeta.ts');

const LAST_CHECKED = '2026-08-19';
const ISSF_RULES_URL = 'https://www.issf-sports.org/rules';

const CURRENT_RULEBOOK = {
  id: 'issf-rule-book-2026-edition-2025-second-print-07-2026-effective-1-july-2026',
  title: 'ISSF Rule Book 2026',
  edition: '2026 Edition 2025',
  print: 'Second Print 07/2026',
  effectiveDate: '1 July 2026',
  status: 'current',
  file: 'issf-rule-book-2026-edition-2025-second-print-07-2026-effective-1-july-2026.pdf',
  officialPdf:
    'https://backoffice.issf-sports.org/getfile.aspx?mod=docf&pane=1&inst=455&file=ISSF-Rule-Book-2026-Edition-2025-Second-Print-07-2026-Effective-1-July-2026.pdf',
  localPath: '/documents/issf/issf-rule-book-2026-edition-2025-second-print-07-2026-effective-1-july-2026.pdf',
  /** General Technical (ch.6) + Rifle Rules (ch.7). */
  pageFrom: 181,
  pageTo: 348,
  allowChapters: 7,
};

const EXTRA_SOURCES = [
  {
    id: 'rifle-equipment-control-guide-edition-2026',
    title: 'Rifle Equipment Control Guide Edition 2026',
    edition: '2026',
    print: null,
    effectiveDate: '2026',
    status: 'current',
    file: 'rifle-equipment-control-guide-edition-2026.pdf',
    officialPdf:
      'https://backoffice.issf-sports.org/getfile.aspx?mod=docf&pane=1&inst=31&iist=25&file=Rifle-Equipment-Control-Guide-Edition-2026.pdf',
    localPath: '/documents/issf/rifle-equipment-control-guide-edition-2026.pdf',
    defaultTopics: ['equipment-control', 'clothing', 'rifle'],
    defaultDisciplines: ['rifle-general'],
  },
];

const RULE_OVERRIDES = [
  { prefix: '6.11', topics: ['timing', 'preparation', 'sighting', 'commands'], disciplines: ['general-technical'] },
  { prefix: '6.2', topics: ['safety'], disciplines: ['general-technical'] },
  { prefix: '6.3', topics: ['targets', 'range'], disciplines: ['general-technical'] },
  { prefix: '6.7', topics: ['equipment-control'], disciplines: ['general-technical'] },
  { prefix: '6.12', topics: ['malfunctions'], disciplines: ['general-technical'] },
  { prefix: '6.13', topics: ['scoring'], disciplines: ['general-technical'] },
  { prefix: '6.14', topics: ['penalties'], disciplines: ['general-technical'] },
  { prefix: '6.15', topics: ['finals'], disciplines: ['general-technical'] },
  { prefix: '6.16', topics: ['protests'], disciplines: ['general-technical'] },
  { prefix: '7.3', topics: ['targets', 'range'], disciplines: ['rifle-general'] },
  { prefix: '7.4', topics: ['rifle'], disciplines: ['rifle-general'] },
  { prefix: '7.5.1', topics: ['clothing', 'equipment-control'], disciplines: ['rifle-general'] },
  { prefix: '7.5.2', topics: ['clothing'], disciplines: ['rifle-general'] },
  { prefix: '7.5.3', topics: ['clothing'], disciplines: ['rifle-general'] },
  { prefix: '7.5.4', topics: ['clothing'], disciplines: ['rifle-general'] },
  { prefix: '7.5.5', topics: ['clothing'], disciplines: ['rifle-general'] },
  { prefix: '7.5.6', topics: ['clothing'], disciplines: ['rifle-general'] },
  { prefix: '7.5.7', topics: ['clothing'], disciplines: ['rifle-general'] },
  { prefix: '7.5.8', topics: ['rifle'], disciplines: ['rifle-general'] },
  { prefix: '7.6.1.1', topics: ['positions'], disciplines: ['50m-rifle-3p'] },
  { prefix: '7.6.1.2', topics: ['positions'], disciplines: ['50m-rifle-prone', '50m-rifle-3p'] },
  { prefix: '7.6.1.3', topics: ['positions'], disciplines: ['50m-rifle-3p'] },
  { prefix: '7.6', topics: ['positions'], disciplines: ['rifle-general'] },
  { prefix: '7.7.2', topics: ['timing', 'preparation', 'sighting'], disciplines: ['rifle-general'] },
  { prefix: '7.7.3', topics: ['timing', 'sighting', 'positions'], disciplines: ['50m-rifle-3p'] },
  { prefix: '7.7.4', topics: ['timing'], disciplines: ['rifle-general'] },
  { prefix: '7.7', topics: ['timing'], disciplines: ['rifle-general'] },
];

const TOPIC_KEYWORDS = [
  ['timing', ['time:', 'minutes', 'competition time', 'qualification table', 'preparation and sighting']],
  ['preparation', ['preparation time', 'preparation and sighting']],
  ['sighting', ['sighting', 'sighters', 'sighting shots', 'sighting series']],
  ['positions', ['kneeling', 'prone', 'standing', 'position change', '3-position', '3 positions']],
  ['clothing', ['jacket', 'trousers', 'shoes', 'glove', 'underclothing', 'stiffness', 'thickness', 'clothing']],
  ['rifle', ['rifle weight', 'butt plate', 'buttplate', 'cheek piece', 'cheekpiece', 'pistol grip', 'sights', 'sling', 'palm rest']],
  ['equipment-control', ['equipment control', 'post-competition', 'seal', 'measurement']],
  ['finals', ['finals', 'finals range', 'elimination']],
  ['commands', ['command', 'start', 'stop', 'load', 'unload', 'cro']],
  ['scoring', ['scoring', 'decimal', 'inner ten']],
  ['penalties', ['penalty', 'disqualify', 'dsq', 'warning', 'two points']],
  ['malfunctions', ['malfunction', 'allowable malfunction']],
  ['targets', ['target', 'est', 'electronic target']],
  ['range', ['firing point', 'firing line', 'range']],
  ['safety', ['safety flag', 'unloaded', 'safe']],
  ['protests', ['protest', 'appeal', 'arbitration']],
];

async function extractPages(filePath) {
  const buf = fs.readFileSync(filePath);
  const pages = [];
  await pdfParse(buf, {
    pagerender: async (pageData) => {
      const tc = await pageData.getTextContent({ normalizeWhitespace: true });
      const text = tc.items.map((i) => i.str).join(' ');
      pages.push(text);
      return text;
    },
  });
  return pages;
}

function stripRunningHeader(text) {
  return text
    .replace(/EDITION 2025 \(Second Print 07\/2026\)\s+Effective 1 July 2026\s+© ISSF\s+\d+/gi, ' ')
    .replace(/\d+\s+EDITION 2025 \(Second Print 07\/2026\)\s+Effective 1 July 2026\s+© ISSF/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isPlausibleRuleNumber(ruleNumber, allowChapters) {
  if (!ruleNumber) return false;
  const first = Number(ruleNumber.split('.')[0]);
  if (!Number.isInteger(first) || first < 1) return false;
  return first <= allowChapters;
}

function splitRules(pageText, allowChapters = 11) {
  const text = stripRunningHeader(pageText);
  const re = /(\d+\.\d+(?:\.\d+){0,4})\s+/g;
  const hits = [];
  let m;
  while ((m = re.exec(text))) {
    if (m.index > 0 && /[A-Za-z0-9]/.test(text[m.index - 1] || '')) continue;
    if (!isPlausibleRuleNumber(m[1], allowChapters)) continue;
    const after = text.slice(m.index + m[0].length, m.index + m[0].length + 12);
    if (/^(mm|cm|kg|g|m)\b/i.test(after.trim())) continue;
    hits.push({ ruleNumber: m[1], start: m.index, bodyStart: m.index + m[0].length });
  }
  if (!hits.length) {
    return text.length > 80 ? [{ ruleNumber: undefined, heading: undefined, text }] : [];
  }
  const chunks = [];
  for (let i = 0; i < hits.length; i++) {
    const end = i + 1 < hits.length ? hits[i + 1].start : text.length;
    const body = text.slice(hits[i].bodyStart, end).trim();
    if (body.length < 20) continue;
    const headingMatch = body.match(/^([A-Za-z][A-Za-z0-9 /,&()'’-]{2,90}?)(?=\s{2,}|\s+[a-z]|[.:])/);
    const heading = headingMatch ? headingMatch[1].trim() : undefined;
    chunks.push({
      ruleNumber: hits[i].ruleNumber,
      heading,
      text: body.slice(0, 700),
    });
  }
  return chunks;
}

function unique(arr) {
  return [...new Set(arr)];
}

function inferTags(ruleNumber, heading, text, defaults = {}) {
  const blob = `${ruleNumber || ''} ${heading || ''} ${text}`.toLowerCase();
  let disciplines = [...(defaults.disciplines || [])];
  let topics = [...(defaults.topics || [])];

  if (ruleNumber) {
    for (const ov of RULE_OVERRIDES) {
      if (ruleNumber === ov.prefix || ruleNumber.startsWith(`${ov.prefix}.`)) {
        disciplines.push(...ov.disciplines);
        topics.push(...ov.topics);
      }
    }
  }

  if (/50m rifle 3 position|50 m rifle 3 position|3-position events|3 position events/.test(blob)) {
    disciplines.push('50m-rifle-3p');
  }
  if (/50m rifle prone|50 m rifle prone/.test(blob) && !/3 position/.test(blob)) {
    disciplines.push('50m-rifle-prone');
  }
  if (/^7\./.test(ruleNumber || '')) disciplines.push('rifle-general');
  if (/^6\./.test(ruleNumber || '')) disciplines.push('general-technical');

  for (const [topic, keys] of TOPIC_KEYWORDS) {
    if (keys.some((k) => blob.includes(k))) topics.push(topic);
  }

  if (/jacket/.test(blob)) topics.push('clothing');
  if (/trouser/.test(blob)) topics.push('clothing');
  if (/glove/.test(blob)) topics.push('clothing');
  if (/shoe|boot/.test(blob)) topics.push('clothing');

  if (!disciplines.length) disciplines = ['rifle-general'];
  return { disciplineTags: unique(disciplines), topicTags: unique(topics) };
}

function makeId(documentId, ruleNumber, page, idx) {
  return `${documentId}:${ruleNumber || 'p'}:${page}:${idx}`.replace(/[^a-z0-9:._-]/gi, '-');
}

async function indexPdf(source, options = {}) {
  const filePath = path.join(issfDir, source.file);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing PDF: ${source.file}`);
  }
  const pages = await extractPages(filePath);
  const from = options.pageFrom || 1;
  const to = options.pageTo || pages.length;
  const entries = [];
  let emptyPages = 0;

  for (let i = from - 1; i < Math.min(to, pages.length); i++) {
    const raw = pages[i] || '';
    if (raw.replace(/\s/g, '').length < 40) {
      emptyPages += 1;
      continue;
    }
    const chunks = splitRules(raw, source.allowChapters ?? 11);
    if (!chunks.length) {
      emptyPages += 1;
      continue;
    }
    chunks.forEach((chunk, idx) => {
      const tags = inferTags(chunk.ruleNumber, chunk.heading, chunk.text, {
        disciplines: source.defaultDisciplines,
        topics: source.defaultTopics,
      });
      entries.push({
        id: makeId(source.id, chunk.ruleNumber, i + 1, idx),
        documentId: source.id,
        documentTitle: source.title,
        documentEdition: source.edition,
        documentPrint: source.print,
        effectiveDate: source.effectiveDate,
        status: source.status,
        section: chunk.ruleNumber ? chunk.ruleNumber.split('.').slice(0, 2).join('.') : undefined,
        ruleNumber: chunk.ruleNumber,
        heading: chunk.heading,
        text: chunk.text,
        page: i + 1,
        disciplineTags: tags.disciplineTags,
        topicTags: tags.topicTags,
        pdfUrl: source.localPath,
        officialUrl: ISSF_RULES_URL,
        officialPdfUrl: source.officialPdf,
      });
    });
  }

  return { entries, pages: pages.length, emptyPages };
}

function writeMeta(stats) {
  const src = `/** Generated by scripts/build-rule-index.mjs — do not edit by hand. */
export const RULES_INDEX_META = {
  lastCheckedAgainstIssf: '${LAST_CHECKED}',
  generatedAt: '${new Date().toISOString()}',
  officialPortal: '${ISSF_RULES_URL}',
  currentRulebook: {
    title: ${JSON.stringify(CURRENT_RULEBOOK.title)},
    edition: ${JSON.stringify(CURRENT_RULEBOOK.edition)},
    print: ${JSON.stringify(CURRENT_RULEBOOK.print)},
    effectiveDate: ${JSON.stringify(CURRENT_RULEBOOK.effectiveDate)},
    localPath: ${JSON.stringify(CURRENT_RULEBOOK.localPath)},
    officialPdf: ${JSON.stringify(CURRENT_RULEBOOK.officialPdf)},
  },
  documentsIndexed: ${stats.documents},
  pagesIndexed: ${stats.pagesIndexed},
  sectionsIndexed: ${stats.sections},
  warnings: ${JSON.stringify(stats.warnings)},
} as const;
`;
  fs.writeFileSync(metaFile, src);
}

async function main() {
  const warnings = [];
  const all = [];
  let pagesIndexed = 0;

  const rb = await indexPdf(CURRENT_RULEBOOK, {
    pageFrom: CURRENT_RULEBOOK.pageFrom,
    pageTo: CURRENT_RULEBOOK.pageTo,
  });
  all.push(...rb.entries);
  pagesIndexed += CURRENT_RULEBOOK.pageTo - CURRENT_RULEBOOK.pageFrom + 1;
  if (rb.emptyPages) warnings.push(`Rulebook empty-ish pages in range: ${rb.emptyPages}`);

  for (const extra of EXTRA_SOURCES) {
    const extraResult = await indexPdf(extra);
    all.push(...extraResult.entries);
    pagesIndexed += extraResult.pages;
    if (extraResult.emptyPages) warnings.push(`${extra.file}: ${extraResult.emptyPages} sparse pages`);
  }

  const ids = new Set();
  const uniqueEntries = [];
  let dupes = 0;
  for (const e of all) {
    if (ids.has(e.id)) {
      dupes += 1;
      continue;
    }
    ids.add(e.id);
    uniqueEntries.push(e);
  }
  if (dupes) warnings.push(`Duplicate IDs skipped: ${dupes}`);

  const payload = {
    meta: {
      lastCheckedAgainstIssf: LAST_CHECKED,
      generatedAt: new Date().toISOString(),
      officialPortal: ISSF_RULES_URL,
      currentRulebook: {
        title: CURRENT_RULEBOOK.title,
        edition: CURRENT_RULEBOOK.edition,
        print: CURRENT_RULEBOOK.print,
        effectiveDate: CURRENT_RULEBOOK.effectiveDate,
      },
    },
    entries: uniqueEntries,
  };

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(payload));
  const bytes = fs.statSync(outFile).size;

  writeMeta({
    documents: 1 + EXTRA_SOURCES.length,
    pagesIndexed,
    sections: uniqueEntries.length,
    warnings,
  });

  console.log('Rule Index');
  console.log('----------');
  console.log(`Documents: ${1 + EXTRA_SOURCES.length}`);
  console.log(`Pages indexed: ${pagesIndexed}`);
  console.log(`Rule sections: ${uniqueEntries.length}`);
  console.log(`Index bytes: ${bytes}`);
  console.log(`Warnings: ${warnings.length}`);
  warnings.forEach((w) => console.log(`  - ${w}`));
  if (uniqueEntries.length < 50) {
    throw new Error('Index too small — extraction likely failed');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
