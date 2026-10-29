import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile, execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const bin = fileURLToPath(new URL('../bin/open-erp.js', import.meta.url));

function runCli(args, cwd) {
  return execFileSync(process.execPath, [bin, ...args], { cwd, encoding: 'utf8' });
}

function runCliAsync(args, cwd) {
  return new Promise((resolve, reject) => {
    execFile(process.execPath, [bin, ...args], { cwd, encoding: 'utf8' }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`${error.message}\n${stderr}`));
      } else {
        resolve(stdout);
      }
    });
  });
}

test('create scaffolds a valid plugin project', () => {
  const root = mkdtempSync(join(tmpdir(), 'openerp-cli-'));
  const target = join(root, 'plugin');
  const output = runCli([
    'create', '--non-interactive', '--id', 's3cli-smoke', '--name', 'S3 CLI Smoke',
    '--target', target, '--git-init', 'false',
  ], root);
  assert.match(output, /Created plugin "s3cli-smoke"/);
  assert.ok(existsSync(join(target, 'plugin.json')));
  assert.ok(existsSync(join(target, 'pom.xml')));
  assert.ok(existsSync(join(target, 'migrations/V1.0.0__initial_schema.sql')));
  assert.ok(existsSync(join(target, 'deploy/Dockerfile')));
  const manifest = JSON.parse(readFileSync(join(target, 'plugin.json'), 'utf8'));
  assert.equal(manifest.id, 's3cli-smoke');
  assert.equal(manifest.schema_version, '2.0');
  assert.equal(manifest.template_version, '2.0.0');
  assert.equal(manifest.entities[0].name, 'SampleItem');
  assert.match(manifest.migrations[0].checksum, /^sha256:[a-f0-9]{64}$/);
  const pom = readFileSync(join(target, 'pom.xml'), 'utf8');
  for (const forbidden of ['hibernate-orm-panache', 'quarkus-jdbc-postgresql', 'quarkus-flyway', 'quarkus.datasource']) {
    assert.ok(!pom.includes(forbidden), `pom must not contain ${forbidden}`);
  }
  const validation = runCli(['validate'], target);
  assert.match(validation, /plugin.json OK/);
});

test('generate entity and ui-contribution update the manifest', () => {
  const root = mkdtempSync(join(tmpdir(), 'openerp-cli-gen-'));
  const target = join(root, 'plugin');
  runCli([
    'create', '--non-interactive', '--id', 's3cli-gen', '--name', 'S3 CLI Gen',
    '--target', target, '--git-init', 'false',
  ], root);
  runCli(['generate', 'entity', '--name', 'Invoice', '--fields', 'code:string,total:decimal'], target);
  const entityFile = join(target, 'src/main/java/com/vn9melody/openerp/plugins/s3cligen/Invoice.java');
  assert.ok(existsSync(entityFile));
  runCli(['generate', 'ui-contribution', '--slot', 'core.dashboard.widgets', '--render-mode', 'web-component'], target);
  const manifest = JSON.parse(readFileSync(join(target, 'plugin.json'), 'utf8'));
  assert.ok(manifest.entities.some((entity) => entity.name === 'Invoice'));
  assert.equal(manifest.ui_manifest.contributions.length, 2);
  assert.equal(manifest.ui_manifest.contributions[1].render_mode, 'WEB_COMPONENT');
  assert.ok(manifest.ui_manifest.contributions[1].tag_name);
  assert.match(runCli(['validate'], target), /plugin.json OK/);
});

