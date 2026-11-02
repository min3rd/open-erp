// Verify both fresh bundles carry the SDK event publisher + fanout header.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

for (const plugin of ['form', 'workflow']) {
  const work = path.resolve(`scripts/qa/.verify-${plugin}`);
  fs.rmSync(work, { recursive: true, force: true });
  fs.mkdirSync(work, { recursive: true });
  execSync(`tar -xf plugins/${plugin}/dist/bundle.zip -C ${work}`);
  const jar = fs.readdirSync(work).find((name) => name.endsWith('.jar'));
  const cls = 'com/vn9melody/openerp/plugin/sdk/event/PluginEventPublisher.class';
  try {
    execSync(`cd ${work} && jar xf ${jar} ${cls}`);
    const text = fs.readFileSync(path.join(work, cls)).toString('latin1');
    console.log(plugin, 'publisher:', text.includes('X-Plugin-Fanout-Token') ? 'FANOUT-OK' : 'STALE');
  } catch (e) {
    console.log(plugin, 'publisher: CLASS-MISSING');
  }
}
