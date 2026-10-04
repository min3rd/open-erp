import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { readManifest, writeManifest, validateManifest } from '../lib/manifest.js';
import { writeFile } from '../lib/fsx.js';
import { packageName } from '../lib/templates.js';

export async function generateCommand(flags) {
  const sub = flags._[0];
  switch (sub) {
    case 'entity':
      return generateEntity(flags);
    case 'menu':
      return generateMenu(flags);
    case 'ui-contribution':
      return generateUiContribution(flags);
    default:
      throw new Error('Usage: open-erp generate <entity|menu|ui-contribution> [options]');
  }
}

function generateEntity(flags) {
  const dir = process.cwd();
  const manifest = readManifest(dir);
  const name = flags.name;
  if (!name || !/^[A-Z][A-Za-z0-9]{1,63}$/.test(name)) {
    throw new Error('--name must be PascalCase (e.g. Invoice)');
  }
  const table = flags.table || `plg_${snake(manifest.id)}_${snake(name)}s`;
  const pkg = packageName(manifest.id);
  const pkgPath = pkg.replaceAll('.', '/');
  const fields = parseFields(flags.fields || 'code:string,name:string');
  const entityPath = join(dir, `src/main/java/${pkgPath}/${name}.java`);
  const migrationDir = join(dir, 'src/main/resources/db/plugin-migration');
  const version = nextMigrationVersion(migrationDir);
  if (existsSync(entityPath) && !flags.force) {
    throw new Error(`${entityPath} already exists (use --force)`);
  }
  writeFile(entityPath, entitySource(pkg, name, table, fields));
  writeFile(join(dir, 'src/main/resources/db/plugin-migration', `V${version}__add_${snake(name)}.up.sql`),
    migrationSource(table, fields));
  writeFile(join(dir, 'src/main/resources/db/plugin-migration-down', `V${version}__add_${snake(name)}.down.sql`),
    `DROP TABLE IF EXISTS ${table};\n`);
  const permissionCode = `${manifest.id}:${snake(name).replaceAll('_', '-')}:read`;
  manifest.entities = manifest.entities || [];
  if (!manifest.entities.some((entity) => entity.name === name)) {
    manifest.entities.push({ name, storage: 'postgres', table, public_fields: ['id', 'tenant_id', ...fields.map((field) => field.name), 'created_at'] });
  }
  manifest.permissions = manifest.permissions || [];
  if (!manifest.permissions.some((permission) => (permission.code || permission) === permissionCode)) {
    manifest.permissions.push({ code: permissionCode, name: `${manifest.name} - ${name} read` });
  }
  assertValid(manifest);
  writeManifest(dir, manifest);
  console.log(`Generated entity ${name} (table ${table})`);
  console.log(`Migration: V${version}__add_${snake(name)}.up.sql/.down.sql`);
  console.log('Next: add repository/service/resource or extend the generated entity.');
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
  const renderMode = normalizeRenderMode(flags.renderMode || 'IFRAME');
  if (!['WEB_COMPONENT', 'MODULE_FEDERATION', 'IFRAME'].includes(renderMode)) {
    throw new Error('--render-mode must be web-component, module-federation or iframe');
  }
  const titleKey = flags.titleKey || `PLUGIN_${manifest.id.toUpperCase().replaceAll('-', '_')}_CONTRIBUTION`;
  manifest.ui_manifest = manifest.ui_manifest || { contract_version: '1.0', screens: [], contributions: [], slots: [] };
  manifest.ui_manifest.contributions = manifest.ui_manifest.contributions || [];
  manifest.ui_manifest.contributions.push({
    slot,
    title_key: titleKey,
    render_mode: renderMode,
    entry: flags.entry || `/plugins-runtime/${manifest.id}/contribution.js`,
    permission: flags.permission || null,
    order: Number(flags.order || 10),
    contract_version: '1.0',
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
    const [name, type = 'string'] = entry.split(':');
    return { name: name.trim(), type: type.trim() };
  });
}

function entitySource(pkg, name, table, fields) {
  const javaFields = fields.map((field) => {
    const type = field.type === 'decimal' ? 'java.math.BigDecimal'
      : field.type === 'int' ? 'Integer'
      : field.type === 'date' ? 'java.time.Instant'
      : 'String';
    return `    @Column(name = "${field.name}")\n    public ${type} ${field.name};`;
  }).join('\n\n');
  return `package ${pkg};

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "${table}")
public class ${name} extends PanacheEntityBase {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false)
    public UUID id;

    @Column(name = "tenant_id", nullable = false)
    public UUID tenantId;

${javaFields}

    @Column(name = "created_at", nullable = false)
    public Instant createdAt = Instant.now();
}
`;
}

function migrationSource(table, fields) {
  const columns = fields.map((field) => {
    const type = field.type === 'decimal' ? 'NUMERIC(15,2)'
      : field.type === 'int' ? 'INTEGER'
      : field.type === 'date' ? 'TIMESTAMP WITH TIME ZONE'
      : 'VARCHAR(255)';
    return `    ${field.name} ${type}`;
  }).join(',\n');
  return `CREATE TABLE IF NOT EXISTS ${table} (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
${columns},
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_${table}_tenant ON ${table} (tenant_id, created_at DESC);
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

function normalizeRenderMode(value) {
  return value.toUpperCase().replaceAll('-', '_');
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
