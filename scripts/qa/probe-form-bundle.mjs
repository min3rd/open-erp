// Inspect the packaged form bundle: does plugin-backend.jar contain the NEW
// PluginEventPublisher (with the fanout header) and the right config?
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('plugins/form/dist');
const work = path.resolve('scripts/qa/.probe-form');
fs.rmSync(work, { recursive: true, force: true });
fs.mkdirSync(work, { recursive: true });

execSync(`tar -xf ${path.join(dist, 'bundle.zip')} -C ${work}`);
const jarDir = fs.readdirSync(work).find((name) => name.endsWith('.jar'));
console.log('jar:', jarDir);
const classes = execSync(`jar tf ${path.join(work, jarDir)}`, { encoding: 'utf8' })
  .split('\n')
  .filter((line) => line.includes('PluginEventPublisher'));
console.log('publisher classes:', classes);

// Verify the fanout header is in the compiled class (string constant check).
if (classes.length > 0) {
  execSync(`cd ${work} && jar xf ${jarDir} ${classes[0].replaceAll('/', '/')}`);
  const bytes = fs.readFileSync(path.join(work, classes[0]));
  console.log('contains X-Plugin-Fanout-Token:', bytes.includes('X-Plugin-Fanout-Token'));
  console.log('contains X-Plugin-Key:', bytes.includes('X-Plugin-Key'));
}
