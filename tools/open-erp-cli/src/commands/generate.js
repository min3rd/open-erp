import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { readManifest, writeManifest, validateManifest } from '../lib/manifest.js';
import { writeFile } from '../lib/fsx.js';
import { packageName } from '../lib/templates.js';
import { sha256Text } from '../lib/checksum.js';
import { generateCrud } from '../lib/generator/crud.js';

export async function generateCommand(flags) {
  const sub = flags._[0];
  switch (sub) {
    case 'entity':
      return generateEntity(flags);
    case 'field':
      return generateField(flags);
    case 'relation':
      return generateRelation(flags);
    case 'crud':
      return generateCrud(flags);
    case 'menu':
      return generateMenu(flags);
    case 'ui-contribution':
      return generateUiContribution(flags);
    default:
      throw new Error('Usage: open-erp generate <entity|field|relation|crud|menu|ui-contribution> [options]');
  }
}

function generateEntity(flags) {
  const dir = process.cwd();
  const manifest = readManifest(dir);
  const name = flags.name;
  if (!name || !/^[A-Z][A-Za-z0-9]{1,63}$/.test(name)) {
    throw new Error('--name must be PascalCase (e.g. Invoice)');
  }
  const table = flags.table || `plg_${snake(manifest.id).replaceAll('-', '_')}_${snake(name)}s`;
  const pkg = packageName(manifest.id);
  const pkgPath = pkg.replaceAll('.', '/');
  const fields = parseFields(flags.fields || 'code:string,name:string');
  const entityPath = join(dir, `src/main/java/${pkgPath}/${name}.java`);
  const migrationDir = join(dir, 'migrations');
  const version = nextMigrationVersion(migrationDir);
  const migrationName = `V${version}__create_${snake(name)}.sql`;
  const migrationFile = `migrations/${migrationName}`;
  if (existsSync(entityPath) && !flags.force) {
    throw new Error(`${entityPath} already exists (use --force)`);
  }
  const migration = migrationSource(table, fields);
  writeFile(entityPath, entitySource(pkg, name, fields));
  writeFile(join(dir, migrationFile), migration);
  const permissionPrefix = `${manifest.id}:${snake(name).replaceAll('_', '-')}`;
  const permissionCode = `${permissionPrefix}:read`;
  manifest.entities = manifest.entities || [];
  if (!manifest.entities.some((entity) => entity.name === name)) {
    manifest.entities.push({
      name,
      table,
      storage_scope: 'TENANT',
      fields: fields.map((field) => ({
        name: field.name,
        type: field.type,
        required: field.required,
        ...(field.unique ? { unique: true } : {}),
      })),
      validators: [],
    });
  }
  manifest.permissions = manifest.permissions || [];
  for (const action of ['read', 'manage']) {
    const code = `${permissionPrefix}:${action}`;
    if (!manifest.permissions.some((permission) => (permission.code || permission) === code)) {
      manifest.permissions.push({ code, name: `${manifest.name} - ${name} ${action}` });
    }
  }
  manifest.queries = manifest.queries || [];
  const queryId = `${manifest.id}.${snake(name)}.list`;
  if (!manifest.queries.some((query) => query.id === queryId)) {
    manifest.queries.push({
      id: queryId,
      mode: 'READ',
      operation: 'LIST',
      entity: name,
      tenant_scope: 'TENANT',
      select: ['id', ...fields.map((field) => field.name), 'created_at'],
      sort: [{ field: 'created_at', direction: 'DESC' }],
      maxRows: 100,
    });
  }
  manifest.migrations = (manifest.migrations || []).filter((item) => item.file !== migrationName);
  manifest.migrations.push({
    version,
    file: migrationName,
    checksum: `sha256:${sha256Text(migration)}`,
    description: `${name} schema`,
  });
  assertValid(manifest);
  writeManifest(dir, manifest);
  console.log(`Generated entity ${name} (table ${table})`);
  console.log(`Migration: ${migrationFile}`);
  console.log('Next: add service/resource/query mapping (or use generate crud).');
}

