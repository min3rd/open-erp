import fs from 'node:fs';
import crypto from 'node:crypto';

const root = 'plugins/office-webapp';
const manifest = JSON.parse(fs.readFileSync(`${root}/plugin.json`, 'utf8'));
const errors = [];

const entities = new Map((manifest.entities ?? []).map((entity) => [entity.name, entity]));
for (const migration of manifest.migrations ?? []) {
  const file = `${root}/migrations/${migration.file}`;
  if (!fs.existsSync(file)) {
    errors.push(`missing migration ${migration.file}`);
    continue;
  }
  const text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const actual = 'sha256:' + crypto.createHash('sha256').update(Buffer.from(text, 'utf8')).digest('hex');
  if (actual !== migration.checksum) errors.push(`checksum mismatch ${migration.file}: ${actual}`);
}

for (const query of manifest.queries ?? []) {
  const entity = entities.get(query.entity);
  if (!entity) {
    errors.push(`query ${query.id} references missing entity ${query.entity}`);
    continue;
  }
  const fields = new Set(['id', 'tenant_id', ...entity.fields.map((field) => field.name)]);
  for (const field of query.select ?? []) if (!fields.has(field)) errors.push(`query ${query.id} select ${field}`);
  for (const filter of query.filters ?? []) if (!fields.has(filter.field)) errors.push(`query ${query.id} filter ${filter.field}`);
  for (const field of Object.keys(query.values ?? {})) if (!fields.has(field)) errors.push(`query ${query.id} value ${field}`);
  for (const field of query.returning ?? []) if (!fields.has(field)) errors.push(`query ${query.id} returning ${field}`);
}

for (const screen of manifest.ui_manifest?.screens ?? []) {
  if (!screen.route || !screen.entry || !screen.tag_name) errors.push(`screen missing route/entry/tag ${screen.route}`);
}

console.log(JSON.stringify({
  id: manifest.id,
  version: manifest.version,
  entities: entities.size,
  queries: (manifest.queries ?? []).length,
  migrations: (manifest.migrations ?? []).length,
  screens: (manifest.ui_manifest?.screens ?? []).length,
  errors,
}, null, 2));
process.exit(errors.length ? 1 : 0);
