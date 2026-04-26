// scripts/verify-quiz-data.mjs — run via `node scripts/verify-quiz-data.mjs`
// Asserts the quiz data structure invariants. Exit code 1 on any failure.

import { execSync } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const tmp = resolve(root, 'node_modules/.cache/quiz-verify');

if (!existsSync(tmp)) mkdirSync(tmp, { recursive: true });

// Compile src/data/quiz.ts → temp .mjs
execSync(
  `npx tsc src/data/quiz.ts --target ES2022 --module ES2022 --moduleResolution Bundler --outDir "${tmp}" --skipLibCheck`,
  { cwd: root, stdio: 'inherit' }
);

const mod = await import(pathToFileURL(resolve(tmp, 'quiz.js')).href);
const { QUESTIONS, PERSONALITY_TYPES, contribution, scoreToCode, scoreToPercent } = mod;

let failures = 0;
const fail = (msg) => { failures++; console.error('✗ ' + msg); };
const pass = (msg) => console.log('✓ ' + msg);

// Q1: 35 questions exactly
QUESTIONS.length === 35
  ? pass(`QUESTIONS has exactly 35 entries`)
  : fail(`expected 35 questions, got ${QUESTIONS.length}`);

// Q2: each dim has exactly 7 questions
const dims = ['RC', 'WT', 'SI', 'FL', 'ED'];
for (const d of dims) {
  const n = QUESTIONS.filter(q => q.dim === d).length;
  n === 7 ? pass(`dim ${d}: 7 questions`) : fail(`dim ${d}: expected 7, got ${n}`);
}

// Q3: each dim has 5 (+1) + 2 (-1) directions
for (const d of dims) {
  const pos = QUESTIONS.filter(q => q.dim === d && q.direction === 1).length;
  const neg = QUESTIONS.filter(q => q.dim === d && q.direction === -1).length;
  if (pos === 5 && neg === 2) pass(`dim ${d}: direction split 5/2`);
  else fail(`dim ${d}: expected 5+/2-, got ${pos}+/${neg}-`);
}

// Q4: ids are 1..35 unique
const ids = new Set(QUESTIONS.map(q => q.id));
ids.size === 35 && [...ids].every(i => i >= 1 && i <= 35)
  ? pass(`question ids 1..35 unique`)
  : fail(`question ids not 1..35 unique`);

// Q5: every question has non-empty zh/en/ko text
let textOk = true;
for (const q of QUESTIONS) {
  for (const lang of ['zh', 'en', 'ko']) {
    if (!q.text[lang] || q.text[lang].trim().length < 5) {
      fail(`q.id=${q.id} text.${lang} empty or too short: "${q.text[lang]}"`);
      textOk = false;
    }
  }
}
if (textOk) pass(`all 35 × 3 = 105 question texts non-empty`);

// T1: 16 personality types
const typeCount = Object.keys(PERSONALITY_TYPES).length;
typeCount === 16 ? pass(`16 personality types`) : fail(`expected 16 types, got ${typeCount}`);

// T2: each type has tagline + variants populated
let typesOk = true;
for (const [code, t] of Object.entries(PERSONALITY_TYPES)) {
  if (code.length !== 4) { fail(`type code ${code} not 4 chars`); typesOk = false; }
  for (const lang of ['zh', 'en', 'ko']) {
    if (!t.tagline?.[lang]) { fail(`${code} tagline.${lang} empty`); typesOk = false; }
    if (!t.variants?.E?.blurb?.[lang]) { fail(`${code} variants.E.blurb.${lang} empty`); typesOk = false; }
    if (!t.variants?.D?.blurb?.[lang]) { fail(`${code} variants.D.blurb.${lang} empty`); typesOk = false; }
    if (!t.variants?.E?.label?.[lang]) { fail(`${code} variants.E.label.${lang} empty`); typesOk = false; }
    if (!t.variants?.D?.label?.[lang]) { fail(`${code} variants.D.label.${lang} empty`); typesOk = false; }
  }
}
if (typesOk) pass(`all 16 types: tagline + variants populated in all langs`);