test('generate crud emits Angular screen + Java CRUD and manifest queries', () => {
  const root = mkdtempSync(join(tmpdir(), 'openerp-cli-crud-'));
  const target = join(root, 'plugin');
  runCli([
    'create', '--non-interactive', '--id', 's3cli-crud', '--name', 'S3 CLI Crud',
    '--target', target, '--git-init', 'false',
  ], root);
  runCli(['generate', 'entity', '--name', 'Invoice', '--fields', 'code:string:required,total:decimal'], target);
  runCli(['generate', 'crud', '--entity', 'Invoice'], target);

  const base = 'src/main/java/com/vn9melody/openerp/plugins/s3clicrud';
  for (const file of [
    'src/main/java/com/vn9melody/openerp/plugins/s3clicrud/InvoiceDto.java',
    'src/main/java/com/vn9melody/openerp/plugins/s3clicrud/InvoiceService.java',
    'src/main/java/com/vn9melody/openerp/plugins/s3clicrud/InvoiceResource.java',
    'src/test/java/com/vn9melody/openerp/plugins/s3clicrud/InvoiceDtoTest.java',
    'web/src/app/features/invoice/invoice.service.ts',
    'web/src/app/features/invoice/invoice-crud.component.ts',
    'web/src/app/features/invoice/invoice-crud.component.html',
  ]) {
    assert.ok(existsSync(join(target, file)), `${file} must exist`);
  }
  assert.ok(!existsSync(join(target, base, 'InvoiceResource.spec.ts')),
    'frontend unit tests must not be generated');
  const manifest = JSON.parse(readFileSync(join(target, 'plugin.json'), 'utf8'));
  assert.ok(manifest.queries.some((query) => query.id === 's3cli-crud.invoice.create'));
  assert.ok(manifest.queries.some((query) => query.id === 's3cli-crud.invoice.delete'));
  const screen = manifest.ui_manifest.screens.find((item) => item.route === '/apps/s3cli-crud/invoice');
  assert.equal(screen.tag_name, 'op-s3cli-crud-invoice');
  assert.match(readFileSync(join(target, 'web/src/plugin-main.ts'), 'utf8'), /op-s3cli-crud-invoice/);
  assert.match(runCli(['validate'], target), /plugin.json OK/);
});

test('generate field and relation update manifest and migrations', () => {
  const root = mkdtempSync(join(tmpdir(), 'openerp-cli-fields-'));
  const target = join(root, 'plugin');
  runCli([
    'create', '--non-interactive', '--id', 's3cli-fields', '--name', 'S3 CLI Fields',
    '--target', target, '--git-init', 'false',
  ], root);
  runCli(['generate', 'entity', '--name', 'Invoice', '--fields', 'code:string:required'], target);
  runCli([
    'generate', 'field', '--entity', 'Invoice', '--name', 'status', '--type', 'enum',
    '--enum-values', 'ACTIVE,INACTIVE', '--required', 'true',
  ], target);
  runCli([
    'generate', 'relation', '--entity', 'Invoice', '--name', 'customer',
    '--target', 'core.user', '--storage', 'SOFT_REF', '--display-field', 'full_name',
  ], target);
  const manifest = JSON.parse(readFileSync(join(target, 'plugin.json'), 'utf8'));
  const invoice = manifest.entities.find((entity) => entity.name === 'Invoice');
  assert.ok(invoice.fields.some((field) => field.name === 'status'));
  assert.ok(manifest.relations.some((relation) => relation.name === 'customer'
    && relation.storage === 'SOFT_REF'));
  assert.ok(manifest.migrations.length >= 3);
  assert.match(runCli(['validate'], target), /plugin.json OK/);
});

test('inspect and package run without a built backend', () => {
  const root = mkdtempSync(join(tmpdir(), 'openerp-cli-pkg-'));
  const target = join(root, 'plugin');
  runCli([
    'create', '--non-interactive', '--id', 's3cli-pkg', '--name', 'S3 CLI Pkg',
    '--target', target, '--git-init', 'false',
  ], root);
  assert.match(runCli(['inspect'], target), /Validation: OK/);
  runCli(['package', '--skip-build'], target);
  assert.ok(existsSync(join(target, 'dist/checksums.txt')));
  assert.ok(existsSync(join(target, 'dist/release-manifest.json')));
});

