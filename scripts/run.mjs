#!/usr/bin/env node
/**
 * Open-ERP cross-platform dev runner (Windows / macOS / Linux).
 * Single entry point for the root package.json scripts.
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const IS_WINDOWS = process.platform === 'win32';
const LOG_DIR = join(ROOT, 'logs');
const PID_FILE = join(ROOT, '.dev-pids.json');
const BACKEND_DIR = join(ROOT, 'src/backend');
const WEB_DIR = join(ROOT, 'src/frontend/web');
const MOBILE_DIR = join(ROOT, 'src/frontend/mobile');

const PROFILES = {
  minimal: [],
  kafka: ['--profile', 'kafka'],
  mongo: ['--profile', 'mongo'],
  storage: ['--profile', 'storage'],
  mail: ['--profile', 'mail'],
  registry: ['--profile', 'registry'],
  full: ['--profile', 'full'],
};

const SHELL_TOOLS = new Set(['npm', 'npx', 'mvn']);

function fail(message) {
  console.error(`[Open-ERP] ${message}`);
  process.exit(1);
}

function execute(tool, args, options = {}) {
  const needsShell = options.shell ?? (IS_WINDOWS && SHELL_TOOLS.has(tool));
  const command = needsShell ? [tool, ...args].join(' ') : tool;
  const commandArgs = needsShell ? [] : args;
  const result = spawnSync(command, commandArgs, {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env,
    ...options,
    shell: needsShell,
  });
  if (result.error) {
    fail(`Không chạy được "${tool}": ${result.error.message}`);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function capture(tool, args, options = {}) {
  return spawnSync(tool, args, { cwd: ROOT, encoding: 'utf8', ...options });
}

function runNode(relative) {
  execute(process.execPath, [join(ROOT, relative)]);
}

function mavenBinary() {
  return existsSync(join(BACKEND_DIR, IS_WINDOWS ? 'mvnw.cmd' : 'mvnw'))
    ? (IS_WINDOWS ? 'mvnw.cmd' : './mvnw')
    : 'mvn';
}

/** Launch spec shared by the foreground commands and the detached dev processes. */
function appSpec(name) {
  if (name === 'backend') {
    return {
      tool: mavenBinary(),
      args: ['quarkus:dev'],
      cwd: BACKEND_DIR,
      env: { JAVA_TOOL_OPTIONS: '-Dnet.bytebuddy.experimental=true' },
    };
  }
  if (name === 'web') {
    return { tool: 'npm', args: ['run', 'start', '--', '--port', '4200'], cwd: WEB_DIR, env: {} };
  }
  return { tool: 'npm', args: ['run', 'serve'], cwd: MOBILE_DIR, env: {} };
}

function ensureJwtKeys() {
  const key = join(BACKEND_DIR, 'src/main/resources/privateKey.pem');
  if (!existsSync(key)) {
    console.log('[Open-ERP] Chưa có khóa JWT — đang sinh khóa RSA dev...');
    runNode('scripts/dev/generate_jwt_keys.js');
  }
}

function ensureTestDatabase() {
  const sql = "SELECT 1 FROM pg_database WHERE datname='openerp_test'";
  const check = capture('docker', [
    'exec', 'openerp-postgres-primary', 'psql', '-U', 'openerp', '-d', 'openerp_dev', '-tAc', sql,
  ]);
  if (check.status === 0 && (check.stdout ?? '').trim().includes('1')) {
    console.log("[Open-ERP] Database 'openerp_test' đã tồn tại.");
    return;
  }
  execute('docker', [
    'exec', 'openerp-postgres-primary', 'psql', '-U', 'openerp', '-d', 'openerp_dev', '-c',
    'CREATE DATABASE openerp_test OWNER openerp',
  ]);
  console.log("[Open-ERP] Đã tạo database 'openerp_test'.");
}

