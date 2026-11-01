#!/usr/bin/env node
/**
 * Sprint 07 / TASK-428: organization big-bang cutover helper.
 *
 * Copies the legacy Core organization tables into the organization plugin
 * tables (UUID preserved), rebuilds the Core scope projection and verifies row
 * parity. Run while the tenant is in maintenance mode; `copy` takes an
 * ACCESS EXCLUSIVE lock on the four legacy tables for the whole transaction.
 *
 * Usage (per tenant):
 *   node scripts/ops/org-cutover.mjs status --tenant <uuid>
 *   node scripts/ops/org-cutover.mjs backup --tenant <uuid> [--out <dir>]
 *   node scripts/ops/org-cutover.mjs copy   --tenant <uuid>
 *   node scripts/ops/org-cutover.mjs verify --tenant <uuid>
 *   node scripts/ops/org-cutover.mjs drop-legacy --tenant <uuid> --confirm DROP-LEGACY
 *
 * `drop-legacy` is a deployment step, not an application migration: Core's old
 * organization endpoints and screens must be retired first. Until then the
 * legacy tables stay as the write model and the projection is the read model.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
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
  console.error(`[org-cutover] ${message}`);
  process.exit(1);
}

function inContainer(toolArgs, options = {}) {
  return spawnSync('docker', ['exec', ...(options.stdin ? ['-i'] : []),
    '-e', `PGPASSWORD=${PGPASSWORD}`, CONTAINER, ...toolArgs], {
    encoding: options.encoding || 'utf8',
    ...(options.input ? { input: options.input } : {}),
    ...(options.buffer ? { maxBuffer: options.buffer } : {}),
  });
}

function psql(sql, { tuplesOnly = true } = {}) {
  const result = inContainer(
    ['psql', '-U', PG_USER, '-d', PG_DB, '-v', 'ON_ERROR_STOP=1',
      ...(tuplesOnly ? ['-tA'] : []), '-c', sql]);
  if (result.status !== 0) {
    fail(`psql failed: ${(result.stderr || result.stdout || '').trim()}`);
  }
  return (result.stdout || '').trim();
}

/** Single transaction; returns true when the SQL ran or was rolled back. */
function transaction(sql) {
  const result = inContainer(
    ['psql', '-U', PG_USER, '-d', PG_DB, '-v', 'ON_ERROR_STOP=1', '--single-transaction'],
    { input: sql, stdin: true });
  if (result.status !== 0) {
    fail(`cutover transaction failed: ${(result.stderr || result.stdout || '').trim()}`);
  }
  return (result.stdout || '').trim();
}

function tenantId() {
  if (!flags.tenant) {
    fail('--tenant <uuid> is required');
  }
  const tenant = String(flags.tenant).toLowerCase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(tenant)) {
    fail(`tenant id looks invalid: ${flags.tenant}`);
  }
  return tenant;
}

const LEGACY_TABLES = ['branches', 'departments',
  'user_department_memberships', 'user_branch_assignments'];
const PLUGIN_TABLES = ['plg_organization_branches', 'plg_organization_departments',
  'plg_organization_memberships', 'plg_organization_branch_access'];

/** Per-tenant plugin schema created by TenantDatasourceService. */
function pluginSchema(tenant) {
  if (flags.schema) {
    return String(flags.schema);
  }
  return `tenant_${tenant.replaceAll('-', '').slice(0, 8)}_org_structure`;
}

const pschema = () => pluginSchema(tenantId());

function q(table) {
  return `"${pschema()}".${table}`;
}

function pluginTableExists(table) {
  return psql(`SELECT to_regclass('"${pschema()}".${table}') IS NOT NULL`) === 't';
}

function legacyTableExists(table) {
  return psql(`SELECT to_regclass('public.${table}') IS NOT NULL`).trim() === 't';
}

