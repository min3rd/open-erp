import { spawnSync } from 'node:child_process';

for (const [query, tag] of [
  ['hintSlack=48&hintFloor=0.5', 'sh48'],
  ['hintSlack=36&hintFloor=0.6', 'sh36f60'],
]) {
  spawnSync(process.execPath, ['scripts/qa-parity-capture.mjs', query, tag], { encoding: 'utf8' });
  const dice = spawnSync(process.execPath, ['scripts/word-page-dice.mjs', `.tmp/parity-${tag}.json`, '--json', `.tmp/dice-${tag}.json`], { encoding: 'utf8' });
  try {
    const parsed = JSON.parse(dice.stdout.replace(/^[^{]*/, ''));
    console.log(tag, query, `pages=${parsed.ourPages} body=${parsed.bodyDice.mean} lt50=${parsed.bodyDice.lt_0_50}`);
  } catch {
    console.log(tag, 'parse failed');
  }
}
