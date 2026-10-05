#!/usr/bin/env node
/**
 * TASK-337: per-tenant plugin schema backup / restore for operators.
 *
 * The upgrade/rollback saga snapshots schemas through PluginSnapshotService;
 * this is the out-of-band ops path for manual backup before maintenance and
 * restore after an incident.
 *
 * Usage:
 *   node scripts/ops/tenant-schema-backup.mjs backup  --tenant <uuid> [--plugin <key>] [--out <dir>]
 *   node scripts/ops/tenant-schema-backup.mjs restore --dir <dir> [--dry-run]
 *
 * Schemas follow `tenant_<first-8-of-tenantId>_<plugin_key>` (see
 * TenantDatasourceService). pg_dump/psql run inside the Postgres container by
 * default; override with PG_CONTAINER (or PGPSQL_MODE=local to use local binaries).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const CONTAINER = process.env.PG_CONTAINER || 'openerp-postgres-primary';
const PG_DB = process.env.PG_DB || 'openerp_dev';
const PG_USER = process.env.PG_USER || 'openerp';
const PGPASSWORD = process.env.PGPASSWORD || 'openerp';

const args = process.argv.slice(2);
const command = args[0];
const flags = parseFlags(args.slice(1));

function parseFlags(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) {
      out[key] = true;
    } else {
      out[key] = next;
      i += 1;
    }
  }
  return out;
}

function fail(message) {
  console.error(`[tenant-schema] ${message}`);
  process.exit(1);
}

function run(tool, toolArgs) {
  const result = spawnSync(tool, toolArgs, { encoding: 'utf8' });
  if (result.error) {
    fail(`cannot run ${tool}: ${result.error.message}`);
  }
  return result;
}

function inContainer(toolArgs) {
  return run('docker', ['exec', '-e', `PGPASSWORD=${PGPASSWORD}`, CONTAINER, ...toolArgs]);
}

function psql(sql) {
  const result = inContainer(['psql', '-U', PG_USER, '-d', PG_DB, '-tAc', sql]);
  if (result.status !== 0) {
    fail(`psql failed: ${(result.stderr || result.stdout || '').trim()}`);
  }
  return (result.stdout || '').trim();
}

function tenantPrefix(tenantId) {
  const short = tenantId.replaceAll('-', '').slice(0, 8);
  if (short.length < 8) {
    fail(`tenant id looks invalid: ${tenantId}`);
  }
  return `tenant_${short}_`;
}

function listSchemas(prefix, plugin) {
  const filter = plugin ? ` and schema_name = '${prefix}${plugin.replaceAll('-', '_')}'` : '';
  const rows = psql(
    `SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE '${prefix}%'${filter} ORDER BY schema_name`
  );
  return rows ? rows.split('\n').filter(Boolean) : [];
}

function backup(flags) {
  if (!flags.tenant) {
    fail('backup requires --tenant <uuid>');
  }
  const schemas = listSchemas(tenantPrefix(flags.tenant), flags.plugin);
  if (schemas.length === 0) {
    fail('no matching tenant schemas found');
  }
  const outDir = resolve(flags.out || `backups/${new Date().toISOString().slice(0, 10)}`);
  mkdirSync(outDir, { recursive: true });
  for (const schema of schemas) {
    const file = join(outDir, `${schema}.dump`);
    const result = spawnSync(
      'docker',
      ['exec', '-e', `PGPASSWORD=${PGPASSWORD}`, CONTAINER, 'pg_dump',
        '--dbname', PG_DB, '--username', PG_USER, '--schema', schema,
        '--no-owner', '--no-privileges', '--clean', '--if-exists'],
      { encoding: 'buffer', maxBuffer: 512 * 1024 * 1024 }
    );
    if (result.status !== 0) {
      fail(`pg_dump ${schema} failed: ${(result.stderr || '').toString().trim()}`);
    }
    writeFileSync(file, result.stdout);
    console.log(`[tenant-schema] ${schema} -> ${file} (${result.stdout.length} bytes)`);
  }
}

function restore(flags) {
  const dir = flags.dir ? resolve(flags.dir) : null;
  if (!dir || !existsSync(dir)) {
    fail('restore requires an existing --dir <dir>');
  }
  const dumps = readdirSync(dir).filter((name) => name.endsWith('.dump'));
  if (dumps.length === 0) {
    fail(`no .dump files in ${dir}`);
  }
  for (const name of dumps) {
    if (flags['dry-run']) {
      console.log(`[tenant-schema] would restore ${name} (schema ${name.replace(/\.dump$/, '')})`);
      continue;
    }
    const result = spawnSync(
      'docker',
      ['exec', '-i', '-e', `PGPASSWORD=${PGPASSWORD}`, CONTAINER, 'psql',
        '--dbname', PG_DB, '--username', PG_USER, '--single-transaction'],
      { input: readFileSync(join(dir, name)) }
    );
    if (result.status !== 0) {
      fail(`restore ${name} failed: ${(result.stderr || '').toString().trim()}`);
    }
    console.log(`[tenant-schema] restored ${name}`);
  }
}

const handlers = { backup, restore };
if (!handlers[command]) {
  fail('usage: tenant-schema-backup.mjs backup --tenant <uuid> [--plugin <key>] [--out <dir>] | restore --dir <dir> [--dry-run]');
}
await handlers[command](flags);
