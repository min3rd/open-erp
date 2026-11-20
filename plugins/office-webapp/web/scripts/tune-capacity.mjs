/**
 * Tunes per-page capacity for a generated calibration: while a page starts on
 * different content than Word's page of the same number, the previous page gets
 * one more line of room (the page break is then one line later, like Word's).
 *
 *   node scripts/tune-capacity.mjs <sample.docx> [--rounds 4] [--base 894] [--line 23]
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const sample = process.argv[2] ?? 'sample-real-proposal.docx';
const arg = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? Number(process.argv[index + 1]) : fallback;
};
const rounds = arg('--rounds', 4);
const base = arg('--base', 894);
const line = arg('--line', 23);
const stem = sample.replace(/\.[^.]+$/, '');
const path = `samples/${stem}-calibration.json`;
const wordPagesPath = '.tmp/word-pdf-pages.json';
const wordPages = (JSON.parse(fs.readFileSync(wordPagesPath, 'utf8')).pages ?? []);
const expected = wordPages.length;

let calibration = JSON.parse(fs.readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
calibration.pageContentHeight = calibration.pageContentHeight ?? {};

const measure = (tag) => {
  spawnSync(process.execPath, ['scripts/qa-parity-capture.mjs', '', tag, '--sample', sample], { encoding: 'utf8' });
  spawnSync(process.execPath, ['scripts/word-page-dice.mjs', `.tmp/parity-${tag}.json`, wordPagesPath, '--json', `.tmp/dice-${tag}.json`], { encoding: 'utf8' });
  const dice = JSON.parse(fs.readFileSync(`.tmp/dice-${tag}.json`, 'utf8'));
  return dice;
};

for (let round = 0; round <= rounds; round++) {
  const dice = measure(`capacity-${round}`);
  const low = dice.pages.filter((entry) => entry.startDice < 0.5).map((entry) => entry.page);
  console.log(`round ${round}: pages=${dice.ourPages}/${expected} lowStart=${low.join(',') || 'none'} body=${dice.bodyDice.mean}`);
  if (dice.ourPages === expected && !low.length) break;
  if (!low.length || round === rounds) break;
  // Give the page before each mismatching start one extra line.
  for (const page of low) {
    const target = page - 1;
    if (target < 1) continue;
    calibration.pageContentHeight[String(target)] = (calibration.pageContentHeight[String(target)] ?? base) + line;
  }
  fs.writeFileSync(path, JSON.stringify(calibration, null, 1));
  console.log('  capacity now', JSON.stringify(calibration.pageContentHeight));
}
fs.writeFileSync(path, JSON.stringify(calibration, null, 1));
console.log('final capacity', JSON.stringify(calibration.pageContentHeight));