function generateField(flags) {
  const dir = process.cwd();
  const manifest = readManifest(dir);
  const entityName = flags.entity;
  const name = flags.name;
  if (!entityName || !name || !/^[a-z][a-z0-9_]*$/.test(name)) {
    throw new Error('--entity and --name (snake_case) are required');
  }
  const entity = (manifest.entities || []).find((item) => item.name === entityName);
  if (!entity) {
    throw new Error(`entity not found: ${entityName}`);
  }
  const type = (flags.type || 'string').toLowerCase();
  const field = {
    name,
    type,
    required: flags.required === true,
    ...(flags.unique === true ? { unique: true } : {}),
  };
  if (type === 'enum') {
    const values = String(flags.enumValues || '').split(',').map((value) => value.trim()).filter(Boolean);
    if (values.length === 0) {
      throw new Error('--enum-values is required for enum fields');
    }
    field.enum_values = values;
  }
  entity.fields = entity.fields || [];
  if (entity.fields.some((item) => item.name === name)) {
    throw new Error(`field already exists: ${entityName}.${name}`);
  }
  entity.fields.push(field);
  if (flags.validator) {
    entity.validators = entity.validators || [];
    for (const raw of String(flags.validator).split(',')) {
      const [rule, value] = raw.split(':');
      if (rule) {
        entity.validators.push({ field: name, rule: rule.trim(), value: value?.trim() });
      }
    }
  }

  const migrationDir = join(dir, 'migrations');
  const version = nextMigrationVersion(migrationDir);
  const migrationName = `V${version}__add_${snake(entityName)}_${name}.sql`;
  const migration = `ALTER TABLE ${entity.table}
    ADD COLUMN IF NOT EXISTS ${name} ${fieldSqlType(field)};

-- Plugin ${manifest.id}: add ${entityName}.${name} (no tenant_id).
`;
  writeFile(join(dir, 'migrations', migrationName), migration);
  updateMigration(manifest, version, migrationName, migration);
  appendJavaField(dir, entityName, `    public ${javaType(type)} ${name};`);

  assertValid(manifest);
  writeManifest(dir, manifest);
  console.log(`Added field ${entityName}.${name} (${type})`);
  console.log(`Migration: migrations/${migrationName}`);
}

function generateRelation(flags) {
  const dir = process.cwd();
  const manifest = readManifest(dir);
  const entityName = flags.entity;
  const name = flags.name;
  const target = flags.target;
  if (!entityName || !name || !target) {
    throw new Error('--entity, --name and --target are required');
  }
  const entity = (manifest.entities || []).find((item) => item.name === entityName);
  if (!entity) {
    throw new Error(`entity not found: ${entityName}`);
  }
  const storage = flags.storage || (target.startsWith('self.') ? 'FK' : 'SOFT_REF');
  if (!['FK', 'SOFT_REF'].includes(storage)) {
    throw new Error('--storage must be FK or SOFT_REF');
  }
  if (storage === 'FK' && !target.startsWith('self.')) {
    throw new Error('FK is only supported for self.* targets; use SOFT_REF');
  }
  const relation = {
    name,
    owner_entity: entityName,
    type: (flags.type || 'MANY_TO_ONE').toUpperCase(),
    target,
    storage,
    ...(flags.displayField ? { target_display_field: flags.displayField } : {}),
    required: flags.required === true,
    on_delete: (flags.onDelete || 'RESTRICT').toUpperCase(),
  };
  manifest.relations = manifest.relations || [];
  if (manifest.relations.some((item) => item.name === name && item.owner_entity === entityName)) {
    throw new Error(`relation already exists: ${entityName}.${name}`);
  }
  manifest.relations.push(relation);

  const migrationDir = join(dir, 'migrations');
  const version = nextMigrationVersion(migrationDir);
  const migrationName = `V${version}__add_${snake(entityName)}_${name}.sql`;
  const column = `${name}_id`;
  let migration = `ALTER TABLE ${entity.table}
    ADD COLUMN IF NOT EXISTS ${column} UUID;\n`;
  if (storage === 'SOFT_REF') {
    migration += `ALTER TABLE ${entity.table}
    ADD COLUMN IF NOT EXISTS ${name}_text VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_${entity.table}_${name} ON ${entity.table} (${column});
`;
  } else {
    const targetEntity = target.substring('self.'.length);
    const targetTable = (manifest.entities || []).find((item) => item.name === targetEntity)?.table;
    if (targetTable) {
      const onDelete = relation.on_delete === 'SET_NULL'
        ? 'SET NULL'
        : relation.on_delete === 'NO_ACTION' ? 'NO ACTION' : relation.on_delete;
      migration += `ALTER TABLE ${entity.table}
    ADD CONSTRAINT fk_${snake(entityName)}_${name} FOREIGN KEY (${column}) REFERENCES ${targetTable}(id)
    ON DELETE ${onDelete};\n`;
    }
  }
  migration += `\n-- Plugin ${manifest.id}: add relation ${entityName}.${name}.\n`;
  writeFile(join(dir, 'migrations', migrationName), migration);
  updateMigration(manifest, version, migrationName, migration);
  appendJavaField(dir, entityName, `    public java.util.UUID ${name}Id;`);
  if (storage === 'SOFT_REF') {
    appendJavaField(dir, entityName, `    public String ${name}Text;`);
  }

  assertValid(manifest);
  writeManifest(dir, manifest);
  console.log(`Added relation ${entityName}.${name} -> ${target} (${storage})`);
  console.log(`Migration: migrations/${migrationName}`);
}