test('create --with-web scaffolds a buildable Angular workspace (BUG-113)', () => {
  const root = mkdtempSync(join(tmpdir(), 'openerp-cli-web-'));
  const target = join(root, 'plugin');
  runCli([
    'create', '--non-interactive', '--id', 's3cli-web', '--name', 'S3 CLI Web',
    '--target', target, '--with-web', 'true', '--git-init', 'false',
  ], root);
  for (const file of [
    'web/package.json',
    'web/angular.json',
    'web/tsconfig.json',
    'web/tsconfig.app.json',
    'web/.postcssrc.json',
    'web/src/index.html',
    'web/src/plugin-main.ts',
    'web/src/styles.css',
    'web/src/app/plugin-screen.component.ts',
    'web/src/app/plugin-screen.component.html',
    'web/src/app/header-action.component.ts',
    'web/src/app/header-action.component.html',
    'web/src/app/translate.pipe.ts',
    'web/public/i18n/vi.json',
    'web/public/i18n/en.json',
  ]) {
    assert.ok(existsSync(join(target, file)), `${file} must exist`);
  }
  const angularJson = JSON.parse(readFileSync(join(target, 'web/angular.json'), 'utf8'));
  const project = Object.values(angularJson.projects)[0];
  assert.equal(project.architect.build.builder, '@angular/build:application');
  assert.equal(project.architect.build.options.tsConfig, 'tsconfig.app.json');
  const component = readFileSync(join(target, 'web/src/app/plugin-screen.component.ts'), 'utf8');
  assert.match(component, /imports: \[TranslatePipe\]/);
});

test('package --skip-build emits an ImageBuilder bundle.zip with app.jar first (BUG-112)', () => {
  const root = mkdtempSync(join(tmpdir(), 'openerp-cli-bundle-'));
  const target = join(root, 'plugin');
  runCli([
    'create', '--non-interactive', '--id', 's3cli-bundle', '--name', 'S3 CLI Bundle',
    '--target', target, '--packaging', 'bundle', '--git-init', 'false',
  ], root);
  const fakeJar = join(target, 'target/plugin-s3cli-bundle-1.0.0-SNAPSHOT-runner.jar');
  mkdirSync(join(target, 'target'), { recursive: true });
  writeFileSync(fakeJar, Buffer.alloc(2048, 7));
  mkdirSync(join(target, 'migrations'), { recursive: true });
  writeFileSync(join(target, 'migrations/V1.0.0__initial_schema.sql'), 'create table demo(id uuid);\n');
  runCli(['package', '--skip-build'], target);
  assert.ok(existsSync(join(target, 'dist/plugin-backend.jar')));
  const bundle = readFileSync(join(target, 'dist/bundle.zip'));
  assert.equal(bundle.readUInt32LE(0), 0x04034b50, 'bundle.zip must start with a local file header');
  const firstNameLength = bundle.readUInt16LE(26);
  assert.equal(bundle.subarray(30, 30 + firstNameLength).toString('utf8'), 'app.jar');
  assert.ok(bundle.includes(Buffer.from('V1.0.0__initial_schema.sql')), 'bundle must ship migration files');
  const manifest = JSON.parse(readFileSync(join(target, 'dist/release-manifest.json'), 'utf8'));
  assert.ok(manifest.artifacts.some((artifact) => artifact.file === 'bundle.zip'));
});

test('validate rejects bad field, slot and migration checksum offline', () => {
  const root = mkdtempSync(join(tmpdir(), 'openerp-cli-invalid-'));
  const target = join(root, 'plugin');
  runCli([
    'create', '--non-interactive', '--id', 's3cli-invalid', '--name', 'S3 CLI Invalid',
    '--target', target, '--git-init', 'false',
  ], root);
  const path = join(target, 'plugin.json');
  const manifest = JSON.parse(readFileSync(path, 'utf8'));
  manifest.entities[0].fields[0].type = 'nope';
  manifest.ui_manifest.contributions[0].slot = 'bad slot';
  manifest.migrations[0].checksum = `sha256:${'0'.repeat(64)}`;
  writeFileSync(path, JSON.stringify(manifest, null, 2));
  let failed = false;
  try {
    runCli(['validate'], target);
  } catch (error) {
    failed = true;
    assert.match(String(error.stderr), /invalid field type/);
    assert.match(String(error.stderr), /invalid slot syntax/);
    assert.match(String(error.stderr), /checksum mismatch/);
  }
  assert.equal(failed, true, 'offline validation must exit non-zero');
});