function status(tenant) {
  if (!legacyTableExists('branches')) {
    console.log('[org-cutover] legacy tables are already dropped; plugin is the write model.');
  }
  const schemaExists = psql(`SELECT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = '${pschema()}')`) === 't';
  if (!schemaExists) {
    console.log(`[org-cutover] plugin schema ${pschema()} does not exist (plugin not installed for this tenant)`);
  }
  for (const [legacy, plugin] of [
    ['branches', 'plg_organization_branches'],
    ['departments', 'plg_organization_departments'],
    ['user_department_memberships', 'plg_organization_memberships'],
    ['user_branch_assignments', 'plg_organization_branch_access'],
  ]) {
    const legacyCount = legacyTableExists(legacy)
      ? psql(`SELECT count(*) FROM ${legacy} WHERE tenant_id = '${tenant}'`)
      : 'dropped';
    const pluginCount = schemaExists && pluginTableExists(plugin)
      ? psql(`SELECT count(*) FROM ${q(plugin)} WHERE tenant_id = '${tenant}'`)
      : 'not-installed';
    console.log(`[org-cutover] ${legacy.padEnd(28)} legacy=${String(legacyCount).padEnd(12)} plugin=${pluginCount}`);
  }
  const coreReady = psql("SELECT to_regclass('public.core_user_scope') IS NOT NULL") === 't';
  const scope = coreReady ? psql(`SELECT count(*) FROM core_user_scope WHERE tenant_id = '${tenant}'`) : 'not-migrated';
  const members = schemaExists && pluginTableExists('plg_organization_memberships')
    ? psql(`SELECT count(DISTINCT user_id) FROM ${q('plg_organization_memberships')}
      WHERE tenant_id = '${tenant}' AND status = 'ACTIVE'`)
    : 'not-installed';
  console.log(`[org-cutover] core_user_scope=${scope} active_membership_users=${members}`);
}

