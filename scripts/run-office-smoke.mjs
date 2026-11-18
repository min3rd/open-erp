import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const plugin = path.join(root, 'plugins/office-webapp/web');
const esbuild = path.join(root, 'src/frontend/web/node_modules/esbuild/bin/esbuild');
const outDir = path.join(plugin, '.tmp');
const outFile = path.join(outDir, 'smoke.mjs');

if (!fs.existsSync(esbuild)) {
  console.error('Missing esbuild. Run npm install in src/frontend/web first.');
  process.exit(1);
}
fs.mkdirSync(outDir, { recursive: true });

const build = spawnSync(process.execPath, [
  esbuild,
  path.join(plugin, 'scripts/smoke.mts'),
  '--bundle',
  '--platform=node',
  '--format=esm',
  `--outfile=${outFile}`,
], { stdio: 'inherit' });

if (build.status !== 0) process.exit(build.status ?? 1);

const run = spawnSync(process.execPath, [outFile], { stdio: 'inherit' });
process.exit(run.status ?? 1);
