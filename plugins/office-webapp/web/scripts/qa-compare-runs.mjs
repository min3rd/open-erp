import { spawnSync } from 'node:child_process';

for (const tag of ['slk36', 'flr35', 'slk18', 'revert1']) {
  const out = spawnSync(process.execPath, ['scripts/word-page-dice.mjs', `.tmp/parity-${tag}.json`, '--json', `.tmp/dice-${tag}.json`], { encoding: 'utf8' });
  const parsed = out.stdout ? JSON.parse(out.stdout.replace(/^[^{]*/, '')) : null;
  console.log(tag, parsed ? `pages=${parsed.ourPages} start=${parsed.startDice.mean} body=${parsed.bodyDice.mean} ge50=${parsed.bodyDice.ge_0_50} lt50=${parsed.bodyDice.lt_0_50}` : out.stderr.slice(0, 200));
}