const INFRA_PROFILES = [
  { name: 'infra', desc: 'PostgreSQL Primary + Redis (~300MB RAM)' },
  { name: 'infra:mail', desc: 'Tối thiểu + Mailpit SMTP', heavy: true },
  { name: 'infra:kafka', desc: 'Tối thiểu + Kafka & Kafka UI', heavy: true },
  { name: 'infra:mongo', desc: 'Tối thiểu + MongoDB Replica-Set', heavy: true },
  { name: 'infra:storage', desc: 'Tối thiểu + MinIO S3', heavy: true },
  { name: 'infra:registry', desc: 'Tối thiểu + Registry v2 (OCI local)', heavy: true },
  { name: 'infra:full', desc: 'Toàn bộ dịch vụ (RAM >= 8GB)', heavy: true },
  { name: 'infra:ps', desc: 'Xem trạng thái containers' },
  { name: 'infra:down', desc: 'Dừng toàn bộ hạ tầng' },
];

function infraProfileLines(predicate = () => true) {
  return INFRA_PROFILES.filter(predicate)
    .map(({ name, desc }) => `  npm run ${name.padEnd(15)}- ${desc}`);
}

function resolveProfile(profile) {
  const flags = PROFILES[profile];
  if (!flags) {
    fail(`Profile không hợp lệ: "${profile}". Chọn: ${Object.keys(PROFILES).join(', ')}`);
  }
  return flags;
}

function printInfraInfo(profile) {
  console.log('');
  console.log('==========================================================');
  console.log('Dịch vụ tối thiểu mặc định:');
  console.log('- PostgreSQL Primary:    localhost:5432 - user: openerp, db: openerp_dev');
  console.log('- PostgreSQL Test DB:    openerp_test - dùng riêng cho mvn test');
  console.log('- Redis:                 localhost:6379 - pass: openerp_redis_password');
  if (profile !== 'minimal') {
    console.log(`- Profile đang bật:      ${profile}`);
  }
  console.log('');
  console.log('Bật thêm dịch vụ nặng theo nhu cầu:');
  for (const line of infraProfileLines((entry) => entry.heavy)) {
    console.log(line);
  }
  console.log('==========================================================');
}

function infra(profile = 'minimal') {
  const flags = resolveProfile(profile);
  console.log(`[Open-ERP] Khởi động hạ tầng Docker (profile: ${profile})...`);
  execute('docker', ['compose', ...flags, 'up', '-d']);
  ensureTestDatabase();
  execute('docker', ['compose', 'ps']);
  printInfraInfo(profile);
}

function infraDown() {
  console.log('[Open-ERP] Dừng toàn bộ hạ tầng Docker...');
  execute('docker', ['compose', 'down']);
}

function infraPs() {
  execute('docker', ['compose', 'ps']);
}

function spawnDetached(name, spec) {
  mkdirSync(LOG_DIR, { recursive: true });
  const log = openSync(join(LOG_DIR, `dev-${name}.log`), 'a');
  const needsShell = IS_WINDOWS && SHELL_TOOLS.has(spec.tool);
  const command = needsShell ? [spec.tool, ...spec.args].join(' ') : spec.tool;
  const commandArgs = needsShell ? [] : spec.args;
  const child = spawn(command, commandArgs, {
    cwd: spec.cwd,
    env: { ...process.env, ...spec.env },
    shell: needsShell,
    detached: true,
    windowsHide: true,
    stdio: ['ignore', log, log],
  });
  child.unref();
  console.log(`[Open-ERP] ${name} đã khởi chạy (pid ${child.pid}) → logs/dev-${name}.log`);
  return child.pid;
}

function killTree(pid) {
  if (IS_WINDOWS) {
    spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' });
    return;
  }
  try {
    process.kill(-pid, 'SIGTERM');
  } catch {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      // process already gone
    }
  }
}

function readPids() {
  try {
    return JSON.parse(readFileSync(PID_FILE, 'utf8'));
  } catch {
    return null;
  }
}

function stopProcesses(verbose = true) {
  const pids = readPids();
  if (!pids) {
    if (verbose) {
      console.log('[Open-ERP] Không có tiến trình dev nào đang chạy (thiếu .dev-pids.json).');
    }
    return;
  }
  for (const [name, pid] of Object.entries(pids)) {
    if (typeof pid === 'number' && pid > 0) {
      killTree(pid);
      if (verbose) {
        console.log(`[Open-ERP] Đã dừng ${name} (pid ${pid}).`);
      }
    }
  }
  rmSync(PID_FILE, { force: true });
}