function backup(tenant) {
  const outDir = resolve(flags.out || join('backups', `org-cutover-${new Date().toISOString().replace(/[:.]/g, '-')}`));
  mkdirSync(outDir, { recursive: true });
  const legacy = LEGACY_TABLES.filter((table) => legacyTableExists(table));
  const schemaExists = psql(`SELECT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = '${pschema()}')`) === 't';
  const plugin = schemaExists
    ? PLUGIN_TABLES.filter((table) => pluginTableExists(table)).map((table) => `${pschema()}.${table}`)
    : [];
  const tables = [...legacy.map((table) => `public.${table}`), ...plugin,
    'public.core_user_scope', 'public.core_user_manager_edge', 'public.core_department_closure'];
  for (const table of tables) {
    if (psql(`SELECT to_regclass('${table}') IS NOT NULL`) !== 't') continue;
    const result = inContainer(
      ['pg_dump', '--dbname', PG_DB, '--username', PG_USER, '--table', table,
        '--no-owner', '--no-privileges', '--clean', '--if-exists'],
      { encoding: 'buffer', buffer: 512 * 1024 * 1024 });
    if (result.status !== 0) {
      fail(`pg_dump ${table} failed: ${(result.stderr || '').toString().trim()}`);
    }
    const name = table.replace(/[".]/g, '_');
    writeFileSync(join(outDir, `${name}.dump`), result.stdout);
    console.log(`[org-cutover] ${table} -> ${name}.dump (${result.stdout.length} bytes)`);
  }
  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify({
    tenant, schema: pschema(), createdAt: new Date().toISOString(), container: CONTAINER,
    database: PG_DB, tables,
  }, null, 2) + '\n');
  console.log(`[org-cutover] backup written to ${outDir}`);
}

function copy(tenant) {
  if (!legacyTableExists('branches')) {
    fail('legacy organization tables are gone; nothing to copy');
  }
  const orphanDepartments = psql(`SELECT count(*) FROM departments d
    WHERE d.tenant_id = '${tenant}' AND d.branch_id IS NULL
      AND NOT EXISTS (SELECT 1 FROM branches b WHERE b.tenant_id = d.tenant_id)`);
  if (orphanDepartments !== '0') {
    fail(`${orphanDepartments} department(s) have no branch and the tenant has no branch to fall back to`);
  }

  const sql = `
LOCK TABLE branches, departments, user_department_memberships, user_branch_assignments
  IN ACCESS EXCLUSIVE MODE;

-- Plugin bootstrap may have created default HQ rows with different UUIDs.
-- Reconcile by code, repoint children, then let the legacy UUID win.
WITH conflicts AS (
  SELECT b.id AS legacy_id, p.id AS plugin_id
  FROM branches b
  JOIN ${q('plg_organization_branches')} p
    ON p.tenant_id = b.tenant_id AND p.code = b.code AND p.id <> b.id
  WHERE b.tenant_id = '${tenant}'
)
UPDATE ${q('plg_organization_departments')} d
SET branch_id = c.legacy_id
FROM conflicts c
WHERE d.branch_id = c.plugin_id;

WITH conflicts AS (
  SELECT b.id AS legacy_id, p.id AS plugin_id
  FROM branches b
  JOIN ${q('plg_organization_branches')} p
    ON p.tenant_id = b.tenant_id AND p.code = b.code AND p.id <> b.id
  WHERE b.tenant_id = '${tenant}'
)
DELETE FROM ${q('plg_organization_branches')} p
USING conflicts c
WHERE p.id = c.plugin_id;

WITH conflicts AS (
  SELECT d.id AS legacy_id, p.id AS plugin_id
  FROM departments d
  JOIN ${q('plg_organization_departments')} p
    ON p.tenant_id = d.tenant_id AND p.code = d.code AND p.id <> d.id
  WHERE d.tenant_id = '${tenant}'
)
UPDATE ${q('plg_organization_departments')} child
SET parent_id = c.legacy_id
FROM conflicts c
WHERE child.parent_id = c.plugin_id;

WITH conflicts AS (
  SELECT d.id AS legacy_id, p.id AS plugin_id
  FROM departments d
  JOIN ${q('plg_organization_departments')} p
    ON p.tenant_id = d.tenant_id AND p.code = d.code AND p.id <> d.id
  WHERE d.tenant_id = '${tenant}'
)
UPDATE ${q('plg_organization_memberships')} m
SET department_id = c.legacy_id
FROM conflicts c
WHERE m.department_id = c.plugin_id;

WITH conflicts AS (
  SELECT d.id AS legacy_id, p.id AS plugin_id
  FROM departments d
  JOIN ${q('plg_organization_departments')} p
    ON p.tenant_id = d.tenant_id AND p.code = d.code AND p.id <> d.id
  WHERE d.tenant_id = '${tenant}'
)
DELETE FROM ${q('plg_organization_departments')} p
USING conflicts c
WHERE p.id = c.plugin_id;

INSERT INTO ${q('plg_organization_branches')}
  (id, tenant_id, code, name, phone, address, is_default, status, created_at, updated_at)
SELECT id, tenant_id, code, name, phone, address, is_default, status, created_at, updated_at
FROM branches WHERE tenant_id = '${tenant}'
ON CONFLICT (id) DO NOTHING;

INSERT INTO ${q('plg_organization_departments')}
  (id, tenant_id, branch_id, parent_id, code, name, manager_user_id, status, created_at, updated_at)
SELECT d.id, d.tenant_id,
  COALESCE(d.branch_id, (SELECT b.id FROM branches b
    WHERE b.tenant_id = d.tenant_id ORDER BY b.is_default DESC, b.created_at LIMIT 1)),
  d.parent_id, d.code, d.name, d.manager_user_id, d.status, d.created_at, d.updated_at
FROM departments d WHERE d.tenant_id = '${tenant}'
ON CONFLICT (id) DO NOTHING;

INSERT INTO ${q('plg_organization_memberships')}
  (id, tenant_id, user_id, branch_id, department_id, direct_manager_user_id,
   is_primary, joined_at, valid_from, valid_to, status, created_at, updated_at)
SELECT id, tenant_id, user_id, branch_id, department_id, direct_manager_user_id,
  is_primary, joined_at, joined_at::date, NULL, 'ACTIVE', joined_at, joined_at
FROM user_department_memberships WHERE tenant_id = '${tenant}'
ON CONFLICT (id) DO NOTHING;

INSERT INTO ${q('plg_organization_branch_access')}
  (id, tenant_id, user_id, branch_id, is_primary, can_manage, assigned_at,
   valid_from, valid_to, status)
SELECT id, tenant_id, user_id, branch_id, is_primary, can_manage, assigned_at,
  assigned_at::date, NULL, 'ACTIVE'
FROM user_branch_assignments WHERE tenant_id = '${tenant}'
ON CONFLICT (id) DO NOTHING;

DELETE FROM core_user_scope WHERE tenant_id = '${tenant}';
DELETE FROM core_user_manager_edge WHERE tenant_id = '${tenant}';
DELETE FROM core_department_closure WHERE tenant_id = '${tenant}';

INSERT INTO core_user_scope
  (tenant_id, user_id, primary_branch_id, primary_department_id,
   member_branch_ids, managed_branch_ids, department_ids, version, updated_at)
SELECT m.tenant_id, m.user_id,
  (array_agg(m.branch_id ORDER BY m.is_primary DESC, m.joined_at))[1],
  (array_agg(m.department_id ORDER BY m.is_primary DESC, m.joined_at))[1],
  array_agg(DISTINCT m.branch_id),
  COALESCE((SELECT array_agg(DISTINCT a.branch_id)
    FROM ${q('plg_organization_branch_access')} a
    WHERE a.tenant_id = m.tenant_id AND a.user_id = m.user_id
      AND a.can_manage AND a.status = 'ACTIVE'), '{}'::uuid[]),
  array_agg(DISTINCT m.department_id), 1, now()
FROM ${q('plg_organization_memberships')} m
WHERE m.tenant_id = '${tenant}' AND m.status = 'ACTIVE'
GROUP BY m.tenant_id, m.user_id;

INSERT INTO core_user_manager_edge
  (tenant_id, manager_user_id, subordinate_user_id, source, updated_at)
SELECT tenant_id, direct_manager_user_id, user_id, 'ORG', now()
FROM ${q('plg_organization_memberships')}
WHERE tenant_id = '${tenant}' AND status = 'ACTIVE' AND direct_manager_user_id IS NOT NULL
ON CONFLICT DO NOTHING;

WITH RECURSIVE tree AS (
  SELECT id AS ancestor_id, id AS descendant_id, 0 AS depth
  FROM ${q('plg_organization_departments')} WHERE tenant_id = '${tenant}'
  UNION ALL
  SELECT t.ancestor_id, d.id, t.depth + 1
  FROM tree t
  JOIN ${q('plg_organization_departments')} d ON d.parent_id = t.descendant_id
  WHERE d.tenant_id = '${tenant}'
)
INSERT INTO core_department_closure (tenant_id, ancestor_id, descendant_id, depth, updated_at)
SELECT '${tenant}', ancestor_id, descendant_id, depth, now() FROM tree;
`;
  transaction(sql);
  console.log(`[org-cutover] copied legacy organization rows for tenant ${tenant}`);
  verify(tenant);
}

function verify(tenant) {
  const checks = [
    ['branches', 'plg_organization_branches'],
    ['departments', 'plg_organization_departments'],
    ['user_department_memberships', 'plg_organization_memberships'],
    ['user_branch_assignments', 'plg_organization_branch_access'],
  ];
  let failed = false;
  for (const [legacy, plugin] of checks) {
    if (!legacyTableExists(legacy)) {
      console.log(`[org-cutover] ${legacy}: already dropped, skipped`);
      continue;
    }
    const legacyCount = psql(`SELECT count(*) FROM ${legacy} WHERE tenant_id = '${tenant}'`);
    const pluginCount = psql(`SELECT count(*) FROM ${q(plugin)} WHERE tenant_id = '${tenant}'`);
    const missing = psql(`SELECT count(*) FROM ${legacy} l
      WHERE l.tenant_id = '${tenant}'
        AND NOT EXISTS (SELECT 1 FROM ${q(plugin)} p WHERE p.id = l.id)`);
    const ok = missing === '0';
    failed ||= !ok;
    console.log(`[org-cutover] verify ${legacy.padEnd(28)} legacy=${legacyCount} plugin=${pluginCount} missing=${missing} ${ok ? 'OK' : 'FAIL'}`);
  }
  const scope = psql(`SELECT count(*) FROM core_user_scope WHERE tenant_id = '${tenant}'`);
  const members = psql(`SELECT count(DISTINCT user_id) FROM ${q('plg_organization_memberships')}
    WHERE tenant_id = '${tenant}' AND status = 'ACTIVE'`);
  const missingScope = psql(`SELECT count(DISTINCT m.user_id) FROM ${q('plg_organization_memberships')} m
    WHERE m.tenant_id = '${tenant}' AND m.status = 'ACTIVE'
      AND NOT EXISTS (SELECT 1 FROM core_user_scope s
        WHERE s.tenant_id = m.tenant_id AND s.user_id = m.user_id)`);
  const closureOk = psql(`SELECT count(*) FROM core_department_closure WHERE tenant_id = '${tenant}'`) !== '0'
    || psql(`SELECT count(*) FROM ${q('plg_organization_departments')} WHERE tenant_id = '${tenant}'`) === '0';
  const projectionOk = missingScope === '0' && closureOk;
  failed ||= !projectionOk;
  console.log(`[org-cutover] verify projection scope=${scope} active_membership_users=${members} missing_scope=${missingScope} closure=${closureOk ? 'OK' : 'EMPTY'} ${projectionOk ? 'OK' : 'FAIL'}`);
  if (failed) {
    fail('verification failed; legacy tables were NOT dropped');
  }
  console.log('[org-cutover] verification passed');
}

function dropLegacy(tenant) {
  if (flags.confirm !== 'DROP-LEGACY') {
    fail('refusing to drop legacy tables without --confirm DROP-LEGACY');
  }
  verify(tenant);
  const sql = `
DROP TABLE IF EXISTS user_branch_assignments;
DROP TABLE IF EXISTS user_department_memberships;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS branches;
`;
  transaction(sql);
  console.log('[org-cutover] legacy organization tables dropped');
}

const handlers = { status, backup, copy, verify, 'drop-legacy': dropLegacy };
if (!handlers[command]) {
  fail('usage: org-cutover.mjs status|backup|copy|verify|drop-legacy --tenant <uuid>');
}
handlers[command](tenantId());
