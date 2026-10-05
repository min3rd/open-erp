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
  assert.ok(existsSync(join(target, 'src/main/resources/db/plugin-migration/V1.0.0__initial_schema.up.sql')));
  assert.ok(existsSync(join(target, 'deploy/Dockerfile')));
  const manifest = JSON.parse(readFileSync(join(target, 'plugin.json'), 'utf8'));
  assert.equal(manifest.id, 's3cli-smoke');
  assert.equal(manifest.entities[0].name, 'SampleItem');
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
  assert.equal(manifest.ui_manifest.contributions.length, 1);
  assert.equal(manifest.ui_manifest.contributions[0].render_mode, 'WEB_COMPONENT');
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
    'web/src/main.ts',
    'web/src/styles.css',
    'web/src/app/plugin-screen.component.ts',
    'web/src/app/plugin-screen.component.html',
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
  runCli(['package', '--skip-build'], target);
  assert.ok(existsSync(join(target, 'dist/plugin-backend.jar')));
  const bundle = readFileSync(join(target, 'dist/bundle.zip'));
  assert.equal(bundle.readUInt32LE(0), 0x04034b50, 'bundle.zip must start with a local file header');
  const firstNameLength = bundle.readUInt16LE(26);
  assert.equal(bundle.subarray(30, 30 + firstNameLength).toString('utf8'), 'app.jar');
  const manifest = JSON.parse(readFileSync(join(target, 'dist/release-manifest.json'), 'utf8'));
  assert.ok(manifest.artifacts.some((artifact) => artifact.file === 'bundle.zip'));
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