// T3: all images use .webp
let imagesOk = true;
for (const [code, t] of Object.entries(PERSONALITY_TYPES)) {
  if (!t.image?.endsWith('.webp')) {
    fail(`${code} image not .webp: ${t.image}`);
    imagesOk = false;
  }
}
if (imagesOk) pass(`all 16 type images use .webp`);

// T4: variant labels are fixed pairs
let labelsOk = true;
for (const [code, t] of Object.entries(PERSONALITY_TYPES)) {
  if (t.variants.E.label.zh !== '淡定型' || t.variants.E.label.en !== 'Even' || t.variants.E.label.ko !== '평정형') {
    fail(`${code} variants.E.label not fixed pair`);
    labelsOk = false;
  }
  if (t.variants.D.label.zh !== '求胜型' || t.variants.D.label.en !== 'Driven' || t.variants.D.label.ko !== '승부욕형') {
    fail(`${code} variants.D.label not fixed pair`);
    labelsOk = false;
  }
}
if (labelsOk) pass(`all 16 types: variant labels are correct fixed pairs`);

// T5: partner and nemesis codes refer to existing types
let refsOk = true;
for (const [code, t] of Object.entries(PERSONALITY_TYPES)) {
  for (const p of t.partner || []) {
    if (!PERSONALITY_TYPES[p]) { fail(`${code} partner ${p} does not exist`); refsOk = false; }
  }
  if (t.nemesis && !PERSONALITY_TYPES[t.nemesis]) {
    fail(`${code} nemesis ${t.nemesis} does not exist`);
    refsOk = false;
  }
}
if (refsOk) pass(`all partner/nemesis references resolve`);

// S1: contribution math
contribution(0, 1) === 3   ? pass(`contribution(0, +1) = +3`) : fail(`contribution(0, +1) wrong`);
contribution(6, 1) === -3  ? pass(`contribution(6, +1) = -3`) : fail(`contribution(6, +1) wrong`);
contribution(3, 1) === 0   ? pass(`contribution(3, +1) = 0`)  : fail(`contribution(3, +1) wrong`);
contribution(0, -1) === -3 ? pass(`contribution(0, -1) = -3`) : fail(`contribution(0, -1) wrong`);
contribution(6, -1) === 3  ? pass(`contribution(6, -1) = +3`) : fail(`contribution(6, -1) wrong`);

// S2: scoreToCode
const c1 = scoreToCode({ RC: 5, WT: -3, SI: 1, FL: -2, ED: 0 });
c1.code === 'RTSL' && c1.variant === 'E'
  ? pass(`scoreToCode mixed → RTSL-E`)
  : fail(`scoreToCode mixed got ${c1.code}-${c1.variant}`);

const c2 = scoreToCode({ RC: 0, WT: 0, SI: 0, FL: 0, ED: -1 });
c2.code === 'RWSF' && c2.variant === 'D'
  ? pass(`scoreToCode all zeros + ED<0 → RWSF-D`)
  : fail(`scoreToCode boundary got ${c2.code}-${c2.variant}`);

// S3: scoreToPercent boundaries
scoreToPercent(0) === 50    ? pass(`scoreToPercent(0) = 50`)   : fail(`scoreToPercent(0) wrong`);
scoreToPercent(21) === 100  ? pass(`scoreToPercent(21) = 100`) : fail(`scoreToPercent(21) wrong`);
scoreToPercent(-21) === 0   ? pass(`scoreToPercent(-21) = 0`)  : fail(`scoreToPercent(-21) wrong`);

// S4: scoreToPercent clamping (Task 1 review fix)
scoreToPercent(50) === 100  ? pass(`scoreToPercent(50) clamps to 100`)  : fail(`scoreToPercent(50) clamping broken`);
scoreToPercent(-50) === 0   ? pass(`scoreToPercent(-50) clamps to 0`)   : fail(`scoreToPercent(-50) clamping broken`);

if (failures > 0) {
  console.error(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log(`\nAll quiz data invariants OK.`);
