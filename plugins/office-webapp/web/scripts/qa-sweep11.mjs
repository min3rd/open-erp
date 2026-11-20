import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const base = 'D:/Projects/open-erp/plugins/office-webapp/web/.tmp';
const word = JSON.parse(fs.readFileSync(`${base}/word-rows-392.json`, 'utf8').replace(/^\uFEFF/, ''));
const wordByRow = new Map(word.map((entry) => [entry.row, entry.page]));

const runs = [
  ['hintFloor=0.3&hintSlack=24', 'k03s24'],
  ['hintFloor=0.35&hintSlack=24', 'k035s24'],
];
for (const [query, tag] of runs) {
  spawnSync(process.execPath, ['scripts/qa-parity-capture.mjs', query, tag], { encoding: 'utf8' });
  const dice = spawnSync(process.execPath, ['scripts/word-page-dice.mjs', `.tmp/parity-${tag}.json`, '--json', `.tmp/dice-${tag}.json`], { encoding: 'utf8' });
  const rowsRun = spawnSync(process.execPath, ['scripts/qa-row-pages.mjs', 'sample-real-proposal.docx', '392', `${base}/rows-${tag}.json`], { encoding: 'utf8' });
  const rows = JSON.parse(fs.readFileSync(`${base}/rows-${tag}.json`, 'utf8'));
  const matched = rows.filter((entry) => wordByRow.get(entry.row) === entry.first).length;
  let summary = {};
  try { summary = JSON.parse(dice.stdout.replace(/^[^{]*/, '')); } catch { /* ignore */ }
  console.log(tag, `pages=${summary.ourPages} body=${summary.bodyDice?.mean} lt50=${summary.bodyDice?.lt_0_50} table5=${matched}/${rows.length}`);
}