function runApp(name, message) {
  console.log(`[Open-ERP] ${message}`);
  const spec = appSpec(name);
  execute(spec.tool, spec.args, { cwd: spec.cwd, env: { ...process.env, ...spec.env } });
}

function backend() {
  ensureJwtKeys();
  runApp('backend', 'Khởi chạy Backend Quarkus Dev Mode (port 8088)...');
}

function web() {
  runApp('web', 'Khởi chạy Web Angular 22 (port 4200)...');
}

function mobile() {
  runApp('mobile', 'Khởi chạy Mobile Ionic 8 (port 8100)...');
}

async function isUp(url) {
  try {
    await fetch(url, { signal: AbortSignal.timeout(1_500) });
    return true;
  } catch {
    return false;
  }
}

async function dev(profile = 'mail') {
  const flags = resolveProfile(profile);
  console.log(`[Open-ERP] Khởi động hạ tầng (${profile}) và 3 tiến trình dev...`);
  execute('docker', ['compose', ...flags, 'up', '-d']);
  ensureTestDatabase();
  ensureJwtKeys();

  const previous = readPids() ?? {};
  const pids = {};
  const services = [
    {
      name: 'backend',
      url: 'http://localhost:8088/q/health/live',
      start: () => spawnDetached('backend', appSpec('backend')),
    },
    {
      name: 'web',
      url: 'http://localhost:4200',
      start: () => spawnDetached('web', appSpec('web')),
    },
    {
      name: 'mobile',
      url: 'http://localhost:8100',
      start: () => spawnDetached('mobile', appSpec('mobile')),
    },
  ];
  for (const service of services) {
    if (await isUp(service.url)) {
      console.log(`[Open-ERP] ${service.name} đã chạy sẵn — bỏ qua.`);
      if (typeof previous[service.name] === 'number') {
        pids[service.name] = previous[service.name];
      }
      continue;
    }
    pids[service.name] = service.start();
  }
  if (Object.keys(pids).length > 0) {
    writeFileSync(PID_FILE, `${JSON.stringify(pids, null, 2)}\n`);
  } else {
    rmSync(PID_FILE, { force: true });
  }

  console.log('');
  console.log('==========================================================');
  console.log('Hạ tầng sẵn sàng. Các ứng dụng (chờ 30-90 giây để build xong):');
  console.log('  - Backend Quarkus:  http://localhost:8088');
  console.log('  - Swagger UI:       http://localhost:8088/q/swagger-ui');
  console.log('  - Web Angular:      http://localhost:4200');
  console.log('  - Mobile Ionic:     http://localhost:8100');
  console.log('  - Mailpit (email):  http://localhost:8025');
  console.log('');
  console.log('Log:      logs/dev-backend.log, logs/dev-web.log, logs/dev-mobile.log');
  console.log('Dừng app: npm run dev:stop');
  console.log('Dừng hạ tầng: npm run infra:down');
  console.log('==========================================================');
}

function buildImages() {
  const registry = process.env.DOCKER_REGISTRY || 'openerp-registry.local';
  const tag = process.env.IMAGE_TAG || 'latest';
  console.log(`[Open-ERP] Đóng gói Docker images (registry: ${registry}, tag: ${tag})...`);
  execute('docker', ['build', '-f', 'deployments/docker/Dockerfile.backend', '-t',
    `${registry}/openerp-backend:${tag}`, '.']);
  execute('docker', ['build', '-f', 'deployments/docker/Dockerfile.web', '-t',
    `${registry}/openerp-web:${tag}`, '.']);
  console.log('[Open-ERP] Đóng gói images thành công.');
}

function deployDocker() {
  console.log('[Open-ERP] Triển khai bằng Docker Compose (deployments/docker/docker-compose.prod.yml)...');
  execute('docker', ['compose', '-f', 'deployments/docker/docker-compose.prod.yml', 'up', '-d', '--remove-orphans']);
  execute('docker', ['compose', '-f', 'deployments/docker/docker-compose.prod.yml', 'ps']);
}

