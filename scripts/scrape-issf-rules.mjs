import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'public', 'documents', 'issf');

const MAIN_URL = 'https://www.issf-sports.org/rules';
const BASE = 'https://www.issf-sports.org';

function decodeHtml(s) {
  return s.replace(/&amp;/g, '&');
}

function slugify(name) {
  return name
    .replace(/\.[a-z0-9]+$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function filenameForTitle(title) {
  const extMatch = title.match(/\.([a-z0-9]+)$/i);
  const ext = extMatch ? extMatch[1].toLowerCase() : 'pdf';
  return `${slugify(title)}.${ext}`;
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'SATRF-Website-Rules-Sync/1.0' },
  });
  if (!res.ok) throw new Error(`Failed ${url}: ${res.status}`);
  return res.text();
}

function extractPdfLinks(html) {
  const links = [];
  const re = /<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
  let m;
  while ((m = re.exec(html))) {
    const href = decodeHtml(m[1]);
    const title = m[2].trim();
    if (/getfile\.aspx/i.test(href) || /\.pdf$/i.test(href)) {
      links.push({ title, pdfUrl: href });
    }
  }
  return links;
}

function extractRuleNavLinks(html) {
  const links = [];
  const re =
    /<a class="text-white" href="(\/rules[^"]+)">\s*<div[^>]*>([^<]+)<img/gi;
  let m;
  while ((m = re.exec(html))) {
    const href = m[1];
    const title = m[2].trim();
    if (!links.some((l) => l.webUrl === `${BASE}${href}`)) {
      links.push({ title, webUrl: `${BASE}${href}` });
    }
  }
  return links;
}

async function downloadPdf(pdfUrl, filename) {
  const res = await fetch(pdfUrl, {
    headers: { 'User-Agent': 'SATRF-Website-Rules-Sync/1.0' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`PDF download failed ${pdfUrl}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const outPath = path.join(outDir, filename);
  fs.writeFileSync(outPath, buf);
  return { outPath, bytes: buf.length };
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  const mainHtml = await fetchHtml(MAIN_URL);
  fs.writeFileSync(path.join(__dirname, 'issf-rules-page.html'), mainHtml);

  const navLinks = extractRuleNavLinks(mainHtml);
  const pdfMap = new Map();

  for (const { title, pdfUrl } of extractPdfLinks(mainHtml)) {
    pdfMap.set(pdfUrl, { title, pdfUrl, section: 'ISSF Rules' });
  }

  for (const nav of navLinks) {
    const html = await fetchHtml(nav.webUrl);
    for (const { title, pdfUrl } of extractPdfLinks(html)) {
      if (!pdfMap.has(pdfUrl)) {
        pdfMap.set(pdfUrl, { title, pdfUrl, section: nav.title, webUrl: nav.webUrl });
      }
    }
  }

  const documents = [];
  for (const entry of pdfMap.values()) {
    const filename = filenameForTitle(entry.title);
    const localPath = `/documents/issf/${filename}`;
    console.log(`Downloading: ${entry.title}`);
    const { bytes } = await downloadPdf(entry.pdfUrl, filename);
    documents.push({
      ...entry,
      filename,
      localPath,
      bytes,
    });
  }

  const manifest = {
    scrapedAt: new Date().toISOString(),
    source: MAIN_URL,
    navLinks,
    documents,
  };

  fs.mkdirSync(path.join(root, 'src', 'data'), { recursive: true });
  fs.writeFileSync(path.join(root, 'src', 'data', 'issf-rules.json'), JSON.stringify(manifest, null, 2));
  console.log(`\nSaved ${documents.length} PDFs to public/documents/issf/`);
  console.log(`Manifest: src/data/issf-rules.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
