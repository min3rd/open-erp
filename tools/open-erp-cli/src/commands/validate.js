import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readManifest, validateManifest } from '../lib/manifest.js';
import { sha256Text } from '../lib/checksum.js';

export async function validateCommand(flags) {
  const dir = flags.dir || process.cwd();
  const manifest = readManifest(dir);
  const errors = [...validateManifest(manifest)];

  for (const migration of manifest.migrations || []) {
    if (!migration.file || migration.file.includes('/') || migration.file.includes('\\')) {
      continue;
    }
    const path = join(dir, 'migrations', migration.file);
    if (!existsSync(path)) {
      errors.push(`migration file missing: migrations/${migration.file}`);
      continue;
    }
    const checksum = `sha256:${sha256Text(readFileSync(path))}`;
    if (checksum !== migration.checksum) {
      errors.push(`migration ${migration.file}: checksum mismatch`);
    }
  }

  const remote = flags.coreUrl ? await validateRemote(flags.coreUrl, flags.token || process.env.OPENERP_TOKEN, manifest) : [];
  const failed = errors.length > 0 || remote.some((item) => item.status === 'FAIL');
  if (flags.json) {
    console.log(JSON.stringify({
      ok: !failed,
      manifest: `${manifest.id}@${manifest.version}`,
      errors,
      remote,
    }, null, 2));
  } else {
    for (const error of errors) {
      console.error(`  FAIL ${error}`);
    }
    for (const item of remote) {
      console.log(`  ${item.status} ${item.check}: ${item.message}`);
    }
    if (!failed) {
      const entities = (manifest.entities || []).length;
      const permissions = (manifest.permissions || []).length;
      const contributions = ((manifest.ui_manifest || {}).contributions || []).length;
      console.log(`plugin.json OK (id=${manifest.id}, version=${manifest.version}, entities=${entities}, permissions=${permissions}, contributions=${contributions})`);
    } else {
      console.error(`plugin.json INVALID (${errors.length} local error(s), ${remote.filter((item) => item.status === 'FAIL').length} remote failure(s))`);
    }
  }
  if (failed) {
    process.exitCode = 1;
  }
}

async function validateRemote(coreUrl, token, manifest) {
  const base = String(coreUrl).replace(/\/+$/, '');
  const results = [];
  const targets = (manifest.relations || [])
    .map((relation) => relation.target)
    .filter((target) => target.startsWith('core.') || target.startsWith('plugin:'));
  for (const target of [...new Set(targets)]) {
    results.push(await lookup(base, token, 'entity', target, `/api/v1/plugins/entity-registry?entity=${encodeURIComponent(target)}`));
  }
  const slots = [...new Set(((manifest.ui_manifest || {}).contributions || []).map((item) => item.slot).filter(Boolean))];
  for (const slot of slots) {
    results.push(await lookup(base, token, 'slot', slot, `/api/v1/plugins/ui-slots?slot=${encodeURIComponent(slot)}`));
  }
  return results;
}

async function lookup(base, token, check, name, path) {
  try {
    const response = await fetch(`${base}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}`, Accept: 'application/json' } : { Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
    const body = await response.json().catch(() => null);
    if (response.ok) {
      return { check: `${check}:${name}`, status: 'PASS', message: body?.code || 'found' };
    }
    if (response.status === 404) {
      return { check: `${check}:${name}`, status: 'FAIL', message: body?.code || 'not found' };
    }
    if (response.status === 401 || response.status === 403) {
      return { check: `${check}:${name}`, status: 'WARN', message: 'authentication required; pass --token or OPENERP_TOKEN' };
    }
    return { check: `${check}:${name}`, status: 'WARN', message: `HTTP ${response.status}` };
  } catch (error) {
    return { check: `${check}:${name}`, status: 'WARN', message: error.message };
  }
}
