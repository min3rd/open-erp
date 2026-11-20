/**
 * Re-measures a generated calibration and drops the paragraph breaks that make
 * the document paginate differently from Word (the last breaks in the document
 * are the ones that fought the per-page capacity in practice).
 *
 *   node scripts/prune-calibration.mjs <sample.docx> [--rounds 3]
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const sample = process.argv[2] ?? 'sample-real-proposal.docx';
const rounds = Number(process.argv[process.argv.indexOf('--rounds') + 1] ?? 3) || 3;
const stem = sample.replace(/\.[^.]+$/, '');
const calibrationPath = `samples/${stem}-calibration.json`;
const wordPagesPath = process.argv.includes('--word-pages')
  ? process.argv[process.argv.indexOf('--word-pages') + 1]
  : '.tmp/word-pdf-pages.json';

if (!fs.existsSync(calibrationPath)) {
  console.error(`missing ${calibrationPath}`);
  process.exit(1);
}
const wordPages = JSON.parse(fs.readFileSync(wordPagesPath, 'utf8'));
const expected = (Array.isArray(wordPages) ? wordPages : wordPages.pages).length;

const capture = (tag) => {
  spawnSync(process.execPath, ['scripts/qa-parity-capture.mjs', '', tag, '--sample', sample], { encoding: 'utf8' });
  const parity = JSON.parse(fs.readFileSync(`.tmp/parity-${tag}.json`, 'utf8'));
  return parity.pages.length;
};

let calibration = JSON.parse(fs.readFileSync(calibrationPath, 'utf8').replace(/^\uFEFF/, ''));
let best = null;
for (let round = 0; round <= rounds; round++) {
  const pages = capture(`prune-${round}`);
  const breaks = Object.keys(calibration.paragraphBreaks ?? {}).map(Number).sort((a, b) => a - b);
  console.log(`round ${round}: pages=${pages} expected=${expected} breaks=${breaks.length}`);
  if (pages === expected) { best = calibration; break; }
  if (!breaks.length) break;
  // Drop the last breaks first: they are the ones that collide with the
  // per-page capacity in the tail of the document.
  const drop = breaks.slice(-2);
  for (const block of drop) delete calibration.paragraphBreaks[String(block)];
  fs.writeFileSync(calibrationPath, JSON.stringify(calibration, null, 1));
  console.log(`  dropped breaks ${drop.join(', ')}`);
}
if (best) {
  fs.writeFileSync(calibrationPath, JSON.stringify(best, null, 1));
  console.log('kept calibration with', Object.keys(best.paragraphBreaks ?? {}).length, 'breaks');
} else {
  console.log('no round matched the Word page count; left the last candidate in place');
}
