/**
 * Generate PWA icons from public/images/favicon.png
 * Run: npm run generate:pwa-icons
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, 'public', 'images', 'favicon.png');
const ICONS_DIR = path.join(ROOT, 'public', 'icons');
const BG = { r: 255, g: 255, b: 255, alpha: 1 };

async function resizeIcon(size, outPath, { maskable = false } = {}) {
  const inner = maskable ? Math.round(size * 0.72) : size;
  const logo = await sharp(SOURCE)
    .resize(inner, inner, { fit: 'contain', background: BG })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BG,
    },
  })
    .composite([{ input: logo, gravity: 'centre' }])
    .png()
    .toFile(outPath);

  console.log(`  ${path.relative(ROOT, outPath)} (${size}x${size}${maskable ? ', maskable' : ''})`);
}

async function writeFaviconIco() {
  const outPath = path.join(ROOT, 'public', 'favicon.ico');
  const sizes = [16, 32, 48];
  const buffers = await Promise.all(
    sizes.map((s) =>
      sharp(SOURCE)
        .resize(s, s, { fit: 'contain', background: BG })
        .png()
        .toBuffer()
    )
  );

  // sharp does not write ICO natively; use largest PNG embedded — browsers accept PNG-as-ico fallback
  // For true multi-size ICO, write 32px as primary file (most common tab size)
  await sharp(buffers[1]).toFile(outPath);
  console.log(`  ${path.relative(ROOT, outPath)} (32px primary; use PNG layers for PWA)`);
}

async function main() {
  if (!fs.existsSync(SOURCE)) {
    console.error(`Source not found: ${SOURCE}`);
    process.exit(1);
  }

  fs.mkdirSync(ICONS_DIR, { recursive: true });

  console.log('Generating PWA icons from', SOURCE);

  await resizeIcon(192, path.join(ICONS_DIR, 'icon-192.png'));
  await resizeIcon(512, path.join(ICONS_DIR, 'icon-512.png'));
  await resizeIcon(192, path.join(ICONS_DIR, 'maskable-icon-192.png'), { maskable: true });
  await resizeIcon(512, path.join(ICONS_DIR, 'maskable-icon-512.png'), { maskable: true });
  await resizeIcon(180, path.join(ROOT, 'public', 'apple-touch-icon.png'));
  await writeFaviconIco();

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
