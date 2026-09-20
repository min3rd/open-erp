import { readManifest, validateManifest } from '../lib/manifest.js';

export async function validateCommand(flags) {
  const dir = flags.dir || process.cwd();
  const manifest = readManifest(dir);
  const errors = validateManifest(manifest);
  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    console.error(`plugin.json INVALID (${errors.length} error(s))`);
    process.exitCode = 1;
    return;
  }
  const entities = (manifest.entities || []).length;
  const permissions = (manifest.permissions || []).length;
  const contributions = ((manifest.ui_manifest || {}).contributions || []).length;
  console.log(`plugin.json OK (id=${manifest.id}, version=${manifest.version}, entities=${entities}, permissions=${permissions}, contributions=${contributions})`);
}