function deployK8s(environment = 'staging') {
  const check = capture('kubectl', ['version', '--client=true']);
  if (check.error || check.status !== 0) {
    fail('Không tìm thấy kubectl. Vui lòng cài đặt kubectl!');
  }
  console.log(`[Open-ERP] Triển khai lên Kubernetes (overlay: ${environment})...`);
  execute('kubectl', ['apply', '-k', `deployments/k8s/overlays/${environment}`]);
  execute('kubectl', ['rollout', 'status', 'deployment/openerp-backend', '-n', `openerp-${environment}`,
    '--timeout=120s']);
  execute('kubectl', ['rollout', 'status', 'deployment/openerp-web', '-n', `openerp-${environment}`,
    '--timeout=120s']);
}

function clean() {
  const targets = [
    'src/backend/target',
    'src/frontend/web/dist',
    'src/frontend/web/.angular',
    'src/frontend/mobile/dist',
    'src/frontend/mobile/.angular',
    'logs',
    '.dev-pids.json',
  ];
  for (const target of targets) {
    rmSync(join(ROOT, target), { recursive: true, force: true });
  }
  console.log('[Open-ERP] Đã dọn build artifacts (target/, dist/, .angular/, logs/).');
}

function help() {
  console.log(`Open-ERP — npm scripts (đa nền tảng Windows/macOS/Linux)
=========================================================
Hạ tầng Docker:
${infraProfileLines().join('\n')}

Ứng dụng (live-coding):
  npm run backend          - Quarkus dev mode (port 8088)
  npm run web              - Angular 22 dev server (port 4200)
  npm run mobile           - Ionic 8 dev server (port 8100)
  npm run dev              - Hạ tầng (minimal + Mailpit) + 3 tiến trình nền (logs/)
  npm run dev:full         - TOÀN BỘ hạ tầng (Kafka, Mongo, MinIO, replica...) + 3 tiến trình
                             (lần đầu pull image ~1.5GB; cần RAM >= 8GB)
  npm run dev:stop         - Dừng 3 tiến trình dev

Build & Test:
  npm run backend:test     - JUnit/RestAssured trên PostgreSQL + Redis thật
  npm run backend:build    - Quarkus package (skip tests)
  npm run web:build        - Angular production build
  npm run mobile:build     - Ionic production build
  npm run cli:test         - Smoke test @open-erp/cli
  npm test                 - Backend + CLI tests
  npm run build            - Build cả 3 ứng dụng

E2E:
  npm run e2e:plugin       - CLI tạo plugin mẫu + cài lên dev local (Docker container)
  npm run e2e:plugin -- --skip-build   - Dùng lại dist/ đã build
  npm run e2e:plugin -- --keep         - Giữ container sau khi test

CLI & tiện ích:
  npm run cli -- <lệnh>    - @open-erp/cli (create/generate/package/...)
  npm run keys:jwt         - Sinh khóa JWT dev
  npm run clean            - Dọn target/, dist/, .angular/, logs/

Triển khai:
  npm run build:images     - Build Docker images Backend + Web
  npm run deploy:staging   - Docker Compose prod
  npm run deploy:prod -- production  - Kubernetes overlay`);
}

const handlers = {
  help: () => help(),
  infra: () => infra(process.argv[3]),
  'infra-down': () => infraDown(),
  'infra-ps': () => infraPs(),
  keys: () => runNode('scripts/dev/generate_jwt_keys.js'),
  backend: () => backend(),
  web: () => web(),
  mobile: () => mobile(),
  dev: () => dev(process.argv[3]),
  stop: () => stopProcesses(),
  'build-images': () => buildImages(),
  'deploy-docker': () => deployDocker(),
  'deploy-k8s': () => deployK8s(process.argv[3]),
  clean: () => clean(),
};

const [command] = process.argv.slice(2);
if (!command) {
  help();
  process.exit(0);
}
if (!handlers[command]) {
  console.error(`[Open-ERP] Lệnh không hợp lệ: "${command}"\n`);
  help();
  process.exit(1);
}
Promise.resolve()
  .then(() => handlers[command]())
  .catch((error) => fail(error?.message ?? String(error)));
