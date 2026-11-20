import { spawnSync } from 'node:child_process';

const runs = [
  ['hintSlack=30', 'g30'],
  ['hintSlack=32', 'g32'],
  ['hintSlack=36&hintFloor=0.3', 'g36f30'],
  ['hintSlack=40&hintFloor=0.3', 'g40f30'],
];
for (const [query, tag] of runs) {
  const capture = spawnSync(process.execPath, ['scripts/qa-parity-capture.mjs', query, tag], { encoding: 'utf8' });
  const dice = spawnSync(process.execPath, ['scripts/word-page-dice.mjs', `.tmp/parity-${tag}.json`, '--json', `.tmp/dice-${tag}.json`], { encoding: 'utf8' });
  let summary = 'n/a';
  try {
    const parsed = JSON.parse(dice.stdout.replace(/^[^{]*/, ''));
    summary = `pages=${parsed.ourPages} start=${parsed.startDice.mean} body=${parsed.bodyDice.mean} ge50=${parsed.bodyDice.ge_0_50} lt50=${parsed.bodyDice.lt_0_50}`;
  } catch {
    summary = dice.stderr.slice(0, 120);
  }
  console.log(tag, query, capture.stdout.trim(), summary);
}
