import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { isValidSemver } from './semver.js';

export const PLUGIN_KEY_PATTERN = /^[a-z][a-z0-9-]{2,49}$/;
export const PERMISSION_PATTERN = /^[a-z][a-z0-9-]*:[a-z][a-z0-9-]*:[a-z][a-z0-9-]*$/;
export const RESERVED_KEYS = new Set(['core', 'iam', 'platform', 'organization', 'plugins']);
export const RENDER_MODES = new Set(['WEB_COMPONENT', 'MODULE_FEDERATION', 'IFRAME']);

export function readManifest(projectDir) {
  const path = join(projectDir, 'plugin.json');
  if (!existsSync(path)) {
    throw new Error(`plugin.json not found in ${projectDir}`);
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function writeManifest(projectDir, manifest) {
  writeFileSync(join(projectDir, 'plugin.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

export function validateManifest(manifest) {
  const errors = [];
  if (!manifest || typeof manifest !== 'object') {
    errors.push('manifest must be a JSON object');
    return errors;
  }
  const key = manifest.id || manifest.plugin_key;
  if (!key || !PLUGIN_KEY_PATTERN.test(key)) {
    errors.push('id/plugin_key must be lowercase kebab-case (3-50 chars)');
  } else if (RESERVED_KEYS.has(key)) {
    errors.push(`id/plugin_key "${key}" is reserved`);
  }
  if (!isValidSemver(manifest.version)) {
    errors.push('version must be SemVer MAJOR.MINOR.PATCH');
  }
  if (!manifest.core_version_compatibility) {
    errors.push('core_version_compatibility is required');
  }
  for (const permission of manifest.permissions || []) {
    const code = typeof permission === 'string' ? permission : permission.code;
    if (!PERMISSION_PATTERN.test(code || '')) {
      errors.push(`invalid permission code: ${code}`);
    }
  }
  const entities = manifest.entities || [];
  const seenEntities = new Set();
  for (const entity of entities) {
    if (!entity || !entity.name) {
      errors.push('every entity needs a name');
      continue;
    }
    if (seenEntities.has(entity.name)) {
      errors.push(`duplicate entity: ${entity.name}`);
    }
    seenEntities.add(entity.name);
  }
  for (const contribution of (manifest.ui_manifest || {}).contributions || []) {
    if (!contribution.slot) {
      errors.push('ui contribution requires a slot');
    }
    const mode = (contribution.render_mode || 'IFRAME').toUpperCase();
    if (!RENDER_MODES.has(mode)) {
      errors.push(`invalid render_mode: ${contribution.render_mode}`);
    }
  }
  return errors;
}
