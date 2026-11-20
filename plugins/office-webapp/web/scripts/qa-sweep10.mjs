import { spawnSync } from 'node:child_process';

const runs = [
  ['hintSlack=28&hintFloor=0.4', 'x28f40'],
  ['hintSlack=28&hintFloor=0.5', 'x28f50'],
  ['hintSlack=28&hintFloor=0.6', 'x28f60'],
  ['hintSlack=28&hintFloor=0.7', 'x28f70'],
];
for (const [query, tag] of runs) {
  spawnSync(process.execPath, ['scripts/qa-parity-capture.mjs', query, tag], { encoding: 'utf8' });
  const dice = spawnSync(process.execPath, ['scripts/word-page-dice.mjs', `.tmp/parity-${tag}.json`, '--json', `.tmp/dice-${tag}.json`], { encoding: 'utf8' });
  try {
    const parsed = JSON.parse(dice.stdout.replace(/^[^{]*/, ''));
    console.log(tag, query, `pages=${parsed.ourPages} body=${parsed.bodyDice.mean} lt50=${parsed.bodyDice.lt_0_50} ge50=${parsed.bodyDice.ge_0_50}`);
  } catch {
    console.log(tag, 'parse failed');
  }
}
