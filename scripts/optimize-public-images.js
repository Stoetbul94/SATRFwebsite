/**
 * Optimize large public images for web delivery.
 * Run: npm run optimize:images
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');

/** @type {{ input: string; maxWidth?: number; quality?: number }[]} */
const TARGETS = [
  { input: 'public/images/sport-collage-satrf.png', maxWidth: 1600, quality: 82 },
  { input: 'public/images/affiliates/SATRFLOGO.png', maxWidth: 300, quality: 85 },
  { input: 'public/brand/satrf-emblem-transparent.png', maxWidth: 512, quality: 88 },
  { input: 'public/brand/satrf-brand-banner.png', maxWidth: 1200, quality: 82 },
];

async function optimizeOne({ input, maxWidth = 1600, quality = 80 }) {
  const abs = path.join(ROOT, input);
  if (!fs.existsSync(abs)) {
    console.warn(`  skip (missing): ${input}`);
    return;
  }

  const parsed = path.parse(abs);
  const webpOut = path.join(parsed.dir, `${parsed.name}.webp`);
  const avifOut = path.join(parsed.dir, `${parsed.name}.avif`);

  let pipeline = sharp(abs);
  const meta = await pipeline.metadata();
  if (meta.width && maxWidth && meta.width > maxWidth) {
    pipeline = pipeline.resize(maxWidth, null, { withoutEnlargement: true });
  }

  await pipeline.clone().webp({ quality, effort: 4 }).toFile(webpOut);
  await pipeline.clone().avif({ quality: quality - 5, effort: 4 }).toFile(avifOut);

  const before = fs.statSync(abs).size;
  const afterWebp = fs.statSync(webpOut).size;
  console.log(
    `  ${input} → ${path.basename(webpOut)} (${Math.round(before / 1024)}KB → ${Math.round(afterWebp / 1024)}KB)`,
  );
}

async function main() {
  console.log('Optimizing public images…');
  for (const target of TARGETS) {
    await optimizeOne(target);
  }
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
