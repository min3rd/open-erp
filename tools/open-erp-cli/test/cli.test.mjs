import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const bin = fileURLToPath(new URL('../bin/open-erp.js', import.meta.url));

function runCli(args, cwd) {
  return execFileSync(process.execPath, [bin, ...args], { cwd, encoding: 'utf8' });
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
