#!/usr/bin/env node
/**
 * TASK-344 E2E — CLI bundle channel on the local dev environment:
 *   create plugin (@open-erp/cli) → package (uber-jar + bundle.zip) → register
 *   catalog/version → publish → entitlement → install (container-per-tenant)
 *   → verify Docker container + tenant schema + ACTIVE ledger.
 *
 * Dev-only helpers: registers real accounts through the public API and upserts
 * one platform_super_admins row (no platform bootstrap password required).
 * Requires: Docker (PostgreSQL/Redis up), backend on :8088, JDK + Maven.
 *
 * Usage:
 *   npm run e2e:plugin                 # full run (builds the plugin)
 *   npm run e2e:plugin -- --skip-build # reuse dist/ from the previous run
 *   npm run e2e:plugin -- --keep       # do not uninstall at the end
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const BASE_URL = process.env.OPENERP_E2E_BASE_URL || 'http://localhost:8088';
const PG_CONTAINER = 'openerp-postgres-primary';
const PG_DB = 'openerp_dev';
const PG_USER = 'openerp';

const PLUGIN_KEY = 'e2e-sample';
const PLUGIN_VERSION = '1.0.0';
const PLUGIN_NAME = 'E2E Sample';
const TENANT_SLUG = 'e2e-plugin-demo';
const TENANT_NAME = 'E2E Plugin Demo';
const PASSWORD = 'E2ePlugin!2026';
const PLATFORM_EMAIL = 'e2e-platform@example.com';
const TENANT_EMAIL = 'e2e-tenant@example.com';

const CLI_BIN = join(ROOT, 'tools/open-erp-cli/bin/open-erp.js');
const WORK_DIR = join(ROOT, 'logs/e2e/plugin');
const LOG_FILE = join(ROOT, 'logs/e2e/plugin-cli-e2e.log');
const EVIDENCE_DIR = join(ROOT, 'docs/sprints/sprint_03_plugin_manager/08_testing/evidence');

const args = new Set(process.argv.slice(2));
const skipBuild = args.has('--skip-build');
const keep = args.has('--keep');

const evidence = [];
let startedBackend = false;

function step(message) {
  console.log(`\n[E2E] ${message}`);
  evidence.push(`[${new Date().toISOString()}] ${message}`);
}

function fail(message) {
  console.error(`\n[E2E][FAIL] ${message}`);
  evidence.push(`[FAIL] ${message}`);
  writeEvidence('FAILED');
  process.exit(1);
}

function writeEvidence(result) {
  mkdirSync(EVIDENCE_DIR, { recursive: true });
  const file = join(EVIDENCE_DIR, `TASK-344_cli_bundle_install_e2e_${new Date().toISOString().slice(0, 10)}.txt`);
  writeFileSync(file, `TASK-344 CLI bundle install E2E — ${new Date().toISOString()}\n`
    + `RESULT=${result}\n`
    + `BASE_URL=${BASE_URL}\n`
    + evidence.join('\n') + '\n');
  console.log(`[E2E] Evidence: ${file}`);
}

function docker(dockerArgs, options = {}) {
  return spawnSync('docker', dockerArgs, { encoding: 'utf8', ...options });
}

function psql(sql) {
  const result = docker(['exec', PG_CONTAINER, 'psql', '-U', PG_USER, '-d', PG_DB, '-tAc', sql]);
  if (result.status !== 0) {
    fail(`psql thất bại: ${(result.stderr || result.stdout || '').trim()}`);
  }
  return (result.stdout || '').trim();
}

async function api(method, path, options = {}) {
  const headers = {};
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }
  let body;
  if (options.form) {
    body = options.form;
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body,
      signal: AbortSignal.timeout(900_000),
    });
  } catch (error) {
    fail(`HTTP ${method} ${path} lỗi kết nối: ${error.message}`);
  }
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { status: response.status, json };
}

async function waitForBackend() {
  for (let attempt = 1; attempt <= 120; attempt += 1) {
    try {
      const response = await fetch(`${BASE_URL}/q/health/live`, { signal: AbortSignal.timeout(3_000) });
      if (response.ok) {
        return true;
      }
    } catch {
      // still booting
    }
    await sleep(2_000);
  }
  return false;
}

function ensureInfra() {
  step('Khởi động hạ tầng Docker (PostgreSQL + Redis)...');
  const up = docker(['compose', 'up', '-d', 'postgres-primary', 'redis'], { cwd: ROOT, stdio: 'inherit' });
  if (up.status !== 0) {
    fail('docker compose up thất bại');
  }
  const networks = docker(['inspect', PG_CONTAINER, '--format', '{{json .NetworkSettings.Networks}}']);
  if (!(networks.stdout || '').includes('openerp-net')) {
    fail(`Container ${PG_CONTAINER} chưa nằm trên network "openerp-net" — chạy "docker compose up -d" để recreate.`);
  }
  evidence.push(`INFRA_OK network=openerp-net`);
}

async function ensureBackend() {
  step('Kiểm tra backend Quarkus tại ' + BASE_URL + '...');
  if (await waitForBackend()) {
    evidence.push('BACKEND_ALREADY_RUNNING=1');
    return;
  }
  step('Backend chưa chạy — khởi chạy "mvn quarkus:dev" nền (logs/e2e/backend.log)...');
  mkdirSync(join(ROOT, 'logs/e2e'), { recursive: true });
  const out = join(ROOT, 'logs/e2e/backend.log');
  const command = `mvn -f src/backend/pom.xml quarkus:dev >> "${out}" 2>&1`;
  const child = spawn(command, {
    cwd: ROOT,
    env: { ...process.env, JAVA_TOOL_OPTIONS: '-Dnet.bytebuddy.experimental=true' },
    detached: true,
    stdio: 'ignore',
    shell: true,
  });
  child.unref();
  startedBackend = true;
  if (!(await waitForBackend())) {
    fail(`Backend không lên sau 240s — xem ${out}`);
  }
  evidence.push('BACKEND_STARTED_BY_E2E=1');
}

async function ensureBusinessAccount(email, fullName, slug) {
  const register = await api('POST', '/api/v1/auth/register/business', {
    body: {
      admin: { full_name: fullName, email, password: PASSWORD },
      tenant: { name: TENANT_NAME, slug, currency: 'VND' },
    },
  });
  if (register.status === 201 || register.status === 200) {
    return { tenantId: register.json?.data?.tenant_id, userId: register.json?.data?.user_id, created: true };
  }
  if (register.status === 409 || register.json?.code?.includes('EXISTS') || register.status === 400) {
    const login = await api('POST', '/api/v1/auth/login', { body: { email, password: PASSWORD } });
    if (login.status !== 200) {
      fail(`Tài khoản ${email} đã tồn tại nhưng đăng nhập thất bại (${login.status} ${login.json?.code ?? ''}). `
        + 'Xóa user/tenant cũ hoặc đổi E2E email.');
    }
    const user = psql(`SELECT id FROM users WHERE email='${email}'`);
    return { tenantId: null, userId: user, created: false, login };
  }
  fail(`Đăng ký business thất bại cho ${email}: ${register.status} ${JSON.stringify(register.json)}`);
}

function seedPlatformAdmin(userId) {
  step(`Seed platform_super_admins cho user ${userId} (dev-only)...`);
  psql(`INSERT INTO platform_super_admins (user_id, role, is_active, status, must_change_password, two_factor_required)
        VALUES ('${userId}', 'SUPER_ADMIN', TRUE, 'ACTIVE', FALSE, FALSE)
        ON CONFLICT (user_id) DO UPDATE SET role='SUPER_ADMIN', is_active=TRUE, status='ACTIVE',
          must_change_password=FALSE, two_factor_required=FALSE`);
  evidence.push(`PLATFORM_ADMIN_SEEDED user_id=${userId}`);
}

async function loginToken(email) {
  const login = await api('POST', '/api/v1/auth/login', { body: { email, password: PASSWORD } });
  if (login.status !== 200) {
    fail(`Login ${email} thất bại: ${login.status} ${JSON.stringify(login.json)}`);
  }
  const data = login.json?.data ?? {};
  if (!data.access_token) {
    fail(`Login ${email} không trả access_token (cần chọn tenant?): ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

function runCli(cliArgs, cwd) {
  const result = spawnSync(process.execPath, [CLI_BIN, ...cliArgs], {
    cwd,
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    fail(`CLI "${cliArgs.join(' ')}" thất bại (exit ${result.status})`);
  }
}

function createAndPackagePlugin() {
  step(`Tạo plugin mẫu "${PLUGIN_KEY}" bằng @open-erp/cli...`);
  mkdirSync(join(ROOT, 'logs/e2e'), { recursive: true });
  rmSync(WORK_DIR, { recursive: true, force: true });
  runCli([
    'create', '--non-interactive', '--id', PLUGIN_KEY, '--name', PLUGIN_NAME,
    '--packaging', 'bundle', '--target', WORK_DIR, '--git-init', 'false',
  ], ROOT);

  const bundle = join(WORK_DIR, 'dist/bundle.zip');
  if (skipBuild && existsSync(bundle)) {
    step('Bỏ qua build (--skip-build) — dùng dist/ có sẵn.');
  } else {
    step('Build plugin (uber-jar + bundle.zip) — có thể mất vài phút...');
    runCli(['package'], WORK_DIR);
  }
  if (!existsSync(bundle)) {
    fail(`Không tìm thấy ${bundle}`);
  }
  const jar = join(WORK_DIR, 'dist/plugin-backend.jar');
  evidence.push(`BUNDLE_ZIP=${statSync(bundle).size} bytes`);
  evidence.push(`PLUGIN_BACKEND_JAR=${existsSync(jar) ? statSync(jar).size : 0} bytes`);
  return { bundle, manifest: JSON.parse(readFileSync(join(WORK_DIR, 'plugin.json'), 'utf8')) };
}

async function registerAndPublish(platformToken, tenantId, bundle, manifest) {
  step('P2: tạo catalog plugin...');
  const catalog = await api('POST', '/api/v1/platform/plugins', {
    token: platformToken,
    body: {
      plugin_key: PLUGIN_KEY,
      name_key: `PLUGIN_${PLUGIN_KEY.toUpperCase().replaceAll('-', '_')}_NAME`,
      description_key: `PLUGIN_${PLUGIN_KEY.toUpperCase().replaceAll('-', '_')}_DESCRIPTION`,
    },
  });
  if (catalog.status !== 201 && catalog.status !== 409) {
    fail(`Tạo catalog thất bại: ${catalog.status} ${JSON.stringify(catalog.json)}`);
  }
  evidence.push(`CATALOG=${catalog.json?.code ?? catalog.status}`);

  step('Upload bundle.zip lên artifact storage...');
  const form = new FormData();
  form.append('file', new Blob([readFileSync(bundle)], { type: 'application/zip' }), 'bundle.zip');
  const upload = await api('POST', '/api/v1/platform/plugins/artifacts/upload', { token: platformToken, form });
  if (upload.status !== 201 && upload.status !== 200) {
    fail(`Upload artifact thất bại: ${upload.status} ${JSON.stringify(upload.json)}`);
  }
  const { artifact_ref: artifactRef, checksum } = upload.json.data;
  evidence.push(`UPLOAD_OK ref=${artifactRef} checksum=${checksum} size=${upload.json.data.size_bytes}`);

  step('P5: đăng ký phiên bản JAR_BUNDLE...');
  const version = await api('POST', `/api/v1/platform/plugins/${PLUGIN_KEY}/versions`, {
    token: platformToken,
    body: {
      source: 'JAR_BUNDLE',
      version: PLUGIN_VERSION,
      artifact_ref: artifactRef,
      checksum,
      manifest,
    },
  });
  if (version.status !== 201 && version.status !== 409) {
    fail(`Đăng ký version thất bại: ${version.status} ${JSON.stringify(version.json)}`);
  }
  evidence.push(`VERSION=${version.json?.code ?? version.status}`);

  step('P6: publish phiên bản...');
  const publish = await api('PATCH', `/api/v1/platform/plugins/${PLUGIN_KEY}/versions/${PLUGIN_VERSION}`, {
    token: platformToken,
    body: { action: 'PUBLISH', reason: 'E2E CLI bundle install' },
  });
  if (publish.status !== 200) {
    fail(`Publish thất bại: ${publish.status} ${JSON.stringify(publish.json)}`);
  }
  evidence.push(`PUBLISH=${publish.json?.data?.release_status ?? publish.json?.code}`);

  step('P12: cấp entitlement cho tenant...');
  const entitlement = await api('PUT', `/api/v1/platform/tenants/${tenantId}/plugins/${PLUGIN_KEY}/entitlement`, {
    token: platformToken,
  });
  if (entitlement.status !== 200) {
    fail(`Grant entitlement thất bại: ${entitlement.status} ${JSON.stringify(entitlement.json)}`);
  }
  evidence.push(`ENTITLEMENT=${entitlement.json?.code}`);
}

function removePluginContainers() {
  const listed = docker(['ps', '-aq', '--filter', `name=openerp-plugin-${PLUGIN_KEY}-`]);
  const ids = (listed.stdout || '').trim().split(/\s+/).filter(Boolean);
  if (ids.length > 0) {
    docker(['rm', '-f', ...ids], { stdio: 'ignore' });
  }
}

async function teardownPreviousRun(platformToken, tenantToken, tenantId) {
  step('Dọn dẹp lần chạy trước (nếu có)...');
  const uninstall = await api('POST', `/api/v1/tenant/plugins/${PLUGIN_KEY}/uninstall`, { token: tenantToken });
  evidence.push(`PRE_UNINSTALL=${uninstall.status}`);
  const revoke = await api('DELETE', `/api/v1/platform/tenants/${tenantId}/plugins/${PLUGIN_KEY}/entitlement`,
    { token: platformToken });
  evidence.push(`PRE_REVOKE_ENTITLEMENT=${revoke.status}`);
  const remove = await api('DELETE', `/api/v1/platform/plugins/${PLUGIN_KEY}`, { token: platformToken });
  evidence.push(`PRE_DELETE_CATALOG=${remove.status}`);
  removePluginContainers();
}

async function installForTenant(tenantToken, tenantId) {
  step('T1: tenant cài plugin (build image ngoài transaction + deploy container)...');
  const install = await api('POST', `/api/v1/tenant/plugins/${PLUGIN_KEY}/install`, {
    token: tenantToken,
    body: { version: PLUGIN_VERSION },
  });
  if (install.status !== 200) {
    fail(`Install thất bại: ${install.status} ${JSON.stringify(install.json)}`);
  }
  let status = install.json.data;
  evidence.push(`INSTALL=${install.json.code} status=${status.status} steps=${(status.steps ?? []).map((s) => s.step).join(',')}`);

  if (status.status === 'INSTALL_FAILED') {
    fail(`Install saga failed: ${JSON.stringify(status)}`);
  }
  const deadline = Date.now() + 180_000;
  while (status.status === 'INSTALLING' && Date.now() < deadline) {
    await sleep(3_000);
    const poll = await api('GET', `/api/v1/plugins/operations/${status.operation_id}`, { token: tenantToken });
    status = poll.json?.data ?? status;
  }
  if (status.status !== 'ACTIVE') {
    fail(`Plugin không ACTIVE sau install: ${JSON.stringify(status)}`);
  }
  evidence.push(`LEDGER_STATUS=${status.status}`);
  return status;
}

function tenantShort(tenantId) {
  return tenantId.replaceAll('-', '').substring(0, 8);
}

async function verifyRuntime(tenantId) {
  step('Verify container, schema và dữ liệu tenant...');
  const short = tenantShort(tenantId);
  const container = `openerp-plugin-${PLUGIN_KEY}-${short}`;
  const schema = `tenant_${short}_${PLUGIN_KEY.replaceAll('-', '_')}`;

  const running = docker(['inspect', '--format', '{{.State.Running}}', container]);
  if ((running.stdout || '').trim() !== 'true') {
    const logs = docker(['logs', '--tail', '40', container]);
    fail(`Container ${container} không chạy. Logs:\n${logs.stdout}${logs.stderr}`);
  }
  evidence.push(`CONTAINER=${container} running=true`);

  let listening = false;
  for (let attempt = 0; attempt < 45; attempt += 1) {
    const logs = docker(['logs', container]);
    if ((logs.stdout || '').includes('Listening on') || (logs.stderr || '').includes('Listening on')) {
      listening = true;
      break;
    }
    await sleep(2_000);
  }
  if (!listening) {
    fail(`Container ${container} chưa log "Listening on" sau 90s`);
  }
  evidence.push('CONTAINER_LISTENING=true');

  const schemaCount = psql(`SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name='${schema}'`);
  if (schemaCount !== '1') {
    fail(`Schema ${schema} không tồn tại`);
  }
  const tableCount = psql(`SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${schema}' AND table_name='plg_sample_items'`);
  if (tableCount !== '1') {
    fail(`Bảng ${schema}.plg_sample_items không tồn tại (Flyway migration thất bại?)`);
  }
  const ledger = psql(`SELECT status || '|' || COALESCE(installed_version,'') FROM tenant_plugins WHERE tenant_id='${tenantId}' AND plugin_key='${PLUGIN_KEY}'`);
  evidence.push(`SCHEMA=${schema} TABLES_OK=1`);
  evidence.push(`LEDGER_ROW=${ledger}`);
  if (!ledger.startsWith('ACTIVE|')) {
    fail(`Ledger không ACTIVE: ${ledger}`);
  }
  return { container, schema };
}

async function main() {
  step(`TASK-344 E2E bắt đầu — plugin=${PLUGIN_KEY}@${PLUGIN_VERSION} base=${BASE_URL}`);
  ensureInfra();
  await ensureBackend();

  step('Đăng ký tenant + tenant admin qua public API...');
  const tenant = await ensureBusinessAccount(TENANT_EMAIL, 'E2E Tenant Admin', TENANT_SLUG);
  const tenantToken = await loginToken(TENANT_EMAIL);
  const tenantId = tenant.tenantId
    || psql(`SELECT tenant_id FROM user_tenants ut JOIN users u ON u.id=ut.user_id WHERE u.email='${TENANT_EMAIL}' LIMIT 1`);
  if (!tenantId) {
    fail('Không xác định được tenant_id');
  }
  evidence.push(`TENANT_ID=${tenantId} created=${tenant.created}`);

  step('Đăng ký platform admin (business account + seed dev-only)...');
  const platform = await ensureBusinessAccount(PLATFORM_EMAIL, 'E2E Platform Admin', `${TENANT_SLUG}-platform`);
  seedPlatformAdmin(platform.userId);
  const platformToken = await loginToken(PLATFORM_EMAIL);
  evidence.push('PLATFORM_TOKEN=OK');

  await teardownPreviousRun(platformToken, tenantToken, tenantId);

  const { bundle, manifest } = createAndPackagePlugin();
  await registerAndPublish(platformToken, tenantId, bundle, manifest);
  await installForTenant(tenantToken, tenantId);
  const runtime = await verifyRuntime(tenantId);

  if (!keep) {
    step('Uninstall plugin (giữ dữ liệu/schema) để dọn môi trường...');
    const uninstall = await api('POST', `/api/v1/tenant/plugins/${PLUGIN_KEY}/uninstall`, { token: tenantToken });
    evidence.push(`POST_UNINSTALL=${uninstall.status} ${uninstall.json?.code ?? ''}`);
    const containerGone = docker(['inspect', '--format', '{{.State.Running}}', runtime.container]);
    evidence.push(`CONTAINER_AFTER_UNINSTALL=${(containerGone.stdout || '').trim() || 'removed'}`);
  } else {
    step(`Giữ nguyên container ${runtime.container} (--keep).`);
  }

  writeEvidence('PASS');
  console.log('\n==========================================================');
  console.log('[E2E] PASS — CLI tạo plugin mẫu và cài thành công trên dev local:');
  console.log(`  - Plugin:    ${PLUGIN_KEY}@${PLUGIN_VERSION}`);
  console.log(`  - Tenant:    ${tenantId}`);
  console.log(`  - Container: ${runtime.container}`);
  console.log(`  - Schema:    ${runtime.schema}`);
  console.log('==========================================================');
  if (startedBackend) {
    console.log('[E2E] Backend do E2E khởi chạy vẫn đang chạy nền (logs/e2e/backend.log).');
  }
}

main().catch((error) => fail(error?.stack || error?.message || String(error)));
