// scripts/convert-quiz-images.mjs — convert PNGs to WebP, log size delta
import sharp from 'sharp';
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const dir = 'public/assert/images/quiz';
const QUALITY = 85;

const files = (await readdir(dir)).filter((f) => f.endsWith('.png'));
if (files.length === 0) {
  console.error(`No .png files in ${dir}`);
  process.exit(1);
}

let beforeTotal = 0;
let afterTotal = 0;

for (const f of files.sort()) {
  const inPath = join(dir, f);
  const outPath = join(dir, f.replace(/\.png$/, '.webp'));
  const before = (await stat(inPath)).size;

  await sharp(inPath).webp({ quality: QUALITY }).toFile(outPath);

  const after = (await stat(outPath)).size;
  beforeTotal += before;
  afterTotal += after;
  const pct = ((1 - after / before) * 100).toFixed(0);
  console.log(`${f.padEnd(12)}  ${(before / 1024).toFixed(0).padStart(5)} KB → ${(after / 1024).toFixed(0).padStart(5)} KB  (-${pct}%)`);
}

console.log('─'.repeat(50));
console.log(`Total: ${(beforeTotal / 1024 / 1024).toFixed(1)} MB → ${(afterTotal / 1024 / 1024).toFixed(1)} MB  (-${((1 - afterTotal / beforeTotal) * 100).toFixed(0)}%)`);
console.log(`\nOriginal PNGs left in place. Delete them in Step 1.5.6 after verifying the WebPs render correctly.`);