function fieldSqlType(field) {
  switch (field.type) {
    case 'int': return 'INTEGER';
    case 'long': return 'BIGINT';
    case 'decimal': return 'NUMERIC(18,4)';
    case 'bool': return 'BOOLEAN';
    case 'date': return 'DATE';
    case 'datetime': return 'TIMESTAMP WITH TIME ZONE';
    case 'json': return 'JSONB';
    case 'uuid': return 'UUID';
    case 'text': return 'TEXT';
    case 'enum': return 'VARCHAR(64)';
    default: return field.max_length ? `VARCHAR(${field.max_length})` : 'VARCHAR(255)';
  }
}

function updateMigration(manifest, version, file, content) {
  manifest.migrations = (manifest.migrations || []).filter((item) => item.file !== file);
  manifest.migrations.push({
    version,
    file,
    checksum: `sha256:${sha256Text(content)}`,
    description: file,
  });
}

function appendJavaField(dir, entityName, javaField) {
  const pkg = packageName(readManifest(dir).id).replaceAll('.', '/');
  const path = join(dir, `src/main/java/${pkg}/${entityName}.java`);
  if (!existsSync(path)) {
    return;
  }
  const source = readFileSync(path, 'utf8');
  const index = source.lastIndexOf('}');
  if (index < 0 || source.includes(javaField.trim())) {
    return;
  }
  writeFile(path, `${source.slice(0, index)}\n${javaField}\n${source.slice(index)}`);
}

function generateMenu(flags) {
  const dir = process.cwd();
  const manifest = readManifest(dir);
  const route = flags.route || `/apps/${manifest.id}`;
  const titleKey = flags.titleKey || `PLUGIN_${manifest.id.toUpperCase().replaceAll('-', '_')}_MENU`;
  const permission = flags.permission || null;
  const order = Number(flags.order || 100);
  const renderMode = (flags.renderMode || 'MODULE_FEDERATION').toUpperCase();
  manifest.ui_manifest = manifest.ui_manifest || { contract_version: '1.0', screens: [], contributions: [], slots: [] };
  manifest.ui_manifest.screens = manifest.ui_manifest.screens || [];
  manifest.ui_manifest.screens.push({ route, title_key: titleKey, permission, render_mode: renderMode, order });
  assertValid(manifest);
  writeManifest(dir, manifest);
  writeI18n(join(dir, 'web/public/i18n'), titleKey, manifest.name);
  console.log(`Registered screen ${route} (${renderMode})`);
}

