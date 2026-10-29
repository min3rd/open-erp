import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { isValidSemver } from './semver.js';

export const PLUGIN_KEY_PATTERN = /^[a-z][a-z0-9-]{2,49}$/;
export const PERMISSION_PATTERN = /^[a-z][a-z0-9-]*:[a-z][a-z0-9-]*:[a-z][a-z0-9-]*$/;
export const RESERVED_KEYS = new Set(['core', 'iam', 'platform', 'organization', 'plugins']);
export const RENDER_MODES = new Set(['WEB_COMPONENT', 'MODULE_FEDERATION']);

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
  if (manifest.schema_version && manifest.schema_version !== '2.0') {
    errors.push('schema_version must be "2.0" when present');
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
  const seenTables = new Set();
  const fieldTypes = new Set(['string', 'text', 'int', 'long', 'decimal', 'bool', 'date', 'datetime', 'enum', 'json', 'uuid']);
  const fieldsByName = new Map();
  for (const entity of entities) {
    if (!entity || !entity.name) {
      errors.push('every entity needs a name');
      continue;
    }
    if (!/^[A-Z][A-Za-z0-9]{1,63}$/.test(entity.name)) {
      errors.push(`invalid entity name: ${entity.name}`);
    }
    if (seenEntities.has(entity.name)) {
      errors.push(`duplicate entity: ${entity.name}`);
    }
    seenEntities.add(entity.name);
    if (!entity.table || !/^[a-z][a-z0-9_]*$/.test(entity.table)) {
      errors.push(`entity ${entity.name}: table must be snake_case`);
    } else if (seenTables.has(entity.table)) {
      errors.push(`duplicate entity table: ${entity.table}`);
    }
    seenTables.add(entity.table);
    const seenFields = new Set();
    fieldsByName.set(entity.name, new Set());
    for (const field of entity.fields || []) {
      if (!field.name || !/^[a-z][a-z0-9_]*$/.test(field.name)) {
        errors.push(`entity ${entity.name}: field must be snake_case`);
      } else if (seenFields.has(field.name)) {
        errors.push(`duplicate field ${entity.name}.${field.name}`);
      }
      seenFields.add(field.name);
      fieldsByName.get(entity.name).add(field.name);
      if (field.type && !fieldTypes.has(field.type)) {
        errors.push(`entity ${entity.name}: invalid field type ${field.type}`);
      }
      if (field.type === 'enum' && (!Array.isArray(field.enum_values) || field.enum_values.length === 0)) {
        errors.push(`entity ${entity.name}.${field.name}: enum_values required`);
      }
    }
    for (const validator of entity.validators || []) {
      if (!validator.field || !seenFields.has(validator.field)) {
        errors.push(`entity ${entity.name}: validator references unknown field ${validator.field}`);
      }
      if (!validator.rule) {
        errors.push(`entity ${entity.name}: validator requires a rule`);
      }
    }
  }
  for (const relation of manifest.relations || []) {
    if (!relation.name || !relation.target || !relation.type || !relation.storage) {
      errors.push('relation requires name, type, target and storage');
      continue;
    }
    if (!/^[a-z][a-z0-9_]*$/.test(relation.name)) {
      errors.push(`invalid relation name: ${relation.name}`);
    }
    if (relation.owner_entity && !seenEntities.has(relation.owner_entity)) {
      errors.push(`relation ${relation.name}: unknown owner_entity ${relation.owner_entity}`);
    }
    if (!['self.', 'core.', 'plugin:'].some((prefix) => relation.target.startsWith(prefix))) {
      errors.push(`invalid relation target: ${relation.target}`);
    }
    if (relation.target.startsWith('self.')) {
      const target = relation.target.slice('self.'.length);
      if (!seenEntities.has(target)) {
        errors.push(`relation ${relation.name}: unknown self target ${target}`);
      }
    }
    if (relation.target.startsWith('self.') && relation.storage === 'SOFT_REF') {
      errors.push(`relation ${relation.name}: self target must use FK storage`);
    }
    if (!relation.target.startsWith('self.') && relation.storage === 'FK') {
      errors.push(`relation ${relation.name}: cross-plugin/core target must use SOFT_REF`);
    }
  }
  for (const migration of manifest.migrations || []) {
    if (!migration.file || !migration.checksum) {
      errors.push('migration requires file and checksum');
    } else if (migration.file.includes('/') || migration.file.includes('\\')) {
      errors.push(`migration ${migration.file}: file must be a basename`);
    } else if (!/^sha256:[a-f0-9]{64}$/.test(migration.checksum)) {
      errors.push(`migration ${migration.file}: checksum must be sha256:<64 hex>`);
    }
  }
  const screens = (manifest.ui_manifest || {}).screens || [];
  const seenRoutes = new Set();
  for (const screen of screens) {
    if (!screen.route || seenRoutes.has(screen.route)) {
      errors.push(`ui screen route is missing or duplicated: ${screen.route || '(empty)'}`);
    }
    seenRoutes.add(screen.route);
    const mode = (screen.render_mode || 'WEB_COMPONENT').toUpperCase();
    if (!RENDER_MODES.has(mode)) {
      errors.push(`ui screen ${screen.route}: invalid render_mode ${screen.render_mode}`);
    }
    if (mode === 'WEB_COMPONENT' && !screen.tag_name) {
      errors.push(`ui screen ${screen.route}: tag_name is required for WEB_COMPONENT`);
    }
  }
  for (const contribution of (manifest.ui_manifest || {}).contributions || []) {
    if (!contribution.slot) {
      errors.push('ui contribution requires a slot');
    } else if (!/^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$/.test(contribution.slot)) {
      errors.push(`invalid slot syntax: ${contribution.slot}`);
    }
    const mode = (contribution.render_mode || 'WEB_COMPONENT').toUpperCase();
    if (!RENDER_MODES.has(mode)) {
      errors.push(`invalid render_mode: ${contribution.render_mode}`);
    }
    if (mode === 'WEB_COMPONENT' && !contribution.tag_name) {
      errors.push(`ui contribution ${contribution.id || contribution.slot}: tag_name is required for WEB_COMPONENT`);
    }
  }
  for (const query of manifest.queries || []) {
    if (!query.id || !query.entity || !query.operation) {
      errors.push('query requires id, entity and operation');
      continue;
    }
    if (query.entity && !seenEntities.has(query.entity)) {
      errors.push(`query ${query.id}: unknown entity ${query.entity}`);
    }
    if (!['READ', 'WRITE'].includes(query.mode || 'READ')) {
      errors.push(`query ${query.id}: mode must be READ or WRITE`);
    }
    if (query.mode === 'WRITE' && ['INSERT', 'UPDATE'].includes(query.operation) && !query.values) {
      errors.push(`query ${query.id}: ${query.operation} query requires values`);
    }
    if (['UPDATE', 'DELETE'].includes(query.operation) && !(query.filters || []).length) {
      errors.push(`query ${query.id}: ${query.operation} requires filters`);
    }
  }
  for (const crud of (manifest.ui_manifest || {}).crud || []) {
    const fields = fieldsByName.get(crud.entity);
    if (!fields) {
      errors.push(`ui crud: unknown entity ${crud.entity}`);
      continue;
    }
    for (const column of crud.columns || []) {
      if (!fields.has(column)) {
        errors.push(`ui crud ${crud.entity}: unknown column ${column}`);
      }
    }
    for (const field of crud.form_fields || []) {
      if (!fields.has(field)) {
        errors.push(`ui crud ${crud.entity}: unknown form field ${field}`);
      }
    }
  }
  return errors;
}
