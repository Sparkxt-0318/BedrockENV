import sharp from 'sharp';
import { readdirSync, writeFileSync } from 'fs';
import path from 'path';

const MEDIA_DIR = path.join(process.cwd(), 'public', 'media');

const CONFIGS = {
  'hero-delta-raw.jpg': { out: 'hero-delta', maxWidth: 2400, quality: 80 },
  'chapter-soil-raw.jpg': { out: 'chapter-soil', maxWidth: 1200, quality: 80 },
  'chapter-air-raw.jpg': { out: 'chapter-air', maxWidth: 1200, quality: 80 },
  'chapter-flood-raw.jpg': { out: 'chapter-flood', maxWidth: 1200, quality: 80 },
  'blue-marble-raw.jpg': { out: 'blue-marble', maxWidth: 1200, quality: 80 },
};

const placeholders = {};

for (const [src, cfg] of Object.entries(CONFIGS)) {
  const input = path.join(MEDIA_DIR, src);
  const outWebp = path.join(MEDIA_DIR, `${cfg.out}.webp`);
  const outJpg = path.join(MEDIA_DIR, `${cfg.out}.jpg`);

  console.log(`Processing ${src}...`);

  const img = sharp(input);
  const meta = await img.metadata();
  const needsResize = meta.width > cfg.maxWidth;

  const pipeline = needsResize ? img.resize(cfg.maxWidth) : img;

  await pipeline.clone().webp({ quality: cfg.quality }).toFile(outWebp);
  console.log(`  → ${cfg.out}.webp`);

  await sharp(input)
    .resize(needsResize ? cfg.maxWidth : undefined)
    .jpeg({ quality: cfg.quality })
    .toFile(outJpg);
  console.log(`  → ${cfg.out}.jpg`);

  const lqipBuf = await sharp(input)
    .resize(20)
    .blur(2)
    .jpeg({ quality: 30 })
    .toBuffer();
  const lqipBase64 = `data:image/jpeg;base64,${lqipBuf.toString('base64')}`;
  placeholders[cfg.out] = lqipBase64;
  console.log(`  → LQIP placeholder (${lqipBuf.length} bytes)`);
}

const outPath = path.join(process.cwd(), 'lib', 'media', 'placeholders.ts');
const tsContent = `// Auto-generated LQIP placeholders — do not edit\nexport const placeholders: Record<string, string> = ${JSON.stringify(placeholders, null, 2)};\n`;

import { mkdirSync } from 'fs';
mkdirSync(path.join(process.cwd(), 'lib', 'media'), { recursive: true });
writeFileSync(outPath, tsContent);
console.log(`\nPlaceholders written to ${outPath}`);

console.log('\nFinal files:');
for (const f of readdirSync(MEDIA_DIR).sort()) {
  if (!f.endsWith('-raw.jpg')) {
    const stat = await sharp(path.join(MEDIA_DIR, f)).metadata().catch(() => null);
    const size = (await import('fs')).statSync(path.join(MEDIA_DIR, f)).size;
    console.log(`  ${f}: ${(size / 1024).toFixed(0)}KB${stat ? ` (${stat.width}x${stat.height})` : ''}`);
  }
}