function generateUiContribution(flags) {
  const dir = process.cwd();
  const manifest = readManifest(dir);
  const slot = flags.slot;
  if (!slot) {
    throw new Error('--slot is required (e.g. core.dashboard.widgets)');
  }
  const renderMode = (flags.renderMode || 'WEB_COMPONENT').toUpperCase().replaceAll('-', '_');
  if (!['WEB_COMPONENT', 'MODULE_FEDERATION'].includes(renderMode)) {
    throw new Error('--render-mode must be web-component or module-federation');
  }
  const titleKey = flags.titleKey || `PLUGIN_${manifest.id.toUpperCase().replaceAll('-', '_')}_CONTRIBUTION`;
  manifest.ui_manifest = manifest.ui_manifest || { contract_version: '1.0', screens: [], contributions: [], slots: [], crud: [] };
  manifest.ui_manifest.contributions = manifest.ui_manifest.contributions || [];
  const contributionId = flags.id || `contribution-${manifest.ui_manifest.contributions.length + 1}`;
  manifest.ui_manifest.contributions.push({
    id: contributionId,
    slot,
    title_key: titleKey,
    render_mode: renderMode,
    entry: flags.entry || `/plugins-runtime/${manifest.id}/main.js`,
    tag_name: flags.tagName || `op-${manifest.id}-${contributionId}`,
    permission: flags.permission || null,
    order: Number(flags.order || 10),
    contract_version: '1.0',
    platforms: ['desktop', 'mobile'],
  });
  assertValid(manifest);
  writeManifest(dir, manifest);
  writeI18n(join(dir, 'web/public/i18n'), titleKey, manifest.name);
  console.log(`Registered UI contribution into slot ${slot} (${renderMode})`);
  console.log('Validate the slot exists in the core UI Slot registry before publish.');
}

function assertValid(manifest) {
  const errors = validateManifest(manifest);
  if (errors.length > 0) {
    throw new Error(`manifest invalid: ${errors.join('; ')}`);
  }
}

function parseFields(raw) {
  return raw.split(',').filter(Boolean).map((entry) => {
    const [name, type = 'string', flags = ''] = entry.split(':');
    return {
      name: name.trim(),
      type: type.trim(),
      required: flags.split('+').includes('required'),
      unique: flags.split('+').includes('unique'),
    };
  });
}

function entitySource(pkg, name, fields) {
  const javaFields = fields.map((field) => {
    const type = javaType(field.type);
    return `    public ${type} ${field.name};`;
  }).join('\n');
  return `package ${pkg};

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** ${name} entity (POJO; DB access goes through PluginDataClient). */
public class ${name} {

    public UUID id;
${javaFields}
    public Instant createdAt;
}
`;
}

function javaType(type) {
  switch (type) {
    case 'decimal': return 'BigDecimal';
    case 'int': return 'Integer';
    case 'long': return 'Long';
    case 'bool': return 'Boolean';
    case 'date':
    case 'datetime': return 'Instant';
    case 'uuid': return 'UUID';
    default: return 'String';
  }
}

function migrationSource(table, fields) {
  const columns = fields.map((field) => {
    const type = field.type === 'decimal' ? 'NUMERIC(18,4)'
      : field.type === 'int' ? 'INTEGER'
      : field.type === 'long' ? 'BIGINT'
      : field.type === 'bool' ? 'BOOLEAN'
      : field.type === 'date' ? 'DATE'
      : field.type === 'datetime' ? 'TIMESTAMP WITH TIME ZONE'
      : field.type === 'uuid' ? 'UUID'
      : 'VARCHAR(255)';
    return `    ${field.name} ${type}${field.required ? ' NOT NULL' : ''}`;
  }).join(',\n');
  return `CREATE TABLE IF NOT EXISTS ${table} (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
${columns},
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_${table}_created ON ${table} (created_at DESC);
-- Plugin migration: runs inside the tenant schema only (no tenant_id column).
`;
}

function writeI18n(dir, key, value) {
  for (const lang of ['vi', 'en']) {
    const path = join(dir, `${lang}.json`);
    const dict = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {};
    dict[key] = value;
    writeFile(path, `${JSON.stringify(dict, null, 2)}\n`);
  }
}

function nextMigrationVersion(migrationDir) {
  if (!existsSync(migrationDir)) {
    return '1.0.0';
  }
  let maxPatch = -1;
  for (const file of readdirSync(migrationDir)) {
    const match = /^V(\d+)\.(\d+)\.(\d+)__/.exec(file);
    if (match) {
      maxPatch = Math.max(maxPatch, Number(match[3]));
    }
  }
  return `1.0.${maxPatch + 1}`;
}

function snake(value) {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
}
