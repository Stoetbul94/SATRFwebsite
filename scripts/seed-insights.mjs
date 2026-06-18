/**
 * One-time seed for Firing Line insights in Firestore.
 * Usage: node scripts/seed-insights.mjs [--apply]
 * Default is dry-run.
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const apply = process.argv.includes('--apply');

function loadEnv() {
  const envPath = resolve(__dirname, '../.env.local');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();

const SEED_ARTICLES = [
  {
    slug: 'understanding-3-position-rifle',
    type: 'article',
    category: '3P',
    title: 'Understanding 3-Position Rifle',
    summary: 'A quick guide to kneeling, prone and standing in 50m rifle competition.',
    readTime: '3 min read',
    coverImageUrl: '/images/sport-collage-satrf.png',
    featured: true,
    bodyMarkdown: `Three-position rifle combines kneeling, prone and standing — each with its own stability challenges and sighting rhythm. At 50m, athletes shoot a defined series in each position before totals decide qualification standing.

Kneeling rewards a solid support triangle and controlled breathing. Prone is the steadiest platform for precision. Standing demands balance, core strength and a repeatable natural point of aim.

SATRF national events follow ISSF qualification formats. Use this guide as a starting point before your first 3P match or when helping new club members understand the discipline.`,
  },
  {
    slug: 'strong-prone-position',
    type: 'article',
    category: 'Prone',
    title: 'What Makes a Strong Prone Position?',
    summary: 'Stability, natural point of aim and repeatability explained in simple terms.',
    readTime: '2 min read',
    coverImageUrl: '/images/affiliates/ISSF-Logo.jpg',
    featured: false,
    bodyMarkdown: `A strong prone position starts with a natural alignment to the target — rifle, spine and legs working together so the sight picture returns after each shot without muscling the rifle.

Contact points matter: chest support, elbow placement and head position should feel relaxed, not strained. Small adjustments beat big resets once you are on the line.

Repeatability wins matches. Build a checklist for training: position, sight picture, follow-through — then trust it in competition.`,
  },
  {
    slug: 'f-class-long-range-precision',
    type: 'article',
    category: 'F-Class',
    title: 'F-Class and Long-Range Precision',
    summary: 'A short introduction to rifle setup, wind reading and long-range discipline.',
    readTime: '2 min read',
    coverImageUrl: '/images/affiliates/SASSCO_Logo.jpeg',
    featured: false,
    bodyMarkdown: `F-Class extends precision shooting with specialized rifle setups and emphasis on reading wind and mirage over multiple distances.

Equipment consistency — stock fit, trigger, and ammunition — frees attention for downrange conditions. Log your sight settings and learn how your rifle responds in different light.

Whether you are moving from short-range target rifle or joining a club F-Class day, start with fundamentals and add complexity as your group size tightens.`,
  },
];

async function main() {
  const { initializeApp, cert, getApps } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');

  if (!getApps().length) {
    const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!key) {
      console.error('FIREBASE_SERVICE_ACCOUNT_KEY required');
      process.exit(1);
    }
    initializeApp({
      credential: cert(JSON.parse(key)),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'satrf-website',
    });
  }

  const db = getFirestore();
  const now = new Date().toISOString();
  const editorEmail = (process.env.CONTENT_EDITOR_EMAIL || 'techaim10.9@gmail.com').toLowerCase();

  console.log(apply ? 'APPLY mode' : 'DRY RUN');
  console.log(`Seeding ${SEED_ARTICLES.length} articles…`);

  for (const article of SEED_ARTICLES) {
    const existing = await db
      .collection('insights')
      .where('slug', '==', article.slug)
      .limit(1)
      .get();

    if (!existing.empty) {
      console.log(`  skip (exists): ${article.slug}`);
      continue;
    }

    const doc = {
      ...article,
      status: 'published',
      authorEmail: editorEmail,
      authorId: 'seed-script',
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    console.log(`  ${apply ? 'write' : 'would write'}: ${article.slug}`);
    if (apply) {
      await db.collection('insights').add(doc);
    }
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