test('validate --core-url checks entity and slot registries', async () => {
  const root = mkdtempSync(join(tmpdir(), 'openerp-cli-remote-'));
  const target = join(root, 'plugin');
  runCli([
    'create', '--non-interactive', '--id', 's3cli-remote', '--name', 'S3 CLI Remote',
    '--target', target, '--git-init', 'false',
  ], root);
  runCli(['generate', 'relation', '--entity', 'SampleItem', '--name', 'owner',
    '--target', 'core.user', '--storage', 'SOFT_REF'], target);

  const requests = [];
  const server = createServer((req, res) => {
    requests.push(req.url);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, code: 'FOUND', data: {} }));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  try {
    const output = await runCliAsync([
      'validate', '--core-url', `http://127.0.0.1:${port}`, '--token', 'test-token',
    ], target);
    assert.match(output, /PASS entity:core\.user/);
    assert.match(output, /PASS slot:core\.layout\.header\.actions/);
    assert.ok(requests.some((url) => url.startsWith('/api/v1/plugins/entity-registry')));
    assert.ok(requests.some((url) => url.startsWith('/api/v1/plugins/ui-slots')));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('upgrade --check/--apply updates template metadata without overwriting files', () => {
  const root = mkdtempSync(join(tmpdir(), 'openerp-cli-upgrade-'));
  const target = join(root, 'plugin');
  runCli([
    'create', '--non-interactive', '--id', 's3cli-upgrade', '--name', 'S3 CLI Upgrade',
    '--target', target, '--git-init', 'false',
  ], root);
  const manifestPath = join(target, 'plugin.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const marker = join(target, 'README.md');
  writeFileSync(marker, 'custom readme');
  manifest.template_version = '1.0.0';
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  let failed = false;
  try {
    runCli(['upgrade', '--check'], target);
  } catch {
    failed = true;
  }
  assert.equal(failed, true, 'outdated template must fail --check');

  const output = runCli(['upgrade', '--apply', '--yes'], target);
  assert.match(output, /Backup:/);
  const updated = JSON.parse(readFileSync(manifestPath, 'utf8'));
  assert.equal(updated.template_version, '2.0.0');
  assert.equal(readFileSync(marker, 'utf8'), 'custom readme');
});

test('publish uploads a bundle and prints a registration payload', async () => {
  const root = mkdtempSync(join(tmpdir(), 'openerp-cli-pub-'));
  const target = join(root, 'plugin');
  runCli([
    'create', '--non-interactive', '--id', 's3cli-publish', '--name', 'S3 CLI Publish',
    '--target', target, '--git-init', 'false',
  ], root);
  const artifact = join(target, 'dist/bundle.zip');
  mkdirSync(join(target, 'dist'), { recursive: true });
  writeFileSync(artifact, Buffer.from('bundle-bytes'));

  let seen = null;
  const server = createServer((req, res) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      seen = {
        method: req.method,
        url: req.url,
        authorization: req.headers.authorization,
        body: Buffer.concat(chunks).toString('utf8'),
      };
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        code: 'PLUGIN_ARTIFACT_UPLOAD_SUCCESS',
        message: 'uploaded',
        params: {},
        data: { artifact_ref: 'ref-123', checksum: 'abc123', size_bytes: 12, file_name: 'bundle.zip' },
      }));
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  try {
    const output = await runCliAsync([
      'publish', '--source', 'bundle', '--artifact', artifact,
      '--registry', `http://127.0.0.1:${port}`, '--credential', 'test-token',
    ], target);
    assert.ok(seen, 'server received a request');
    assert.equal(seen.method, 'POST');
    assert.equal(seen.url, '/api/v1/tenant/plugins/artifacts/upload');
    assert.equal(seen.authorization, 'Bearer test-token');
    assert.match(seen.body, /bundle\.zip/);
    assert.match(output, /ref-123/);
    assert.match(output, /abc123/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
