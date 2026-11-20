import { spawnSync } from 'node:child_process';

const runs = [
  ['hintSlack=30&hintFloor=0.35', 'h30f35'],
  ['hintSlack=36&hintFloor=0.4', 'h36f40'],
  ['hintSlack=36&hintFloor=0.5', 'h36f50'],
  ['hintSlack=40&hintFloor=0.45', 'h40f45'],
];
for (const [query, tag] of runs) {
  spawnSync(process.execPath, ['scripts/qa-parity-capture.mjs', query, tag], { encoding: 'utf8' });
  const dice = spawnSync(process.execPath, ['scripts/word-page-dice.mjs', `.tmp/parity-${tag}.json`, '--json', `.tmp/dice-${tag}.json`], { encoding: 'utf8' });
  try {
    const parsed = JSON.parse(dice.stdout.replace(/^[^{]*/, ''));
    console.log(tag, query, `pages=${parsed.ourPages} start=${parsed.startDice.mean} body=${parsed.bodyDice.mean} ge50=${parsed.bodyDice.ge_0_50} lt50=${parsed.bodyDice.lt_0_50}`);
  } catch {
    console.log(tag, 'parse failed', dice.stderr.slice(0, 120));
  }
}
