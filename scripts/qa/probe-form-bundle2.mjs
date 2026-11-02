// Precise check: does the form bundle jar contain the fanout publisher?
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const work = path.resolve('scripts/qa/.probe-form2');
fs.rmSync(work, { recursive: true, force: true });
fs.mkdirSync(work, { recursive: true });
execSync(`tar -xf plugins/form/dist/bundle.zip -C ${work}`);
const jarDir = fs.readdirSync(work).find((name) => name.endsWith('.jar'));
fs.rmSync(path.join(work, 'static'), { recursive: true, force: true });

const listed = execSync(
  `jar tf ${path.join(work, jarDir)} com/vn9melody/openerp/plugin/sdk/event/`,
  { encoding: 'utf8', maxBuffer: 1024 * 1024 },
);
console.log(listed.trim());

execSync(`cd ${work} && jar xf ${jarDir} com/vn9melody/openerp/plugin/sdk/event/PluginEventPublisher.class`);
const bytes = fs.readFileSync(
  path.join(work, 'com/vn9melody/openerp/plugin/sdk/event/PluginEventPublisher.class'),
);
const text = bytes.toString('latin1');
console.log('has-fanout-header:', text.includes('X-Plugin-Fanout-Token'));
console.log('has-plugin-key-header:', text.includes('X-Plugin-Key'));
