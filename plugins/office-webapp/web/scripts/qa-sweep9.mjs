import { spawnSync } from 'node:child_process';

for (const slack of [26, 28, 29]) {
  const tag = `s${slack}`;
  spawnSync(process.execPath, ['scripts/qa-parity-capture.mjs', `hintSlack=${slack}`, tag], { encoding: 'utf8' });
  const dice = spawnSync(process.execPath, ['scripts/word-page-dice.mjs', `.tmp/parity-${tag}.json`, '--json', `.tmp/dice-${tag}.json`], { encoding: 'utf8' });
  try {
    const parsed = JSON.parse(dice.stdout.replace(/^[^{]*/, ''));
    console.log(tag, `pages=${parsed.ourPages} body=${parsed.bodyDice.mean} lt50=${parsed.bodyDice.lt_0_50} ge50=${parsed.bodyDice.ge_0_50}`);
  } catch {
    console.log(tag, 'parse failed');
  }
}
