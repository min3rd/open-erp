import { spawnSync } from 'node:child_process';

const runs = [
  ['hintSlack=36', 'slk36'],
  ['hintFloor=0.35', 'flr35'],
  ['hintSlack=18', 'slk18'],
];
for (const [query, tag] of runs) {
  const result = spawnSync(process.execPath, ['scripts/qa-parity-capture.mjs', query, tag], { encoding: 'utf8' });
  const dice = spawnSync(process.execPath, ['scripts/word-page-dice.mjs', `.tmp/parity-${tag}.json`], { encoding: 'utf8' });
  const summary = (dice.stdout.match(/"ourPages": (\d+)/) ?? [])[1];
  const body = (dice.stdout.match(/"mean": (0\.\d+)/) ?? [])[1];
  console.log(tag, query, result.stdout.trim(), 'body', body);
}
